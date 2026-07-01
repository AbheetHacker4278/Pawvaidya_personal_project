import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    type: { type: String, enum: ['Debit', 'Credit', 'Refund', 'Overdraft'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, default: 'Wallet' },
    isOverdraftUsed: { type: Boolean, default: false },
    overdraftAmount: { type: Number, default: 0 },
    referenceId: { type: String }
}, { timestamps: true });

const transactionModel = mongoose.models.transaction || mongoose.model('transaction', transactionSchema);

export default transactionModel;
