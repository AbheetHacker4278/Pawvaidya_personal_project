import cron from 'node-cron';
import ComplaintTicket from '../models/complaintTicketModel.js';
import CSEmployee from '../models/csEmployeeModel.js';

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

// Runs every minute to check for assignment timeouts
export const initCSAssignmentScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            // Broadcast tickets already show for all online agents.
            // We just need to check if any have been unassigned for too long to alert admin if needed.
            const overdueTickets = await ComplaintTicket.find({
                assignedTo: null,
                requestedAt: { $lt: fiveMinutesAgo }
            });

            for (const ticket of overdueTickets) {
                // Potential logic: alert admin or escalate priority
                // For now, let's just add a system note if not already added
                const hasSystemWarning = ticket.timeline.some(t => t.event === 'unassigned_warning');
                if (!hasSystemWarning) {
                    await ComplaintTicket.findByIdAndUpdate(ticket._id, {
                        $push: {
                            timeline: {
                                event: 'unassigned_warning',
                                message: 'No agent has accepted this query within 5 minutes. High priority.',
                                by: 'system',
                                timestamp: new Date()
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('CS Assignment Scheduler Error:', error);
        }
    });
};
