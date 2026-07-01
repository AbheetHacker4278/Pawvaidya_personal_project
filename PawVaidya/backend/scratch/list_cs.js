import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CSEmployee from '../models/csEmployeeModel.js';

dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const employees = await CSEmployee.find({});
    console.log('CS Employees in DB:');
    employees.forEach(emp => {
        console.log(`- ${emp.name} | ${emp.email} | isMaster: ${emp.isMaster} | status: ${emp.status}`);
    });
    await mongoose.disconnect();
};

run().catch(err => console.error(err));
