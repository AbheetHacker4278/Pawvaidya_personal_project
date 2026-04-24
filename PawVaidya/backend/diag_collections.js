import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/PawVaidya`);
        console.log("Connected to DB:", mongoose.connection.name);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const appointments = await mongoose.connection.db.collection('appointments').find({}).toArray();
        console.log("Appointments count in 'appointments':", appointments.length);

        const allDates = [...new Set(appointments.map(a => a.slotDate))].filter(d => d && d.endsWith('_2026'));
        console.log("Found slotDates for 2026:", allDates);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
