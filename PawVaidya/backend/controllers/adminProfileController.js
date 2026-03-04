import validator from 'validator';
import argon2 from 'argon2';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import adminModel from '../models/adminModel.js';

// ==================== ADMIN PROFILE MANAGEMENT ====================

// Initialize admin from environment variables (one-time migration)
export const initializeAdmin = async (req, res) => {
    try {
        const existingAdmin = await adminModel.findOne({});

        if (existingAdmin) {
            return res.json({
                success: false,
                message: 'Admin already exists in database'
            });
        }

        const hashedPassword = await argon2.hash(process.env.ADMIN_PASSWORD);

        const admin = new adminModel({
            name: 'Admin',
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            plainPassword: process.env.ADMIN_PASSWORD
        });

        await admin.save();

        res.json({
            success: true,
            message: 'Admin initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing admin:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
    try {
        const { email } = req.admin; // From auth middleware

        // Try to find admin in database
        let admin = await adminModel.findOne({ email }).select('-password');

        // If no admin in database, return env-based admin info
        if (!admin) {
            return res.json({
                success: true,
                admin: {
                    name: 'Admin',
                    email: process.env.ADMIN_EMAIL,
                    image: '',
                    role: 'master',
                    isEnvBased: true
                }
            });
        }

        res.json({
            success: true,
            admin: {
                ...admin.toObject(),
                role: admin.email === process.env.ADMIN_EMAIL ? 'master' : admin.role,
                isEnvBased: false
            }
        });
    } catch (error) {
        console.error('Error getting admin profile:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update admin profile (name, email, image)
export const updateAdminProfile = async (req, res) => {
    try {
        const { email } = req.admin;
        const { name, newEmail } = req.body;
        const imageFile = req.file;

        // Find admin in database
        let admin = await adminModel.findOne({ email });

        // If admin doesn't exist in database yet, create from env
        if (!admin) {
            const hashedPassword = await argon2.hash(process.env.ADMIN_PASSWORD);
            admin = new adminModel({
                name: name || 'Admin',
                email: newEmail || process.env.ADMIN_EMAIL,
                password: hashedPassword,
                plainPassword: process.env.ADMIN_PASSWORD,
                role: 'master'
            });
        }

        // Update fields
        if (name) admin.name = name;
        if (req.body.phone !== undefined) admin.phone = req.body.phone;
        if (newEmail) {
            // Validate email
            if (!validator.isEmail(newEmail)) {
                return res.json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
            admin.email = newEmail;
        }

        // Handle image upload
        if (imageFile) {
            // Delete old image from Cloudinary if exists
            if (admin.image && admin.image.includes('cloudinary')) {
                const publicId = admin.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }

            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            admin.image = imageUpload.secure_url;
        }

        await admin.save();

        // Generate new token if email changed
        let newToken = null;
        if (newEmail) {
            newToken = jwt.sign({ email: newEmail }, process.env.JWT_SECRET, { expiresIn: '7d' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            admin: {
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                image: admin.image,
                role: admin.email === process.env.ADMIN_EMAIL ? 'master' : admin.role
            },
            ...(newToken && { token: newToken })
        });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update admin password
export const updateAdminPassword = async (req, res) => {
    try {
        const { email } = req.admin;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            return res.json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }

        // Find admin in database
        let admin = await adminModel.findOne({ email });

        // If admin doesn't exist in database, check env password
        if (!admin) {
            if (currentPassword !== process.env.ADMIN_PASSWORD) {
                return res.json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Create admin in database with new password
            const hashedPassword = await argon2.hash(newPassword);
            admin = new adminModel({
                name: 'Admin',
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                plainPassword: newPassword
            });

            await admin.save();

            return res.json({
                success: true,
                message: 'Password updated successfully'
            });
        }

        // Verify current password
        const isMatch = await argon2.verify(admin.password, currentPassword);
        if (!isMatch) {
            return res.json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash and update new password
        const hashedPassword = await argon2.hash(newPassword);
        admin.password = hashedPassword;
        admin.plainPassword = newPassword;

        await admin.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating admin password:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};
