import CSEmployee from '../models/csEmployeeModel.js';
import CSQAScore from '../models/csQAScoreModel.js';
import ComplaintTicket from '../models/complaintTicketModel.js';
import CSRating from '../models/csRatingModel.js';

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

            // Update Level and Rank
            const level = Math.floor(totalXP / 1000) + 1;
            let rank = 'Bronze';
            if (totalXP >= 15000) rank = 'Diamond';
            else if (totalXP >= 5000) rank = 'Platinum';
            else if (totalXP >= 1500) rank = 'Gold';

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

        // Award XP for high QA scores
        let bonusXP = 0;
        if (score >= 95) bonusXP = 150;
        else if (score >= 90) bonusXP = 100;
        else if (score >= 80) bonusXP = 50;

        if (bonusXP > 0) {
            await CSEmployee.findByIdAndUpdate(employeeId, {
                $inc: { xpPoints: bonusXP }
            });
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
