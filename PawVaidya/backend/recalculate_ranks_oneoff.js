import mongoose from 'mongoose';
import 'dotenv/config';
import connectdb from './config/mongodb.js';
import CSEmployee from './models/csEmployeeModel.js';
import CSQAScore from './models/csQAScoreModel.js';
import ComplaintTicket from './models/complaintTicketModel.js';
import CSRating from './models/csRatingModel.js';

const run = async () => {
    try {
        await connectdb();
        const employees = await CSEmployee.find({});
        console.log(`Found ${employees.length} employees`);
        
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
            if (totalXP >= 20000) rank = 'Diamond';
            else if (totalXP >= 12000) rank = 'Platinum';
            else if (totalXP >= 8000) rank = 'Gold';
            else if (totalXP >= 4000) rank = 'Silver';

            console.log(`Employee: ${employee.name}, XP: ${totalXP}, Level: ${level}, Rank: ${rank}`);
            await CSEmployee.findByIdAndUpdate(employee._id, {
                xpPoints: totalXP,
                level,
                rank,
                totalTicketsResolved: tickets.length,
                averageRating: ratings.length ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length) : 0
            });
        }
        
        console.log("Ranks updated successfully!");
    } catch (error) {
        console.error("Recalculation script failed:", error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

run();
