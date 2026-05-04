import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CSEmployee from '../models/csEmployeeModel.js';
import CSRating from '../models/csRatingModel.js';
import connectDB from '../config/mongodb.js';

dotenv.config();

const syncEarnings = async () => {
    try {
        await connectDB();
        console.log('Connected to DB for sync...');

        const employees = await CSEmployee.find({});
        console.log(`Found ${employees.length} employees to sync.`);

        for (const employee of employees) {
            const fiveStarCount = await CSRating.countDocuments({
                employeeId: employee._id,
                rating: 5
            });

            console.log(`Employee: ${employee.name} | Found ${fiveStarCount} five-star ratings.`);

            await CSEmployee.findByIdAndUpdate(employee._id, { fiveStarCount });
        }

        console.log('Sync completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error.message);
        process.exit(1);
    }
};

syncEarnings();
