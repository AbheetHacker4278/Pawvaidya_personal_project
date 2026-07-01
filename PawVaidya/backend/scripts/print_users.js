import dotenv from 'dotenv';
dotenv.config();
import connectdb from '../config/mongodb.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';

const run = async () => {
    await connectdb();
    
    console.log("=== DOCTORS ===");
    const doctors = await doctorModel.find({}, 'name email isVco').lean();
    console.log(doctors);

    console.log("=== USERS ===");
    const users = await userModel.find({ isObsidian: true }, 'name email vcoId').lean();
    console.log(users);

    await mongoose.connection.close();
};

run().catch(console.error);
