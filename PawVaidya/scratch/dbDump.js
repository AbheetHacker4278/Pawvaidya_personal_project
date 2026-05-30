import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../backend/.env' });

console.log("MONGO_URI:", process.env.MONGODB_URI);

const strayCrowdfundingSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    title: { type: String },
    raisedAmount: { type: Number },
    targetAmount: { type: Number },
    status: { type: String },
    contributions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        amount: { type: Number },
        userName: { type: String }
    }]
});

const Campaign = mongoose.model('strayCrowdfunding', strayCrowdfundingSchema, 'straycrowdfundings');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pawvaidya');
        console.log("Connected to MongoDB.");
        const campaigns = await Campaign.find({});
        console.log("Number of campaigns:", campaigns.length);
        campaigns.forEach(c => {
            console.log(`Campaign: ${c.title}, Creator: ${c.creatorId}, Raised: ${c.raisedAmount}, Target: ${c.targetAmount}, Status: ${c.status}`);
            console.log("Contributions:", JSON.stringify(c.contributions, null, 2));
        });
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log("Users in DB:");
        users.forEach(u => {
            console.log(`User: ${u.name}, ID: ${u._id}, Email: ${u.email}, Wallet: ${u.pawWallet}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
