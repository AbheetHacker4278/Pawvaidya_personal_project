import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userImage: { type: String, default: '' },
    authorType: { type: String, enum: ['user', 'doctor'], default: 'user' }, // Author type
    authorSpeciality: { type: String, default: '' }, // For doctors
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    images: [{ type: String }], // Array of image URLs
    videos: [{ type: String }], // Array of video URLs
    tags: [{ type: String }], // Array of tags
    likes: [{ 
        userId: { type: String, required: true },
        likedAt: { type: Date, default: Date.now }
    }],
    comments: [{
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        userImage: { type: String, default: '' },
        comment: { type: String, required: true },
        commentedAt: { type: Date, default: Date.now }
    }],
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster queries
blogSchema.index({ userId: 1, createdAt: -1 });
blogSchema.index({ createdAt: -1 });

const blogModel = mongoose.models.blog || mongoose.model('blog', blogSchema);

export default blogModel;

