import ComplaintTicket from '../models/complaintTicketModel.js';
import userModel from '../models/userModel.js';
import CSEmployee from '../models/csEmployeeModel.js';
import CSRating from '../models/csRatingModel.js';

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
        if (!ticket.isClosed) return res.json({ success: false, message: 'Ticket is not closed yet.' });
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

            const updateObj = { averageRating: newAvg, totalRatings: newTotal };
            // Increment 5-star count if applicable
            if (rating === 5) {
                updateObj.$inc = { fiveStarCount: 1 };
                // Actually if I use findByIdAndUpdate with $inc I can't mix it with direct assignment easily in some versions of mongoose
                // Better approach:
                await CSEmployee.findByIdAndUpdate(employee._id, {
                    averageRating: newAvg,
                    totalRatings: newTotal,
                    $inc: { fiveStarCount: (rating === 5 ? 1 : 0) }
                });
            } else {
                await CSEmployee.findByIdAndUpdate(employee._id, { averageRating: newAvg, totalRatings: newTotal });
            }
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

        return res.json({ success: true, message: 'Ticket closed successfully.' });
    } catch (error) {
        console.error('closeTicketByUser error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─── CS EMPLOYEE ACTIONS ───────────────────────────────────────────────────────

// GET /api/complaint/employee/queue
export const getEmployeeQueue = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const tickets = await ComplaintTicket.find({
            $or: [
                { assignedTo: employeeId },
                {
                    assignedTo: null,
                    status: 'open',
                    rejectedBy: { $ne: employeeId }
                }
            ]
        }).populate('userId', 'name email').sort({ updatedAt: -1 });
        return res.json({ success: true, tickets });
    } catch (error) {
        console.error('getEmployeeQueue error:', error);
        res.json({ success: false, message: error.message });
    }
};

// PUT /api/complaint/update-status/:id
export const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = req.employeeId;
        const { status, note, internalNotes } = req.body;

        const validStatuses = ['open', 'in_progress', 'scheduled_call', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) return res.json({ success: false, message: 'Invalid status.' });

        const ticket = await ComplaintTicket.findById(id);
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

        await ComplaintTicket.findByIdAndUpdate(id, {
            status: 'closed',
            isClosed: true,
            closedAt: new Date(),
            closedBy: employeeId,
            $push: {
                timeline: {
                    event: 'closed',
                    message: closingNote || 'Ticket closed by Customer Service Employee.',
                    by: 'employee',
                    timestamp: new Date()
                }
            }
        });

        // Increment employee resolved count
        await CSEmployee.findByIdAndUpdate(employeeId, { $inc: { totalTicketsResolved: 1 } });

        return res.json({ success: true, message: 'Ticket closed successfully. The user can now rate your support.' });
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

// GET /api/complaint/employee/requests
export const getIncomingRequests = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        // Find tickets where assignedTo is null and NOT rejected by this agent
        const requests = await ComplaintTicket.find({
            assignedTo: null,
            status: 'open',
            rejectedBy: { $ne: employeeId }
        }).populate('userId', 'name email').sort({ requestedAt: -1 });

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
