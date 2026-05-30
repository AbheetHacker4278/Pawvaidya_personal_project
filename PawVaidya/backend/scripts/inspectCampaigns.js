import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/PawVaidya`);
        console.log("Connected to DB:", mongoose.connection.name);

        const campaigns = await mongoose.connection.db.collection('straycrowdfundings').find({}).toArray();
        console.log(`Found ${campaigns.length} campaigns:`);
        for (const camp of campaigns) {
            console.log(`- Title: "${camp.title}", CreatorId: "${camp.creatorId}", Status: "${camp.status}", Target: ${camp.targetAmount}, Raised: ${camp.raisedAmount}`);
        }

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users:`);
        for (const u of users) {
            console.log(`- User: "${u.name}", ID: "${u._id}", Email: "${u.email}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
