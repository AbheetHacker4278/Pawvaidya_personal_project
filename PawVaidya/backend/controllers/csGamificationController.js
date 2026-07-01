import CSEmployee from '../models/csEmployeeModel.js';
import CSQAScore from '../models/csQAScoreModel.js';
import ComplaintTicket from '../models/complaintTicketModel.js';
import CSRating from '../models/csRatingModel.js';
import { getIO } from '../socketServer.js';

export const syncAgentXP = async (employeeId) => {
    try {
        const employee = await CSEmployee.findById(employeeId);
        if (!employee) return null;

        let totalXP = 0;

        // 1. Tickets Resolved
        const tickets = await ComplaintTicket.find({
            assignedTo: employeeId,
            status: { $in: ['resolved', 'closed'] }
        });

        for (const ticket of tickets) {
            let xp = 50; // Base
            if (ticket.priority === 'urgent') xp = 100;
            else if (ticket.priority === 'high') xp = 75;

            if (ticket.resolvedAt && ticket.createdAt) {
                const diffMs = ticket.resolvedAt - ticket.createdAt;
                if (diffMs < 2 * 60 * 60 * 1000) xp += 25;
            }
            totalXP += xp;
        }

        // 2. Ratings
        const ratings = await CSRating.find({ employeeId });
        const ratingXP = ratings.reduce((acc, r) => acc + (r.rating * 15), 0);
        totalXP += ratingXP;

        // 3. QA Scores
        const qaScores = await CSQAScore.find({ employeeId });
        const qaXP = qaScores.reduce((acc, q) => {
            if (q.score >= 95) return acc + 200;
            if (q.score >= 90) return acc + 100;
            if (q.score >= 80) return acc + 50;
            return acc;
        }, 0);
        totalXP += qaXP;

        // 4. Milestone Bonuses
        const milestoneBonus = Math.floor(tickets.length / 50) * 500;
        totalXP += milestoneBonus;

        // 5. Manual Admin Bonuses
        const manualBonuses = employee.rewards?.reduce((acc, r) => acc + (r.xpBonus || 0), 0) || 0;
        totalXP += manualBonuses;

        // Update Level and Rank
        const level = Math.floor(totalXP / 1000) + 1;
        let rank = 'Bronze';
        if (totalXP >= 20000) rank = 'Diamond';
        else if (totalXP >= 12000) rank = 'Platinum';
        else if (totalXP >= 8000) rank = 'Gold';
        else if (totalXP >= 4000) rank = 'Silver';

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, {
            xpPoints: totalXP,
            level,
            rank,
            totalTicketsResolved: tickets.length,
            averageRating: ratings.length ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) : 0
        }, { new: true });

        // Broadcast update via socket
        try {
            getIO().emit('gamification-update', { employeeId, xpPoints: totalXP, level, rank });
        } catch (socketErr) {
            console.error('Socket emission failed during syncAgentXP:', socketErr);
        }

        return updatedEmployee;
    } catch (error) {
        console.error('syncAgentXP error:', error);
        return null;
    }
};

// POST /api/cs/gamification/recalculate-all
export const recalculateAllXP = async (req, res) => {
    try {
        const employees = await CSEmployee.find({ status: { $ne: 'suspended' } });
        const results = [];

        for (const employee of employees) {
            let totalXP = 0;

            // 1. Tickets Resolved (Scale by Priority + Efficiency)
            const tickets = await ComplaintTicket.find({
                assignedTo: employee._id,
                status: { $in: ['resolved', 'closed'] }
            });

            for (const ticket of tickets) {
                let xp = 50; // Base
                if (ticket.priority === 'urgent') xp = 100;
                else if (ticket.priority === 'high') xp = 75;

                // Efficiency Bonus (if resolved within 2 hours)
                if (ticket.resolvedAt && ticket.createdAt) {
                    const diffMs = ticket.resolvedAt - ticket.createdAt;
                    if (diffMs < 2 * 60 * 60 * 1000) xp += 25; // +25 XP for quick resolve (<2h)
                }
                totalXP += xp;
            }

            // 2. Ratings (Rating * 15 XP to make it more impactful)
            const ratings = await CSRating.find({ employeeId: employee._id });
            const ratingXP = ratings.reduce((acc, r) => acc + (r.rating * 15), 0);
            totalXP += ratingXP;

            // 3. QA Scores
            const qaScores = await CSQAScore.find({ employeeId: employee._id });
            const qaXP = qaScores.reduce((acc, q) => {
                if (q.score >= 95) return acc + 200;
                if (q.score >= 90) return acc + 100;
                if (q.score >= 80) return acc + 50;
                return acc;
            }, 0);
            totalXP += qaXP;

            // 4. Milestone Bonuses (Every 50 resolved tickets = +500 XP)
            const milestoneBonus = Math.floor(tickets.length / 50) * 500;
            totalXP += milestoneBonus;

            // 5. Manual Admin Bonuses (from awards)
            const manualBonuses = employee.rewards?.reduce((acc, r) => acc + (r.xpBonus || 0), 0) || 0;
            totalXP += manualBonuses;

            // Update Level and Rank
            const level = Math.floor(totalXP / 1000) + 1;
            let rank = 'Bronze';
            if (totalXP >= 20000) rank = 'Diamond';
            else if (totalXP >= 12000) rank = 'Platinum';
            else if (totalXP >= 8000) rank = 'Gold';
            else if (totalXP >= 4000) rank = 'Silver';

            await CSEmployee.findByIdAndUpdate(employee._id, {
                xpPoints: totalXP,
                level,
                rank,
                totalTicketsResolved: tickets.length,
                averageRating: ratings.length ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) : 0
            });

            results.push({ name: employee.name, xp: totalXP, rank, level, tickets: tickets.length });
        }

        return res.json({ success: true, message: 'Historical XP and Ranks synced for all agents!', results });
    } catch (error) {
        console.error('recalculateAllXP error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/gamification/leaderboard
export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await CSEmployee.find({ status: 'active' })
            .select('name profilePic level xpPoints totalTicketsResolved averageRating rank')
            .sort({ xpPoints: -1 })
            .limit(10);

        return res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('getLeaderboard error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/gamification/qa-score
export const submitQAScore = async (req, res) => {
    try {
        const { ticketId, employeeId, score, feedback, kpis } = req.body;
        const adminId = req.admin?.id; // From authAdmin middleware (optional for Master Admin)

        if (!ticketId || !employeeId || score === undefined) {
            return res.json({ success: false, message: 'Missing required fields.' });
        }

        const qaScore = await CSQAScore.create({
            ticketId,
            employeeId,
            adminId,
            score,
            feedback,
            kpis
        });

        let bonusXP = 0;
        if (score >= 95) bonusXP = 150;
        else if (score >= 90) bonusXP = 100;
        else if (score >= 80) bonusXP = 50;

        if (bonusXP > 0) {
            await syncAgentXP(employeeId);
        }

        return res.json({ success: true, message: `QA Score submitted. Bonus XP: ${bonusXP}`, qaScore });
    } catch (error) {
        console.error('submitQAScore error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/gamification/performance/:employeeId
export const getEmployeePerformance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const employee = await CSEmployee.findById(employeeId)
            .select('xpPoints level rank totalTicketsResolved averageRating avgHandleTime fiveStarCount');

        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        // Get recent QA scores
        const recentQA = await CSQAScore.find({ employeeId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('ticketId', 'title category');

        // Get ranking position
        const higherCount = await CSEmployee.countDocuments({ xpPoints: { $gt: employee.xpPoints }, status: 'active' });
        const position = higherCount + 1;

        return res.json({
            success: true, performance: {
                ...employee._doc,
                position,
                recentQA
            }
        });
    } catch (error) {
        console.error('getEmployeePerformance error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-gamification/race-arena
export const getRaceArena = async (req, res) => {
    try {
        const agents = await CSEmployee.find({ status: 'active' })
            .select('name email profilePic level xpPoints totalTicketsResolved averageRating rank isOnline rewards avgHandleTime')
            .sort({ xpPoints: -1 });

        return res.json({ success: true, agents });
    } catch (error) {
        console.error('getRaceArena error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs-gamification/award-reward
export const awardReward = async (req, res) => {
    try {
        const { employeeId, type, value, message, xpBonus } = req.body;

        if (!employeeId || !type || !value) {
            return res.json({ success: false, message: 'Missing employeeId, type, or value.' });
        }

        const employee = await CSEmployee.findById(employeeId);
        if (!employee) {
            return res.json({ success: false, message: 'Employee not found.' });
        }

        // Add to rewards array
        employee.rewards.push({
            type,
            value,
            message: message || '',
            xpBonus: xpBonus ? Number(xpBonus) : 0,
            grantedAt: new Date()
        });

        await employee.save();

        // Apply XP bonus logic by calling syncAgentXP (the xpBonus is already saved in the rewards array above)
        if (xpBonus && Number(xpBonus) > 0) {
            await syncAgentXP(employee._id);
        } else {
            // Emitting global update manually if no XP bonus but reward was given
            try {
                getIO().emit('gamification-update', { 
                    employeeId: employee._id, 
                    xpPoints: employee.xpPoints, 
                    level: employee.level, 
                    rank: employee.rank 
                });
            } catch (socketErr) {
                console.error('Socket emission failed for manual gamification update:', socketErr);
            }
        }

        if (type === 'bonus') {
            const bonusNum = Number(value);
            if (!isNaN(bonusNum)) {
                employee.adminIncentive = {
                    amount: (employee.adminIncentive?.amount || 0) + bonusNum,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // expires in 30 days
                };
                await employee.save();
            }
        }

        return res.json({ 
            success: true, 
            message: 'Reward granted!', 
            employee 
        });
    } catch (error) {
        console.error('awardReward error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-gamification/fraud-detection
export const detectFraud = async (req, res) => {
    try {
        const agents = await CSEmployee.find({ status: 'active' });
        const flaggedAgents = [];

        for (const agent of agents) {
            const flags = [];
            
            // Rule 1: Suspiciously fast resolution times with high volume
            if (agent.totalTicketsResolved > 5 && agent.avgHandleTime > 0 && agent.avgHandleTime < 120) { // less than 2 minutes average
                flags.push(`Extremely low average handle time (${Math.floor(agent.avgHandleTime)}s) across ${agent.totalTicketsResolved} tickets. Possible stat padding.`);
            }

            // Rule 2: Perfect 5.0 rating with a suspicious volume
            if (agent.totalRatings >= 5 && agent.averageRating === 5) {
                flags.push('Perfect 5.0 rating across multiple ratings. Potential rating manipulation ring.');
            }
            
            // Rule 3: High ticket volume but no ratings
            if (agent.totalTicketsResolved > 20 && agent.totalRatings === 0) {
                flags.push('High volume of closed tickets with 0 customer ratings. Potential "silent closing" of active queries.');
            }

            if (flags.length > 0) {
                flaggedAgents.push({
                    agentId: agent._id,
                    name: agent.name,
                    profilePic: agent.profilePic,
                    xpPoints: agent.xpPoints,
                    rank: agent.rank,
                    flags
                });
            }
        }

        return res.json({ success: true, flaggedAgents });
    } catch (error) {
        console.error('detectFraud error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs-gamification/mentorship-matrix
export const getMentorshipMatrix = async (req, res) => {
    try {
        const mentors = await CSEmployee.find({ status: 'active', rank: { $in: ['Diamond', 'Platinum', 'Gold'] } }).sort({ xpPoints: -1 });
        const mentees = await CSEmployee.find({ 
            status: 'active', 
            $or: [
                { rank: 'Bronze' }, 
                { averageRating: { $lt: 4.0, $gt: 0 } },
                { totalTicketsResolved: { $lt: 5 } }
            ] 
        }).sort({ xpPoints: 1 });

        const pairings = [];
        const mentorCount = mentors.length;
        
        if (mentorCount > 0 && mentees.length > 0) {
            // Filter out agents who are somehow in both arrays (e.g. Bronze but no tickets)
            const cleanMentees = mentees.filter(m => !mentors.some(mentor => String(mentor._id) === String(m._id)));
            
            cleanMentees.forEach((mentee, index) => {
                const mentor = mentors[index % mentorCount];
                
                // Determine weakness
                let weakness = 'Low overall XP and Rank (Bronze)';
                if (mentee.averageRating > 0 && mentee.averageRating < 4.0) weakness = 'Low Customer Satisfaction (Rating < 4.0)';
                if (mentee.avgHandleTime > 1800) weakness = 'High resolution time (>30 mins)'; 

                pairings.push({
                    mentee: {
                        id: mentee._id,
                        name: mentee.name,
                        rank: mentee.rank,
                        profilePic: mentee.profilePic,
                        weakness,
                        averageRating: mentee.averageRating,
                        xpPoints: mentee.xpPoints
                    },
                    mentor: {
                        id: mentor._id,
                        name: mentor.name,
                        rank: mentor.rank,
                        profilePic: mentor.profilePic,
                        averageRating: mentor.averageRating,
                        xpPoints: mentor.xpPoints
                    }
                });
            });
        }

        return res.json({ success: true, pairings });
    } catch (error) {
        console.error('getMentorshipMatrix error:', error);
        res.json({ success: false, message: error.message });
    }
};
