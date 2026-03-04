import mongoose from 'mongoose';
import 'dotenv/config';
import reportModel from '../models/reportModel.js';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for migration');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Fix report model enum values
const fixReportModels = async () => {
    try {
        console.log('Starting migration to fix report model enum values...');

        // Update all reports with 'userModel' to 'user'
        const userModelUpdate = await mongoose.connection.db.collection('reportmodels').updateMany(
            { reporterModel: 'userModel' },
            { $set: { reporterModel: 'user' } }
        );
        console.log(`Updated ${userModelUpdate.modifiedCount} reports with reporterModel: 'userModel' -> 'user'`);

        const userModelUpdate2 = await mongoose.connection.db.collection('reportmodels').updateMany(
            { reportedModel: 'userModel' },
            { $set: { reportedModel: 'user' } }
        );
        console.log(`Updated ${userModelUpdate2.modifiedCount} reports with reportedModel: 'userModel' -> 'user'`);

        // Update all reports with 'doctorModel' to 'doctor'
        const doctorModelUpdate = await mongoose.connection.db.collection('reportmodels').updateMany(
            { reporterModel: 'doctorModel' },
            { $set: { reporterModel: 'doctor' } }
        );
        console.log(`Updated ${doctorModelUpdate.modifiedCount} reports with reporterModel: 'doctorModel' -> 'doctor'`);

        const doctorModelUpdate2 = await mongoose.connection.db.collection('reportmodels').updateMany(
            { reportedModel: 'doctorModel' },
            { $set: { reportedModel: 'doctor' } }
        );
        console.log(`Updated ${doctorModelUpdate2.modifiedCount} reports with reportedModel: 'doctorModel' -> 'doctor'`);

        console.log('\nMigration completed successfully!');
        console.log('All report model enum values have been fixed.');

        // Verify the changes
        const remainingInvalid = await mongoose.connection.db.collection('reportmodels').countDocuments({
            $or: [
                { reporterModel: 'userModel' },
                { reporterModel: 'doctorModel' },
                { reportedModel: 'userModel' },
                { reportedModel: 'doctorModel' }
            ]
        });

        if (remainingInvalid > 0) {
            console.warn(`\nWarning: ${remainingInvalid} reports still have invalid enum values!`);
        } else {
            console.log('\n✓ All reports have valid enum values now.');
        }

    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
};

// Run migration
const runMigration = async () => {
    try {
        await connectDB();
        await fixReportModels();
        console.log('\nClosing database connection...');
        await mongoose.connection.close();
        console.log('Migration completed. You can now restart your server.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
