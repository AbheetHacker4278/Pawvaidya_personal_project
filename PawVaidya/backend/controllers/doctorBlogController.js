import blogModel from '../models/blogModel.js';
import doctorModel from '../models/doctorModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { logActivity } from '../utils/activityLogger.js';
import fs from 'fs';

// Create a new blog post by doctor
export const createDoctorBlog = async (req, res) => {
    try {
        const { docId, title, content, tags } = req.body;
        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        if (!docId || !title || !content) {
            return res.json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Get doctor information
        const doctor = await doctorModel.findById(docId).select('name image speciality');
        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check if doctor is banned
        if (doctor.isBanned) {
            return res.json({
                success: false,
                message: 'Your account is banned. You cannot create blogs.'
            });
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        for (const file of imageFiles) {
            try {
                if (!file || !file.path) {
                    console.warn('Invalid file object:', file);
                    continue;
                }
                
                if (!fs.existsSync(file.path)) {
                    console.error('File does not exist:', file.path);
                    continue;
                }
                
                const result = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'image',
                    folder: 'pawvaidya/blogs/images',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
                    ]
                });
                if (result && result.secure_url) {
                    imageUrls.push(result.secure_url);
                }
                
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', file.path);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        // Upload videos to Cloudinary
        const videoUrls = [];
        for (const file of videoFiles) {
            try {
                if (!file || !file.path) {
                    console.warn('Invalid file object:', file);
                    continue;
                }
                
                if (!fs.existsSync(file.path)) {
                    console.error('File does not exist:', file.path);
                    continue;
                }
                
                const result = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'video',
                    folder: 'pawvaidya/blogs/videos',
                    chunk_size: 6000000
                });
                if (result && result.secure_url) {
                    videoUrls.push(result.secure_url);
                }
                
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', file.path);
                }
            } catch (error) {
                console.error('Error uploading video:', error);
            }
        }

        // Parse tags
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (error) {
                console.error('Error parsing tags:', error);
                parsedTags = [];
            }
        }

        // Create blog post
        const newBlog = new blogModel({
            userId: docId,
            userName: doctor.name,
            userImage: doctor.image,
            authorType: 'doctor',
            authorSpeciality: doctor.speciality,
            title,
            content,
            images: imageUrls,
            videos: videoUrls,
            tags: parsedTags
        });

        await newBlog.save();

        // Log activity
        await logActivity(
            docId,
            'doctor',
            'create_blog',
            `Doctor created blog: ${title}`,
            req,
            { blogId: newBlog._id, title }
        );

        return res.json({
            success: true,
            message: 'Blog post created successfully',
            blog: newBlog
        });
    } catch (error) {
        console.error('Error creating doctor blog:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all blogs by a specific doctor
export const getDoctorBlogs = async (req, res) => {
    try {
        const { docId } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const blogs = await blogModel.find({ userId: docId, authorType: 'doctor' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBlogs = await blogModel.countDocuments({ userId: docId, authorType: 'doctor' });

        return res.json({
            success: true,
            blogs,
            totalPages: Math.ceil(totalBlogs / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching doctor blogs:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Update doctor blog
export const updateDoctorBlog = async (req, res) => {
    try {
        const { docId, blogId, title, content, tags } = req.body;
        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if doctor owns this blog
        if (blog.userId !== docId || blog.authorType !== 'doctor') {
            return res.json({
                success: false,
                message: 'Unauthorized to edit this blog'
            });
        }

        // Upload new images if provided
        const imageUrls = [...blog.images];
        for (const file of imageFiles) {
            try {
                if (!file || !file.path || !fs.existsSync(file.path)) continue;
                
                const result = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'image',
                    folder: 'pawvaidya/blogs/images',
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
                    ]
                });
                if (result && result.secure_url) {
                    imageUrls.push(result.secure_url);
                }
                
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', file.path);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        // Upload new videos if provided
        const videoUrls = [...blog.videos];
        for (const file of videoFiles) {
            try {
                if (!file || !file.path || !fs.existsSync(file.path)) continue;
                
                const result = await cloudinary.uploader.upload(file.path, {
                    resource_type: 'video',
                    folder: 'pawvaidya/blogs/videos',
                    chunk_size: 6000000
                });
                if (result && result.secure_url) {
                    videoUrls.push(result.secure_url);
                }
                
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', file.path);
                }
            } catch (error) {
                console.error('Error uploading video:', error);
            }
        }

        // Parse tags
        let parsedTags = blog.tags;
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (error) {
                console.error('Error parsing tags:', error);
            }
        }

        // Update blog
        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.images = imageUrls;
        blog.videos = videoUrls;
        blog.tags = parsedTags;
        blog.updatedAt = Date.now();

        await blog.save();

        // Log activity
        await logActivity(
            docId,
            'doctor',
            'update_blog',
            `Doctor updated blog: ${blog.title}`,
            req,
            { blogId: blog._id, title: blog.title }
        );

        return res.json({
            success: true,
            message: 'Blog updated successfully',
            blog
        });
    } catch (error) {
        console.error('Error updating doctor blog:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete doctor blog
export const deleteDoctorBlog = async (req, res) => {
    try {
        const { docId, blogId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if doctor owns this blog
        if (blog.userId !== docId || blog.authorType !== 'doctor') {
            return res.json({
                success: false,
                message: 'Unauthorized to delete this blog'
            });
        }

        // Delete images from Cloudinary
        for (const imageUrl of blog.images) {
            try {
                const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(`pawvaidya/blogs/images/${publicId}`);
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error);
            }
        }

        // Delete videos from Cloudinary
        for (const videoUrl of blog.videos) {
            try {
                const publicId = videoUrl.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(`pawvaidya/blogs/videos/${publicId}`, { resource_type: 'video' });
            } catch (error) {
                console.error('Error deleting video from Cloudinary:', error);
            }
        }

        await blogModel.findByIdAndDelete(blogId);

        // Log activity
        await logActivity(
            docId,
            'doctor',
            'delete_blog',
            `Doctor deleted blog: ${blog.title}`,
            req,
            { blogId, title: blog.title }
        );

        return res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting doctor blog:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get all community blogs (for doctors to view)
export const getAllBlogsForDoctor = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sort || 'newest';
        const skip = (page - 1) * limit;

        let sortOption = {};
        switch (sortBy) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'most_liked':
                sortOption = { 'likes.length': -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        const blogs = await blogModel.find({})
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalBlogs = await blogModel.countDocuments({});

        return res.json({
            success: true,
            blogs,
            totalPages: Math.ceil(totalBlogs / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching community blogs:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Like/Unlike a blog post
export const toggleLikeBlog = async (req, res) => {
    try {
        const { docId, blogId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if doctor already liked the blog
        const likeIndex = blog.likes.findIndex(like => like.userId === docId);

        if (likeIndex > -1) {
            // Unlike
            blog.likes.splice(likeIndex, 1);
            await blog.save();

            return res.json({
                success: true,
                liked: false,
                message: 'Blog unliked'
            });
        } else {
            // Like
            blog.likes.push({
                userId: docId,
                likedAt: Date.now()
            });
            await blog.save();

            return res.json({
                success: true,
                liked: true,
                message: 'Blog liked'
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Add comment to a blog post
export const addCommentToBlog = async (req, res) => {
    try {
        const { docId, blogId, comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.json({
                success: false,
                message: 'Comment cannot be empty'
            });
        }

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Get doctor information
        const doctor = await doctorModel.findById(docId).select('name image');
        if (!doctor) {
            return res.json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Add comment
        blog.comments.push({
            userId: docId,
            userName: doctor.name,
            userImage: doctor.image,
            comment: comment.trim(),
            commentedAt: Date.now()
        });

        await blog.save();

        return res.json({
            success: true,
            message: 'Comment added successfully',
            comment: blog.comments[blog.comments.length - 1]
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Increment blog view count
export const incrementBlogView = async (req, res) => {
    try {
        const { blogId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        blog.views = (blog.views || 0) + 1;
        await blog.save();

        return res.json({
            success: true,
            views: blog.views
        });
    } catch (error) {
        console.error('Error incrementing view:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

// Get single blog details
export const getBlogDetails = async (req, res) => {
    try {
        const { blogId } = req.params;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog not found'
            });
        }

        return res.json({
            success: true,
            blog
        });
    } catch (error) {
        console.error('Error fetching blog details:', error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};
