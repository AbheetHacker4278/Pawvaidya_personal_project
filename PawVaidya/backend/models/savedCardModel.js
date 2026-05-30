import mongoose from "mongoose";

const savedCardSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ownerType: { type: String, enum: ['user', 'doctor'], required: true },
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true }, // Masked format: **** **** **** 1234
    cardType: { type: String, required: true }, // visa, mastercard, rupay, etc.
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    cardToken: { type: String, required: true } // Generated token for simulated transactions
}, { timestamps: true });

const savedCardModel = mongoose.models.savedCard || mongoose.model('savedCard', savedCardSchema);

export default savedCardModel;
