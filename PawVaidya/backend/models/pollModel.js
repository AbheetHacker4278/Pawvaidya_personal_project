import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [
        {
            text: { type: String, required: true },
            votes: { type: Number, default: 0 }
        }
    ],
    target: {
        type: String,
        enum: ['user', 'doctor', 'all'],
        default: 'all'
    },
    category: {
        type: String,
        enum: ['Question', 'Riddle', 'Feedback', 'Other'],
        default: 'Question'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        default: 'Admin'
    },
    totalVotes: {
        type: Number,
        default: 0
    },
    votedBy: [
        {
            userId: { type: String },
            userType: { type: String, enum: ['user', 'doctor'] },
            optionIndex: { type: Number, required: true }
        }
    ]
}, { timestamps: true });

const pollModel = mongoose.models.poll || mongoose.model('poll', pollSchema);

export default pollModel;
