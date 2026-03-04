import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        default: ''
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
reminderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const reminderModel = mongoose.model('Reminder', reminderSchema);

export default reminderModel;
