import mongoose from 'mongoose';
import doctorModel from './models/doctorModel.js';
import 'dotenv/config';

const checkReviews = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/PawVaidya`);
        console.log("Connected to DB");

        const doctors = await doctorModel.find({ totalRatings: { $gt: 0 } }).select('name totalRatings reviews');

        console.log(`Rated Doctors found: ${doctors.length}`);

        doctors.forEach(doc => {
            console.log(`Doctor: ${doc.name}`);
            console.log(`- Total Ratings: ${doc.totalRatings}`);
            console.log(`- Reviews Array Length: ${doc.reviews ? doc.reviews.length : 'undefined'}`);
            console.log(`- Reviews Content: ${JSON.stringify(doc.reviews)}`);
            console.log('---');
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkReviews();
