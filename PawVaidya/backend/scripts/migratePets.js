import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';
import petModel from '../models/petModel.js';
import connectDB from '../config/mongodb.js';

dotenv.config();

const migratePets = async () => {
    try {
        await connectDB();
        console.log('Connected to Database');

        const users = await userModel.find({});
        console.log(`Found ${users.length} users to check`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Check if user has legacy pet data
            if (user.pet_type && user.pet_type !== 'Not Selected') {

                // Check if user already has pets to avoid double migration
                const existingPets = await petModel.find({ ownerId: user._id });
                if (existingPets.length > 0) {
                    skippedCount++;
                    continue;
                }

                // Create new pet from legacy data
                const newPet = new petModel({
                    ownerId: user._id,
                    name: `My ${user.pet_type}`, // Default name since it wasn't in legacy
                    type: user.pet_type,
                    breed: user.breed || 'Not Selected',
                    age: user.pet_age || '1',
                    gender: user.pet_gender || 'Male',
                    category: user.category || 'Not Selected',
                    image: user.image || '', // Using user profile image as pet image
                    isVerified: false
                });

                await newPet.save();
                migratedCount++;
                console.log(`Migrated pet for user: ${user.email}`);
            } else {
                skippedCount++;
            }
        }

        console.log('---------------------------');
        console.log(`Migration Complete!`);
        console.log(`Successfully Migrated: ${migratedCount}`);
        console.log(`Skipped (already migrated or no data): ${skippedCount}`);
        console.log('---------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
};

migratePets();
