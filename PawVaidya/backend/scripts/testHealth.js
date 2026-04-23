import mongoose from 'mongoose';
import 'dotenv/config';
import connectdb from '../config/mongodb.js';
import { sendHealthReport } from '../utils/healthReport.js';

const testHealth = async () => {
    try {
        console.log("Starting Manual Health Report Test...");

        // Connect to Database
        await connectdb();
        console.log("Database Connected.");

        // Wait a bit for other services to initialize if needed
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = await sendHealthReport();

        if (result) {
            console.log("✅ Test Successful: Health Report Sent.");
        } else {
            console.log("❌ Test Failed: Health Report not sent.");
        }

    } catch (error) {
        console.error("DEBUG ERROR:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testHealth();
