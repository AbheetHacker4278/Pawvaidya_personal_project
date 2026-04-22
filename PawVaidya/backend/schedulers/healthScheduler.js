import cron from 'node-cron';
import { sendHealthReport } from '../utils/healthReport.js';

export const initHealthScheduler = () => {
    console.log("Initializing Automated Health Report Scheduler...");

    // 1st Mail: Morning 10:00 AM
    cron.schedule('0 10 * * *', () => {
        console.log("Triggering 10:00 AM Health Report...");
        sendHealthReport();
    }, {
        timezone: "Asia/Kolkata"
    });

    // 2nd Mail: Afternoon 3:00 PM (15:00)
    cron.schedule('0 15 * * *', () => {
        console.log("Triggering 3:00 PM Health Report...");
        sendHealthReport();
    }, {
        timezone: "Asia/Kolkata"
    });

    // 3rd Mail: Night 10:15 PM (22:15)
    cron.schedule('15 22 * * *', () => {
        console.log("Triggering 10:15 PM Health Report...");
        sendHealthReport();
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log("Health Scheduler Active: 10:00 AM, 3:00 PM, 10:15 PM (Asia/Kolkata)");
};
