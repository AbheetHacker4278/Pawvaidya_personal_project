import mongoose from 'mongoose';
import 'dotenv/config';
import connectdb from '../config/mongodb.js';
import { sendHealthReport } from '../utils/healthReport.js';
import { observeJob } from '../utils/jobObserver.js';

const testObserveJob = async () => {
    try {
        await connectdb();
        console.log("Database Connected. Testing observeJob...");

        // Simulate the 3PM job trigger
        await observeJob('Health Report 3PM', async () => {
            console.log("Triggering 3:00 PM Health Report (SIMULATED)...");
            await sendHealthReport();
        });

        console.log("observeJob execution complete.");
    } catch (error) {
        console.error("DEBUG ERROR:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testObserveJob();
