import ComplaintTicket from '../models/complaintTicketModel.js';
import userModel from '../models/userModel.js';
import CSEmployee from '../models/csEmployeeModel.js';
import CSRating from '../models/csRatingModel.js';
import TicketMessage from '../models/ticketMessageModel.js';
import jwt from 'jsonwebtoken';
import { uploadFile } from "../utils/uploadHelper.js";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const findBestAgent = async (excludeAgentId) => {
    try {
        const query = { isOnline: true, status: 'active' };
        if (excludeAgentId) query._id = { $ne: excludeAgentId };

        const agents = await CSEmployee.find(query).sort({ activeTicketsCount: 1 });
        return agents.length > 0 ? agents[0]._id : null;
    } catch (error) {
        console.error('findBestAgent error:', error);
        return null;
    }
};

// ─── USER ACTIONS ──────────────────────────────────────────────────────────────

// POST /api/complaint/create
export const createTicket = async (req, res) => {
    try {
        const { userId, category, title, description, priority } = req.body;
        let { userName, userEmail } = req.body;

        if (!userId || !category || !title || !description) {
            return res.json({ success: false, message: 'Missing required fields.' });
        }

        // Fetch user details if not provided
        if (!userName || !userEmail) {
            const user = await userModel.findById(userId);
            if (user) {
                userName = userName || user.name;
                userEmail = userEmail || user.email;
            }
        }

        if (!userEmail) {
            return res.json({ success: false, message: 'User email is required for ticket validation.' });
        }

        const ticket = await ComplaintTicket.create({
            userId,
            userName: userName || 'User',
            userEmail: userEmail || '',
            category,
            title,
            description,
            priority: priority || 'medium',
            requestedAgent: null, // Broadcast to all
            requestedAt: new Date(),
            timeline: [{
                event: 'created',
                message: `Ticket raised. Waiting for an agent to accept.`,
                by: 'user',
                timestamp: new Date()
            }]
        });

        return res.json({ success: true, ticket, message: 'Complaint ticket created successfully.' });
    } catch (error) {
        console.error('createTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/complaint/my-tickets
export const getMyTickets = async (req, res) => {
    try {
        const { userId } = req.body;
        const tickets = await ComplaintTicket.find({ userId })
            .populate('assignedTo', 'name profilePic')
            .sort({ createdAt: -1 });
        return res.json({ success: true, tickets });
    } catch (error) {
        console.error('getMyTickets error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/complaint/ticket/:id
export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await ComplaintTicket.findById(id)
            .populate('assignedTo', 'name profilePic averageRating joinedAt')
            .populate('userId', 'name email')
            .populate('rating');
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });
        return res.json({ success: true, ticket });
    } catch (error) {
        console.error('getTicketById error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/complaint/rate/:id  –  user rates employee after ticket closure
export const rateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, rating, review } = req.body;

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        // Accept closure from either the boolean flag OR the status field (handles legacy records)
        const isEffectivelyClosed = ticket.isClosed === true ||
            ticket.status === 'resolved' ||
            ticket.status === 'closed';

        if (!isEffectivelyClosed) return res.json({ success: false, message: 'Ticket is not closed yet.' });

        // Backfill isClosed for tickets that were closed by status but flag was not persisted
        if (!ticket.isClosed) {
            await ComplaintTicket.findByIdAndUpdate(id, { isClosed: true });
        }

        if (ticket.isRated) return res.json({ success: false, message: 'This ticket has already been rated.' });
        if (String(ticket.userId) !== String(userId)) return res.json({ success: false, message: 'Unauthorized.' });
        if (!ticket.assignedTo) return res.json({ success: false, message: 'No employee assigned.' });

        const csRating = await CSRating.create({
            ticketId: id,
            userId,
            employeeId: ticket.assignedTo,
            rating,
            review: review || ''
        });

        await ComplaintTicket.findByIdAndUpdate(id, { rating: csRating._id, isRated: true });

        // Update employee average rating
        const employee = await CSEmployee.findById(ticket.assignedTo);
        if (employee) {
            const newTotal = employee.totalRatings + 1;
            const newAvg = ((employee.averageRating * employee.totalRatings) + rating) / newTotal;

            await CSEmployee.findByIdAndUpdate(employee._id, {
                averageRating: newAvg,
                totalRatings: newTotal,
                $inc: {
                    fiveStarCount: (rating === 5 ? 1 : 0)
                }
            });

            // Automatically sync XP after rating
            const { syncAgentXP } = await import('./csGamificationController.js');
            await syncAgentXP(employee._id);
        }

        return res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
        console.error('rateEmployee error:', error);
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/complaint/user-close/:id
export const closeTicketByUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });
        if (String(ticket.userId) !== String(userId)) return res.json({ success: false, message: 'Unauthorized.' });
        if (ticket.isClosed) return res.json({ success: false, message: 'Ticket is already closed.' });

        await ComplaintTicket.findByIdAndUpdate(id, {
            status: 'closed',
            isClosed: true,
            closedAt: new Date(),
            $push: {
                timeline: {
                    event: 'closed',
                    message: 'Ticket closed by user.',
                    by: 'user',
                    timestamp: new Date()
                }
            }
        });

        // If an agent was assigned, decrement their active count
        if (ticket.assignedTo) {
            await CSEmployee.findByIdAndUpdate(ticket.assignedTo, { $inc: { activeTicketsCount: -1 } });
        }

        // Emit socket alert
        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('ticket-closed', { ticketId: id });
        } catch (socketError) {
            console.error('Error emitting ticket-closed socket event:', socketError);
        }

        return res.json({ success: true, message: 'Ticket closed successfully.' });
    } catch (error) {
        console.error('closeTicketByUser error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── CS EMPLOYEE ACTIONS ───────────────────────────────────────────────────────


// PUT /api/complaint/update-status/:id
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.employeeId;
        const { status, note, internalNotes } = req.body;

        const validStatuses = ['open', 'in_progress', 'scheduled_call', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) return res.json({ success: false, message: 'Invalid status.' });

        const ticket = await ComplaintTicket.findById(id);
        if (note) {
            const unprofessionalWords = ['stupid', 'idiot', 'dumb', 'fool', 'shut up', 'useless', 'whatever', 'nonsense', 'crap', 'garbage', 'lazy', 'incompetent', 'hate', 'annoyed', 'irresponsible', 'bother', 'waste of time'];
            const lowercaseNote = note.toLowerCase();
            const flaggedWords = unprofessionalWords.filter(word => lowercaseNote.includes(word));
            if (flaggedWords.length > 0 && employeeId) {
                await CSEmployee.findByIdAndUpdate(employeeId, {
                    $push: {
                        monitoringAlerts: {
                            alertType: 'language_violation',
                            message: `Unprofessional tone/vocabulary detected during status update on Ticket #${id}: "${flaggedWords.join(', ')}". Note text: "${note}"`,
                            severity: 'high',
                            timestamp: new Date()
                        }
                    }
                });
            }
        }
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        const timelineEvent = {
            event: 'status_change',
            message: note || `Status changed to "${status}".`,
            by: 'employee',
            timestamp: new Date()
        };

        const updateData = {
            status,
            $push: { timeline: timelineEvent }
        };
        if (!ticket.assignedTo) updateData.assignedTo = employeeId;
        if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

        await ComplaintTicket.findByIdAndUpdate(id, updateData);

        return res.json({ success: true, message: 'Status updated.' });
    } catch (error) {
        console.error('updateTicketStatus error:', error);
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/complaint/schedule-call/:id
export const scheduleCall = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.employeeId;
        const { date, time, link, notes } = req.body;
        if (!date || !time) return res.json({ success: false, message: 'Date and time are required.' });

        await ComplaintTicket.findByIdAndUpdate(id, {
            scheduledCall: { date, time, link: link || '', notes: notes || '' },
            status: 'scheduled_call',
            $push: {
                timeline: {
                    event: 'call_scheduled',
                    message: `Voice call scheduled for ${date} at ${time}.`,
                    by: 'employee',
                    timestamp: new Date()
                }
            }
        });

        return res.json({ success: true, message: 'Call scheduled successfully.' });
    } catch (error) {
        console.error('scheduleCall error:', error);
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/complaint/close/:id
export const closeTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.employeeId;
        const { closingNote } = req.body;

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });
        if (ticket.isClosed) return res.json({ success: false, message: 'Ticket is already closed.' });

        const resolvedAt = new Date();
        const handleTime = Math.floor((resolvedAt - ticket.createdAt) / 1000); // seconds

        await ComplaintTicket.findByIdAndUpdate(id, {
            status: 'resolved',
            isClosed: true,
            closedAt: resolvedAt,
            resolvedAt: resolvedAt,
            handleTime: handleTime,
            closedBy: employeeId,
            $push: {
                timeline: {
                    event: 'closed',
                    message: closingNote || 'Ticket closed by Customer Service Employee.',
                    by: 'employee',
                    timestamp: resolvedAt
                }
            }
        });

        // Calculate XP based on priority
        let xpReward = 50;
        if (ticket.priority === 'urgent') xpReward = 100;
        else if (ticket.priority === 'high') xpReward = 75;

        // Update employee stats
        const agent = await CSEmployee.findById(employeeId);
        if (agent) {
            const newTotalResolved = agent.totalTicketsResolved + 1;
            const newAvgHandleTime = ((agent.avgHandleTime * agent.totalTicketsResolved) + handleTime) / newTotalResolved;
            await CSEmployee.findByIdAndUpdate(employeeId, {
                totalTicketsResolved: newTotalResolved,
                avgHandleTime: newAvgHandleTime,
                $inc: { activeTicketsCount: -1 }
            });

            // Automatically sync XP after closing ticket
            const { syncAgentXP } = await import('./csGamificationController.js');
            await syncAgentXP(employeeId);
        }

        // Emit socket alert
        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('ticket-closed', { ticketId: id });
        } catch (socketError) {
            console.error('Error emitting ticket-closed socket event:', socketError);
        }

        // Automated Post-Ticket QA Audit
        try {
            const messages = await TicketMessage.find({ ticketId: id }).sort({ createdAt: 1 });
            const thread = messages.map(m => `${m.senderName} (${m.senderType}): ${m.message}`).join('\n');

            if (thread && thread.trim()) {
                const completion = await openai.chat.completions.create({
                    model: "z-ai/glm-5.1",
                    messages: [{
                        role: "user",
                        content: `Analyze the following customer support chat transcript. Score the agent's performance out of 10 on four KPIs:
1. communication (tone, clarity, professionalism)
2. technicalKnowledge (understanding of system, accurate information)
3. empathy (handling owner anxiety, polite phrasing)
4. resolutionQuality (effectiveness of solution offered or escalation)

Transcript:
${thread}

Return a JSON object containing:
{
    "communication": 1-10,
    "technicalKnowledge": 1-10,
    "empathy": 1-10,
    "resolutionQuality": 1-10,
    "coachingFeedback": "detailed constructive feedback string"
}
Respond ONLY with valid JSON. Do not include markdown code block formatting.`
                    }],
                    temperature: 1,
                    top_p: 1,
                    max_tokens: 16384,
                    stream: false
                });

                const resText = completion.choices[0]?.message?.content || '';
                const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);

                if (parsed) {
                    const kpis = {
                        communication: Number(parsed.communication) || 7,
                        technicalKnowledge: Number(parsed.technicalKnowledge) || 7,
                        empathy: Number(parsed.empathy) || 7,
                        resolutionQuality: Number(parsed.resolutionQuality) || 7
                    };
                    const totalScore = Math.round(((kpis.communication + kpis.technicalKnowledge + kpis.empathy + kpis.resolutionQuality) / 40) * 100);
                    const feedback = parsed.coachingFeedback || 'Automated QA completed.';

                    // Save to database CSQAScore
                    const CSQAScore = (await import('../models/csQAScoreModel.js')).default;
                    await CSQAScore.create({
                        ticketId: id,
                        employeeId,
                        score: totalScore,
                        feedback,
                        kpis
                    });

                    // Update ticket object
                    await ComplaintTicket.findByIdAndUpdate(id, {
                        aiQaAudit: {
                            score: totalScore,
                            empathyScore: kpis.empathy * 10,
                            professionalismScore: kpis.communication * 10,
                            scriptAdherenceScore: kpis.technicalKnowledge * 10,
                            coachingFeedback: feedback,
                            auditedAt: new Date()
                        }
                    });
                }
            }
        } catch (qaErr) {
            console.error('[AI QA Audit] Failed:', qaErr.message);
        }

        return res.json({ success: true, message: 'Ticket resolved. XP Reward: ' + xpReward });
    } catch (error) {
        console.error('closeTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/complaint/add-note/:id  –  employee adds a timeline note
export const addTimelineNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!note) return res.json({ success: false, message: 'Note cannot be empty.' });
        const unprofessionalWords = ['stupid', 'idiot', 'dumb', 'fool', 'shut up', 'useless', 'whatever', 'nonsense', 'crap', 'garbage', 'lazy', 'incompetent', 'hate', 'annoyed', 'irresponsible', 'bother', 'waste of time'];
        const lowercaseNote = note.toLowerCase();
        const flaggedWords = unprofessionalWords.filter(word => lowercaseNote.includes(word));
        if (flaggedWords.length > 0) {
            const employeeId = req.employeeId;
            if (employeeId) {
                await CSEmployee.findByIdAndUpdate(employeeId, {
                    $push: {
                        monitoringAlerts: {
                            alertType: 'language_violation',
                            message: `Unprofessional tone/vocabulary detected on Ticket #${id}: "${flaggedWords.join(', ')}". Note text: "${note}"`,
                            severity: 'high',
                            timestamp: new Date()
                        }
                    }
                });
            }
        }

        await ComplaintTicket.findByIdAndUpdate(id, {
            $push: {
                timeline: {
                    event: 'note',
                    message: note,
                    by: 'employee',
                    timestamp: new Date()
                }
            }
        });

        return res.json({ success: true, message: 'Note added.' });
    } catch (error) {
        console.error('addTimelineNote error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/complaint/employee/queue
export const getEmployeeQueue = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        let query = {};
        if (employee.isMaster) {
            // Master CS Agent only sees tickets assigned to them, or open tickets escalated to master
            query = {
                $or: [
                    { assignedTo: employeeId },
                    {
                        assignedTo: null,
                        status: 'open',
                        rejectedBy: { $ne: employeeId },
                        isEscalatedToMaster: true
                    }
                ]
            };
        } else {
            // Normal CS Agent sees tickets assigned to them, or open tickets not escalated to master
            query = {
                $or: [
                    { assignedTo: employeeId },
                    {
                        assignedTo: null,
                        status: 'open',
                        rejectedBy: { $ne: employeeId },
                        isEscalatedToMaster: { $ne: true }
                    }
                ]
            };
        }

        const tickets = await ComplaintTicket.find(query).populate('userId', 'name email').sort({ updatedAt: -1 });
        return res.json({ success: true, tickets });
    } catch (error) {
        console.error('getEmployeeQueue error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/complaint/employee/requests
export const getIncomingRequests = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        let query = {};
        if (employee.isMaster) {
            // Master CS Agent only sees requests escalated to master
            query = {
                assignedTo: null,
                status: 'open',
                rejectedBy: { $ne: employeeId },
                isEscalatedToMaster: true
            };
        } else {
            // Normal CS Agent sees requests not escalated to master
            query = {
                assignedTo: null,
                status: 'open',
                rejectedBy: { $ne: employeeId },
                isEscalatedToMaster: { $ne: true }
            };
        }

        const requests = await ComplaintTicket.find(query).populate('userId', 'name email').sort({ requestedAt: -1 });

        return res.json({ success: true, requests });
    } catch (error) {
        console.error('getIncomingRequests error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/complaint/accept
export const acceptTicket = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { ticketId } = req.body;
        const ticket = await ComplaintTicket.findById(ticketId);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });
        if (ticket.assignedTo) return res.json({ success: false, message: 'Ticket already accepted by another agent.' });

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        // Normal agents shouldn't directly accept escalated tickets
        if (ticket.isEscalatedToMaster && !employee.isMaster) {
            return res.json({ success: false, message: 'This ticket is escalated to the Master CS Agent and cannot be accepted by a normal agent.' });
        }

        await ComplaintTicket.findByIdAndUpdate(ticketId, {
            assignedTo: employeeId,
            status: 'in_progress',
            requestedAgent: null, // Clear request flags if any
            requestedAt: null,
            $push: {
                timeline: {
                    event: 'accepted',
                    message: 'Ticket accepted by agent.',
                    by: 'employee',
                    timestamp: new Date()
                }
            }
        });

        await CSEmployee.findByIdAndUpdate(employeeId, { $inc: { activeTicketsCount: 1 } });

        return res.json({ success: true, message: 'Ticket accepted.' });
    } catch (error) {
        console.error('acceptTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/complaint/reject
export const rejectTicket = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { ticketId } = req.body;

        await ComplaintTicket.findByIdAndUpdate(ticketId, {
            $addToSet: { rejectedBy: employeeId }, // Add to rejected list for this agent
            $push: {
                timeline: {
                    event: 'rejected',
                    message: `Agent rejected query. Remaining agents can still accept.`,
                    by: 'employee',
                    timestamp: new Date()
                }
            }
        });

        return res.json({ success: true, message: 'Ticket hidden from your view.' });
    } catch (error) {
        console.error('rejectTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/complaint/escalate/:id
export const escalateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.employeeId;
        const { note } = req.body;

        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        // Check if assigned to this agent (or allowed to escalate)
        if (ticket.assignedTo && String(ticket.assignedTo) !== String(employeeId)) {
            return res.json({ success: false, message: 'You are not assigned to this ticket.' });
        }

        // Decrement activeTicketsCount for the current agent if they were assigned
        if (ticket.assignedTo) {
            await CSEmployee.findByIdAndUpdate(ticket.assignedTo, { $inc: { activeTicketsCount: -1 } });
        }

        ticket.assignedTo = null; // Unassign so Master CS Agent can accept it
        ticket.isEscalatedToMaster = true;
        ticket.status = 'open'; // Reset status to open/escalated
        ticket.timeline.push({
            event: 'escalated',
            message: note || 'Ticket escalated to Master CS Agent.',
            by: 'employee',
            timestamp: new Date()
        });

        await ticket.save();

        // Emit socket alert
        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('ticket-escalated', { ticketId: id });
        } catch (socketError) {
            console.error('Error emitting ticket-escalated socket event:', socketError);
        }

        return res.json({ success: true, message: 'Ticket escalated to Master CS Agent successfully.', ticket });
    } catch (error) {
        console.error('escalateTicket error:', error);
        res.json({ success: false, message: error.message });
    }
};

const getSenderDetails = async (req) => {
    const cstoken = req.headers.cstoken;
    if (cstoken) {
        try {
            const decoded = jwt.verify(cstoken, process.env.JWT_SECRET);
            const employee = await CSEmployee.findById(decoded.id);
            if (employee) {
                return { senderId: employee._id, senderType: 'cs_agent', senderName: employee.name };
            }
        } catch (e) { }
    }

    const token = req.headers.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);
            if (user) {
                return { senderId: user._id, senderType: 'user', senderName: user.name };
            }
        } catch (e) { }
    }
    return null;
};

export const getTicketMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const sender = await getSenderDetails(req);
        if (!sender) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        const messages = await TicketMessage.find({ ticketId: id }).sort({ createdAt: 1 });
        return res.json({ success: true, messages });
    } catch (error) {
        console.error('getTicketMessages error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const sendTicketMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, messageType, fileUrl, fileName, fileSize } = req.body;

        const sender = await getSenderDetails(req);
        if (!sender) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        let sentimentAnalysis = { score: 0, label: 'neutral', deEscalationTip: '' };
        if (sender.senderType === 'user' && message && message.trim()) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "deepseek-ai/deepseek-v4-pro",
                    messages: [{
                        role: "user",
                        content: `Analyze the sentiment of the following support message from a pet owner on PawVaidya: "${message}". 
                        Return a JSON object containing:
                        {
                            "score": -1.0 to 1.0 (float rating negativity/positivity),
                            "label": "happy" | "neutral" | "anxious" | "angry",
                            "deEscalationTip": "If label is anxious or angry, provide a short, specific de-escalation tip for the agent (e.g. how to reassure the owner). If label is neutral or happy, this can be empty."
                        }
                        Respond ONLY with valid JSON. Do not include markdown code block formatting.`
                    }],
                    temperature: 1,
                    top_p: 0.95,
                    max_tokens: 2000,
                    chat_template_kwargs: { "thinking": false },
                    stream: false
                });
                const resText = completion.choices[0]?.message?.content || '';
                const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                if (parsed) {
                    sentimentAnalysis = {
                        score: Number(parsed.score) || 0,
                        label: parsed.label || 'neutral',
                        deEscalationTip: parsed.deEscalationTip || ''
                    };
                }
            } catch (err) {
                console.warn('[Sentiment AI] Failed:', err.message);
            }
        }

        const newMessage = await TicketMessage.create({
            ticketId: id,
            senderId: sender.senderId,
            senderType: sender.senderType,
            senderName: sender.senderName,
            message: message || '',
            messageType: messageType || 'text',
            fileUrl,
            fileName,
            fileSize,
            sentimentAnalysis
        });

        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('receive-ticket-message', newMessage);
        } catch (socketError) {
            console.error('Error emitting ticket message via socket:', socketError);
        }

        return res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error('sendTicketMessage error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const logCallToTimeline = async (req, res) => {
    try {
        const { id } = req.params;
        const { event, message } = req.body;
        const sender = await getSenderDetails(req);
        if (!sender) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        const ticket = await ComplaintTicket.findByIdAndUpdate(id, {
            $push: {
                timeline: {
                    event: event || 'note',
                    message: message || 'Voice call occurred.',
                    by: sender.senderType === 'cs_agent' ? 'employee' : 'user',
                    timestamp: new Date()
                }
            }
        }, { new: true });

        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('ticket-updated');
        } catch (socketError) {
            console.error('Error emitting ticket update event:', socketError);
        }

        return res.json({ success: true, ticket });
    } catch (error) {
        console.error('logCallToTimeline error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const uploadTicketChatFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = req.file;

        const sender = await getSenderDetails(req);
        if (!sender) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        if (!file) {
            return res.json({ success: false, message: "No file uploaded" });
        }

        const uploadResult = await uploadFile(file, 'ticket_chat_files');

        const messageType = uploadResult.type === 'image' ? 'image' :
            (file.mimetype.toLowerCase().startsWith('video/') ? 'video' : 'file');

        const newMessage = await TicketMessage.create({
            ticketId: id,
            senderId: sender.senderId,
            senderType: sender.senderType,
            senderName: sender.senderName,
            message: req.body.message || `Sent a file: ${file.originalname}`,
            messageType,
            fileUrl: uploadResult.url,
            fileName: file.originalname,
            fileSize: file.size
        });

        try {
            const { getIO } = await import('../socketServer.js');
            const io = getIO();
            io.to(`ticket-${id}`).emit('receive-ticket-message', newMessage);
        } catch (socketError) {
            console.error('Error emitting ticket message via socket:', socketError);
        }

        return res.json({ success: true, message: newMessage });
    } catch (error) {
        console.error('uploadTicketChatFile error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const getAutocompleteSuggestions = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await TicketMessage.find({ ticketId: id }).sort({ createdAt: -1 }).limit(10);
        // Reverse to chronological order
        const thread = messages.reverse().map(m => `${m.senderName} (${m.senderType}): ${m.message}`).join('\n');

        let suggestions = [
            "How can I assist you with your pet's appointment today?",
            "Let me check our active vet schedule for you.",
            "I apologize for the wait. Let me fetch those details immediately."
        ];

        if (thread && thread.trim()) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "z-ai/glm-5.1",
                    messages: [{
                        role: "user",
                        content: `You are an AI assistant helping a Customer Support agent on PawVaidya, a premium online vet care platform.
Given the following recent support chat history:
${thread}

Suggest 3 short, helpful, professional, and context-specific completion response options for the agent to send.
Each suggestion must be clear, concise, and fit the current conversation context perfectly.
Return ONLY a JSON array of strings containing exactly 3 options. Do not include markdown formatting or backticks.
Example format:
["Option 1", "Option 2", "Option 3"]`
                    }],
                    temperature: 1,
                    top_p: 1,
                    max_tokens: 16384,
                    stream: false
                });
                const resText = completion.choices[0]?.message?.content || '';
                const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                if (Array.isArray(parsed) && parsed.length >= 3) {
                    suggestions = parsed.slice(0, 3);
                }
            } catch (err) {
                console.warn('[AI Autocomplete] Failed, using fallbacks:', err.message);
            }
        }

        return res.json({ success: true, suggestions });
    } catch (error) {
        console.error('getAutocompleteSuggestions error:', error);
        res.json({ success: false, message: error.message });
    }
};

export const getVetHandoffSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await ComplaintTicket.findById(id);
        if (!ticket) return res.json({ success: false, message: 'Ticket not found.' });

        const messages = await TicketMessage.find({ ticketId: id }).sort({ createdAt: 1 });
        const thread = messages.map(m => `${m.senderName} (${m.senderType}): ${m.message}`).join('\n');

        let summary = "No transcript available to summarize.";

        if (thread && thread.trim()) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "z-ai/glm-5.1",
                    messages: [{
                        role: "user",
                        content: `You are a clinical veterinary assistant on PawVaidya.
Given the following conversation between the pet owner and the customer service agent:
Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}

Conversation Thread:
${thread}

Compile a concise Clinical Synopsis for Vet Escalation. It must contain:
1. Primary clinical/behavioral concern or reason for escalation.
2. Reported symptoms, diet changes, or medication history mentioned.
3. Timeline of onset and severity level.
4. Key agent response notes and the customer's disposition.

Format your output in clean Markdown with clear headings.`
                    }],
                    temperature: 1,
                    top_p: 1,
                    max_tokens: 16384,
                    stream: false
                });
                summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
            } catch (err) {
                console.error('[AI Vet Handoff] Failed:', err.message);
                summary = `Failed to generate automated synopsis due to API error: ${err.message}`;
            }
        } else {
            summary = `### Clinical Synopsis for Vet Escalation\n\n**Primary Concern:** ${ticket.description}\n\n*No chat transcript available to analyze.*`;
        }

        return res.json({ success: true, summary });
    } catch (error) {
        console.error('getVetHandoffSummary error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/complaint/ticket/:id/sentiment
export const getTicketSentimentAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await TicketMessage.find({ ticketId: id }).sort({ createdAt: 1 });
        const userMessages = messages.filter(m => m.senderType === 'user');

        if (userMessages.length === 0) {
            return res.json({
                success: true,
                sentimentScore: 0,
                label: 'neutral',
                isCritical: false,
                deEscalationTip: '',
                messageCount: 0,
                history: []
            });
        }

        // Calculate average score and construct history
        let totalScore = 0;
        let count = 0;
        let latestLabel = 'neutral';
        let latestDeEscalationTip = '';
        const history = [];

        userMessages.forEach(m => {
            if (m.sentimentAnalysis) {
                const score = typeof m.sentimentAnalysis.score === 'number' ? m.sentimentAnalysis.score : 0;
                totalScore += score;
                count++;
                if (m.sentimentAnalysis.label) {
                    latestLabel = m.sentimentAnalysis.label;
                }
                if (m.sentimentAnalysis.deEscalationTip) {
                    latestDeEscalationTip = m.sentimentAnalysis.deEscalationTip;
                }
                history.push({
                    messageId: m._id,
                    score,
                    label: m.sentimentAnalysis.label || 'neutral',
                    timestamp: m.createdAt
                });
            }
        });

        const averageScore = count > 0 ? (totalScore / count) : 0;
        
        // Critical conditions:
        // 1. Average score is highly negative (<= -0.5)
        // 2. Or the last 2 user messages are both angry/anxious
        // 3. Or the latest user message is highly angry (score <= -0.7)
        let isCritical = averageScore <= -0.5;
        if (history.length >= 2) {
            const lastTwo = history.slice(-2);
            if (lastTwo.every(h => h.label === 'angry' || h.label === 'anxious')) {
                isCritical = true;
            }
        }
        if (history.length >= 1) {
            const lastOne = history[history.length - 1];
            if (lastOne.label === 'angry' && lastOne.score <= -0.7) {
                isCritical = true;
            }
        }

        return res.json({
            success: true,
            sentimentScore: parseFloat(averageScore.toFixed(2)),
            label: latestLabel,
            isCritical,
            deEscalationTip: latestDeEscalationTip,
            messageCount: count,
            history: history.slice(-5) // return last 5 user messages sentiment for trending
        });
    } catch (error) {
        console.error('getTicketSentimentAnalysis error:', error);
        res.json({ success: false, message: error.message });
    }
};

