import mongoose from 'mongoose';
import dotenv from 'dotenv';
import appointmentModel from './models/appointmentModel.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/PawVaidya`);
        console.log("Connected to DB");

        const allAppts = await appointmentModel.find({}).lean();
        console.log("Total appointments in DB:", allAppts.length);

        const doctors = [...new Set(allAppts.map(a => a.docId))];
        console.log("Doctors with appointments:", doctors);

        for (const docId of doctors) {
            const docAppts = allAppts.filter(a => a.docId === docId);
            const todayAppts = docAppts.filter(a => a.slotDate === '24_4_2026');
            const paidRazorpay = todayAppts.filter(a => a.payment && a.paymentMethod === 'Razorpay');
            const unpaidRazorpay = todayAppts.filter(a => !a.payment && a.paymentMethod === 'Razorpay');
            const cash = todayAppts.filter(a => a.paymentMethod === 'Cash');

            console.log(`\nDoctor ID: ${docId}`);
            console.log(`Today (24_4_2026) Total Bookings: ${todayAppts.length}`);
            console.log(`  - Paid Razorpay: ${paidRazorpay.length}`);
            console.log(`  - Unpaid Razorpay: ${unpaidRazorpay.length}`);
            console.log(`  - Cash: ${cash.length}`);
            console.log(`  - Cancelled: ${todayAppts.filter(a => a.cancelled).length}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
