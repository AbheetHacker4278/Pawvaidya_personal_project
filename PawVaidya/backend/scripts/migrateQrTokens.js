import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import petModel from '../models/petModel.js';

const migrateQrTokens = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const petsWithoutToken = await petModel.find({ $or: [{ qrToken: null }, { qrToken: { $exists: false } }] });
        console.log(`Found ${petsWithoutToken.length} pets without qrToken`);

        let migrated = 0;
        for (const pet of petsWithoutToken) {
            pet.qrToken = crypto.randomUUID();
            await pet.save();
            migrated++;
            console.log(`  ✓ ${pet.name} (${pet._id}) → ${pet.qrToken}`);
        }

        console.log(`\nMigration complete: ${migrated} pets updated.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};

migrateQrTokens();
