import mongoose from 'mongoose';
import 'dotenv/config';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Delete all old reports
const deleteOldReports = async () => {
    try {
        console.log('Deleting all old reports...');

        const result = await mongoose.connection.db.collection('reportmodels').deleteMany({});
        
        console.log(`✓ Deleted ${result.deletedCount} old reports`);
        console.log('\nYou can now create new reports with the correct schema.');

    } catch (error) {
        console.error('Error deleting reports:', error);
        throw error;
    }
};

// Run script
const run = async () => {
    try {
        await connectDB();
        await deleteOldReports();
        console.log('\nClosing database connection...');
        await mongoose.connection.close();
        console.log('Done! You can now restart your server.');
        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
};

run();
