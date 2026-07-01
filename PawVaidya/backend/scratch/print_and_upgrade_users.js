import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = `${process.env.MONGODB_URI}/PawVaidya`;
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to DB successfully.");

    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email} | PlainPassword: ${u.plainPassword || 'N/A'} | Plan: ${u.subscription?.plan} | Status: ${u.subscription?.status}`);
    });

    // If there is any user, upgrade them to Obsidian Active status so we can test the premium features.
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`Upgrading first user: ${firstUser.email} to Obsidian tier...`);
      await db.collection('users').updateOne(
        { _id: firstUser._id },
        { 
          $set: { 
            "subscription.plan": "Obsidian", 
            "subscription.status": "Active",
            "subscription.expiryDate": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          } 
        }
      );
      console.log("Upgrade successful!");
    } else {
      console.log("No users found to upgrade.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error running script:", err);
    process.exit(1);
  }
};

run();
