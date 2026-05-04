import mongoose from 'mongoose';

const csRatingSchema = new mongoose.Schema({
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'complaintTicket', required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'csEmployee', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

const CSRating = mongoose.models.csRating || mongoose.model('csRating', csRatingSchema);
export default CSRating;
