import mongoose from 'mongoose';

const betaFeatureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['AI', 'Health', 'Social', 'Marketplace', 'Emergency', 'Analytics', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['accepting', 'closed', 'launched'],
        default: 'accepting'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxTesters: {
        type: Number,
        default: 100
    },
    currentTesters: {
        type: Number,
        default: 0
    },
    launchDate: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: false
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

betaFeatureSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const betaFeatureModel = mongoose.model('betafeature', betaFeatureSchema);
export default betaFeatureModel;
