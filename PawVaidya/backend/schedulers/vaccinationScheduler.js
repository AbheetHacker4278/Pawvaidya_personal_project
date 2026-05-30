import cron from 'node-cron';
import vaccineRecordModel from '../models/vaccineRecordModel.js';
import userModel from '../models/userModel.js';
import { transporter } from '../config/nodemailer.js';

export const initVaccinationScheduler = () => {
    console.log("Initializing Automated Vaccination Reminder Scheduler...");

    // Run every day at 9:00 AM (Asia/Kolkata timezone)
    cron.schedule('0 9 * * *', async () => {
        console.log("Running Daily Vaccination Reminder Check...");
        try {
            const today = new Date();
            
            // Calculate start and end for exactly 7 days from now
            const sevenDaysFromNowStart = new Date(today);
            sevenDaysFromNowStart.setDate(today.getDate() + 7);
            sevenDaysFromNowStart.setHours(0, 0, 0, 0);
            
            const sevenDaysFromNowEnd = new Date(today);
            sevenDaysFromNowEnd.setDate(today.getDate() + 7);
            sevenDaysFromNowEnd.setHours(23, 59, 59, 999);

            // Calculate start and end for exactly 1 day from now
            const oneDayFromNowStart = new Date(today);
            oneDayFromNowStart.setDate(today.getDate() + 1);
            oneDayFromNowStart.setHours(0, 0, 0, 0);

            const oneDayFromNowEnd = new Date(today);
            oneDayFromNowEnd.setDate(today.getDate() + 1);
            oneDayFromNowEnd.setHours(23, 59, 59, 999);

            // 1. Process 7-day reminders
            const records7d = await vaccineRecordModel.find({
                nextDosageDate: { $gte: sevenDaysFromNowStart, $lte: sevenDaysFromNowEnd },
                remindersEnabled: true,
                'remindersSent.sevenDaysPrior': false
            });

            for (const record of records7d) {
                const user = await userModel.findById(record.userId);
                if (user && user.email) {
                    try {
                        await transporter.sendMail({
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: `🐾 Reminder: Vaccination Due for ${record.petName} in 7 Days!`,
                            html: `
                                <h2>Vaccination Reminder: 7 Days Left</h2>
                                <p>Dear PawVaidya User,</p>
                                <p>This is a friendly reminder that your pet <strong>${record.petName}</strong> is due for the booster dose of the <strong>${record.vaccineName}</strong> vaccine in 7 days (on ${new Date(record.nextDosageDate).toLocaleDateString()}).</p>
                                <p>Vaccination Details:</p>
                                <ul>
                                    <li><strong>Pet Name:</strong> ${record.petName}</li>
                                    <li><strong>Vaccine Name:</strong> ${record.vaccineName}</li>
                                    <li><strong>Batch/Lot ID:</strong> ${record.batchId || 'N/A'}</li>
                                    <li><strong>Last Administered:</strong> ${new Date(record.administrationDate).toLocaleDateString()}</li>
                                </ul>
                                <p>Please schedule an appointment with our expert veterinarians soon to ensure continuous protection.</p>
                                <p>Best regards,<br/><strong>PawVaidya Support Team</strong></p>
                            `
                        });
                        record.remindersSent.sevenDaysPrior = true;
                        await record.save();
                        console.log(`[Vaccination Scheduler] Sent 7-day reminder to ${user.email} for ${record.petName}`);
                    } catch (mailErr) {
                        console.error(`Failed to send 7-day email for record ${record._id}:`, mailErr.message);
                    }
                }
            }

            // 2. Process 1-day reminders
            const records1d = await vaccineRecordModel.find({
                nextDosageDate: { $gte: oneDayFromNowStart, $lte: oneDayFromNowEnd },
                remindersEnabled: true,
                'remindersSent.oneDayPrior': false
            });

            for (const record of records1d) {
                const user = await userModel.findById(record.userId);
                if (user && user.email) {
                    try {
                        await transporter.sendMail({
                            from: process.env.SENDER_EMAIL,
                            to: user.email,
                            subject: `🚨 Urgent: Vaccination Due for ${record.petName} Tomorrow!`,
                            html: `
                                <h2>Urgent Vaccination Reminder: Tomorrow</h2>
                                <p>Dear PawVaidya User,</p>
                                <p>This is an urgent reminder that your pet <strong>${record.petName}</strong> is due for the <strong>${record.vaccineName}</strong> vaccine tomorrow (on ${new Date(record.nextDosageDate).toLocaleDateString()}).</p>
                                <p>Vaccination Details:</p>
                                <ul>
                                    <li><strong>Pet Name:</strong> ${record.petName}</li>
                                    <li><strong>Vaccine Name:</strong> ${record.vaccineName}</li>
                                    <li><strong>Batch/Lot ID:</strong> ${record.batchId || 'N/A'}</li>
                                    <li><strong>Last Administered:</strong> ${new Date(record.administrationDate).toLocaleDateString()}</li>
                                </ul>
                                <p>Please schedule a priority appointment immediately to keep your pet safe.</p>
                                <p>Best regards,<br/><strong>PawVaidya Support Team</strong></p>
                            `
                        });
                        record.remindersSent.oneDayPrior = true;
                        await record.save();
                        console.log(`[Vaccination Scheduler] Sent 1-day reminder to ${user.email} for ${record.petName}`);
                    } catch (mailErr) {
                        console.error(`Failed to send 1-day email for record ${record._id}:`, mailErr.message);
                    }
                }
            }

        } catch (err) {
            console.error("Error in vaccination reminder cron job:", err.message);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log("Vaccination Scheduler Active: Runs daily at 9:00 AM (Asia/Kolkata)");
};
