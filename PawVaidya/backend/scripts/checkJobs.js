import mongoose from 'mongoose';
import 'dotenv/config';
import connectdb from '../config/mongodb.js';
import backgroundJobModel from '../models/backgroundJobModel.js';

const checkJobs = async () => {
    try {
        await connectdb();
        const jobs = await backgroundJobModel.find().lean();
        console.log("Current Background Jobs:");
        console.table(jobs.map(j => ({
            name: j.name,
            status: j.status,
            lastRun: j.lastRun ? j.lastRun.toLocaleString() : 'N/A',
            runCount: j.runCount,
            lastError: j.lastError || 'None'
        })));
    } catch (error) {
        console.error("Error checking jobs:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkJobs();
