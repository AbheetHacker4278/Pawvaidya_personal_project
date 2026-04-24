const mongoose = require('mongoose');
require('dotenv').config();

const appointmentModel = require('./models/appointmentModel');

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const appointments = await appointmentModel.find({}).lean();
    console.log("Total appointments:", appointments.length);

    // Check how many today
    const count24th = appointments.filter(a => a.slotDate === '24_4_2026');
    console.log("Total appointments on 24_4_2026:", count24th.length);

    console.log("Status of those today:");
    count24th.forEach((a, i) => {
        console.log(`[${i}] payment: ${a.payment}, isCompleted: ${a.isCompleted}, paymentMethod: ${a.paymentMethod}, cancelled: ${a.cancelled}`);
    });

    process.exit(0);
};

run();
