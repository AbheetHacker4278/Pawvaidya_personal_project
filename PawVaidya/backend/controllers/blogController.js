import blogModel from '../models/blogModel.js';
import userModel from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { logActivity } from '../utils/activityLogger.js';
import fs from 'fs';


// Create a new blog post
export const createBlog = async (req, res) => {
    try {
        const { userId, title, content, tags } = req.body;
        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        if (!userId || !title || !content) {
            return res.json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Get user information
        const user = await userModel.findById(userId).select('name image');
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
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
                
                // Check if file exists before uploading
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
                
                // Clean up temporary file after upload
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
                
                // Check if file exists before uploading
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
                
                // Clean up temporary file after upload
                try {
                    fs.unlinkSync(file.path);
                } catch (unlinkError) {
                    console.warn('Could not delete temp file:', file.path);
                }
            } catch (error) {
                console.error('Error uploading video:', error);
            }
        }

        // Parse tags if it's a string
        let tagsArray = [];
        if (tags) {
            tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Create blog post
        const blog = new blogModel({
            userId,
            userName: user.name,
            userImage: user.image || '',
            title: title.trim(),
            content: content.trim(),
            images: imageUrls,
            videos: videoUrls,
            tags: tagsArray
        });

        await blog.save();

        // Log activity
        await logActivity(
            userId.toString(),
            'user',
            'blog_create',
            `Created blog post: ${title}`,
            req,
            { blogId: blog._id, title }
        );

        res.json({
            success: true,
            message: 'Blog post created successfully',
            blog
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to create blog post'
        });
    }
};

// Get all blog posts
export const getAllBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'newest' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let sortOption = { createdAt: -1 }; // Default: newest first
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'most_liked') {
            // Sort by number of likes
            const blogs = await blogModel.find({}).sort({ createdAt: -1 });
            const sortedBlogs = blogs.sort((a, b) => b.likes.length - a.likes.length);
            const paginatedBlogs = sortedBlogs.slice(skip, skip + parseInt(limit));
            
            return res.json({
                success: true,
                blogs: paginatedBlogs,
                total: blogs.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(blogs.length / parseInt(limit))
            });
        }

        const blogs = await blogModel
            .find({})
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await blogModel.countDocuments({});
        
        res.json({
            success: true,
            blogs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to fetch blogs'
        });
    }
};

// Get a single blog post
export const getBlogById = async (req, res) => {
    try {
        const { blogId } = req.params;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Increment views
        blog.views += 1;
        await blog.save();

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to fetch blog'
        });
    }
};

// Update a blog post
export const updateBlog = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { userId, title, content, tags, remainingImages, remainingVideos } = req.body;
        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        console.log('Update blog request:', {
            blogId,
            userId,
            title,
            hasContent: !!content,
            tags,
            remainingImages,
            remainingVideos,
            imageFilesCount: imageFiles.length,
            videoFilesCount: videoFiles.length
        });

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Check if user owns the blog
        if (blog.userId !== userId) {
            return res.json({
                success: false,
                message: 'You can only update your own blog posts'
            });
        }

        // Update fields
        if (title) blog.title = title.trim();
        if (content) blog.content = content.trim();
        
        // Handle tags
        let tagsArray = [];
        if (tags) {
            try {
                tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (e) {
                // If parsing fails, treat as comma-separated string
                tagsArray = typeof tags === 'string' 
                    ? tags.split(',').map(t => t.trim()).filter(t => t)
                    : tags;
            }
            blog.tags = tagsArray;
        }

        // Handle existing images - keep only the ones that remain
        let finalImages = blog.images || [];
        if (remainingImages !== undefined && remainingImages !== null && remainingImages !== '') {
            try {
                let remainingImagesArray;
                if (typeof remainingImages === 'string') {
                    // Handle empty array string
                    if (remainingImages === '[]' || remainingImages.trim() === '[]') {
                        remainingImagesArray = [];
                    } else {
                        remainingImagesArray = JSON.parse(remainingImages);
                    }
                } else {
                    remainingImagesArray = remainingImages;
                }
                finalImages = Array.isArray(remainingImagesArray) ? remainingImagesArray : [];
            } catch (e) {
                console.error('Error parsing remainingImages:', e, 'Value:', remainingImages);
                // If parsing fails, keep existing images
                finalImages = blog.images || [];
            }
        }

        // Handle existing videos - keep only the ones that remain
        let finalVideos = blog.videos || [];
        if (remainingVideos !== undefined && remainingVideos !== null && remainingVideos !== '') {
            try {
                let remainingVideosArray;
                if (typeof remainingVideos === 'string') {
                    // Handle empty array string
                    if (remainingVideos === '[]' || remainingVideos.trim() === '[]') {
                        remainingVideosArray = [];
                    } else {
                        remainingVideosArray = JSON.parse(remainingVideos);
                    }
                } else {
                    remainingVideosArray = remainingVideos;
                }
                finalVideos = Array.isArray(remainingVideosArray) ? remainingVideosArray : [];
            } catch (e) {
                console.error('Error parsing remainingVideos:', e, 'Value:', remainingVideos);
                // If parsing fails, keep existing videos
                finalVideos = blog.videos || [];
            }
        }

        // Upload new images if provided
        if (imageFiles && Array.isArray(imageFiles) && imageFiles.length > 0) {
            const imageUrls = [];
            for (const file of imageFiles) {
                try {
                    if (!file || !file.path) {
                        console.warn('Invalid file object:', file);
                        continue;
                    }
                    
                    // Check if file exists before uploading
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
                    
                    // Clean up temporary file after upload
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.warn('Could not delete temp file:', file.path);
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    // Continue with other images even if one fails
                    // Don't throw error, just log it
                }
            }
            if (imageUrls.length > 0) {
                finalImages = [...finalImages, ...imageUrls];
            }
        }

        // Upload new videos if provided
        if (videoFiles && Array.isArray(videoFiles) && videoFiles.length > 0) {
            const videoUrls = [];
            for (const file of videoFiles) {
                try {
                    if (!file || !file.path) {
                        console.warn('Invalid file object:', file);
                        continue;
                    }
                    
                    // Check if file exists before uploading
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
                    
                    // Clean up temporary file after upload
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.warn('Could not delete temp file:', file.path);
                    }
                } catch (error) {
                    console.error('Error uploading video:', error);
                    // Continue with other videos even if one fails
                    // Don't throw error, just log it
                }
            }
            if (videoUrls.length > 0) {
                finalVideos = [...finalVideos, ...videoUrls];
            }
        }

        // Set final arrays
        blog.images = finalImages;
        blog.videos = finalVideos;
        blog.updatedAt = new Date();
        await blog.save();

        // Log activity
        await logActivity(
            userId.toString(),
            'user',
            'blog_update',
            `Updated blog post: ${blog.title}`,
            req,
            { blogId: blog._id }
        );

        res.json({
            success: true,
            message: 'Blog post updated successfully',
            blog
        });
    } catch (error) {
        console.error('Error updating blog:', error);
        console.error('Error stack:', error.stack);
        res.json({
            success: false,
            message: error.message || 'Failed to update blog post',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Delete a blog post
export const deleteBlog = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { userId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Check if user owns the blog
        if (blog.userId !== userId) {
            return res.json({
                success: false,
                message: 'You can only delete your own blog posts'
            });
        }

        // Delete images and videos from Cloudinary (optional - for cleanup)
        // You can add Cloudinary deletion logic here if needed

        await blogModel.findByIdAndDelete(blogId);

        // Log activity
        await logActivity(
            userId.toString(),
            'user',
            'blog_delete',
            `Deleted blog post: ${blog.title}`,
            req,
            { blogId }
        );

        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to delete blog post'
        });
    }
};

// Like/Unlike a blog post
export const toggleLike = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { userId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        const likeIndex = blog.likes.findIndex(like => like.userId === userId);

        if (likeIndex > -1) {
            // Unlike - remove like
            blog.likes.splice(likeIndex, 1);
            await blog.save();
            
            res.json({
                success: true,
                message: 'Blog unliked',
                liked: false,
                likesCount: blog.likes.length
            });
        } else {
            // Like - add like
            blog.likes.push({ userId, likedAt: new Date() });
            await blog.save();
            
            res.json({
                success: true,
                message: 'Blog liked',
                liked: true,
                likesCount: blog.likes.length
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to toggle like'
        });
    }
};

// Add a comment to a blog post
export const addComment = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { userId, comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.json({
                success: false,
                message: 'Comment is required'
            });
        }

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Get user information
        const user = await userModel.findById(userId).select('name image');
        if (!user) {
            return res.json({
                success: false,
                message: 'User not found'
            });
        }

        // Add comment
        blog.comments.push({
            userId,
            userName: user.name,
            userImage: user.image || '',
            comment: comment.trim(),
            commentedAt: new Date()
        });

        await blog.save();

        // Log activity
        await logActivity(
            userId.toString(),
            'user',
            'blog_comment',
            `Commented on blog: ${blog.title}`,
            req,
            { blogId: blog._id }
        );

        res.json({
            success: true,
            message: 'Comment added successfully',
            comment: blog.comments[blog.comments.length - 1]
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to add comment'
        });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const { blogId, commentId } = req.params;
        const { userId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({
                success: false,
                message: 'Blog post not found'
            });
        }

        const commentIndex = blog.comments.findIndex(
            comment => comment._id.toString() === commentId
        );

        if (commentIndex === -1) {
            return res.json({
                success: false,
                message: 'Comment not found'
            });
        }

        const comment = blog.comments[commentIndex];

        // Check if user owns the comment or the blog
        if (comment.userId !== userId && blog.userId !== userId) {
            return res.json({
                success: false,
                message: 'You can only delete your own comments'
            });
        }

        blog.comments.splice(commentIndex, 1);
        await blog.save();

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to delete comment'
        });
    }
};

// Get user's own blog posts
export const getUserBlogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const blogs = await blogModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await blogModel.countDocuments({ userId });

        res.json({
            success: true,
            blogs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching user blogs:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to fetch user blogs'
        });
    }
};