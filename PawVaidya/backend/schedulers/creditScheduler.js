import cron from 'node-cron';
import userModel from '../models/userModel.js';
import transactionModel from '../models/transactionModel.js';

export const initCreditScheduler = () => {
    console.log("Initializing Automated Obsidian Credit Repayment Scheduler...");

    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log("Triggering Daily Obsidian Credit Repayment Check...");
        try {
            const today = new Date();
            
            // Find users who have spent credit and their repayment deadline has passed
            const delinquentUsers = await userModel.find({
                "subscription.plan": "Obsidian",
                "creditLine.status": "Active",
                "creditLine.spent": { $gt: 0 },
                "creditLine.repaymentDeadline": { $lt: today }
            });

            if (delinquentUsers.length > 0) {
                console.log(`Found ${delinquentUsers.length} delinquent Obsidian users. Flagging accounts...`);
                
                for (const user of delinquentUsers) {
                    // Update the status to Suspended due to non-repayment
                    user.creditLine.status = 'Suspended';
                    await user.save();

                    // Log the delinquency transaction
                    const transaction = new transactionModel({
                        userId: user._id,
                        type: 'Other',
                        amount: user.creditLine.spent,
                        description: 'Interest-Free Credit Line Suspended due to Repayment Deadline Exceeded',
                        paymentMethod: 'System Automations'
                    });
                    await transaction.save();

                    console.log(`User ${user.email} flagged for delinquency. Unpaid amount: ₹${user.creditLine.spent}`);
                }
            } else {
                console.log("No delinquent Obsidian users found for today.");
            }
        } catch (error) {
            console.error("Error in Automated Obsidian Credit Repayment Scheduler:", error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log("Credit Repayment Scheduler Active: 12:00 AM Daily (Asia/Kolkata)");
};
