import betaFeatureModel from '../models/betaFeatureModel.js';
import betaAccessModel from '../models/betaAccessModel.js';
import userModel from '../models/userModel.js';
import { transporter } from '../config/nodemailer.js';
import {
    BETA_APPLICATION_RECEIVED_TEMPLATE,
    BETA_APPROVED_TEMPLATE,
    BETA_REJECTED_TEMPLATE
} from '../mailservice/betaAccessTemplates.js';

const APP_URL = process.env.APP_URL || 'https://pawvaidya-79qq.onrender.com';

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE MANAGEMENT (Admin Only)
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Create a new beta feature
// @route  POST /api/beta/features
export const createBetaFeature = async (req, res) => {
    try {
        const { name, slug, description, category, maxTesters } = req.body;

        if (!name || !slug || !description) {
            return res.json({ success: false, message: 'Name, slug, and description are required.' });
        }

        const existing = await betaFeatureModel.findOne({ slug: slug.toLowerCase() });
        if (existing) {
            return res.json({ success: false, message: 'A feature with this slug already exists.' });
        }

        const feature = new betaFeatureModel({
            name,
            slug: slug.toLowerCase(),
            description,
            category: category || 'Other',
            maxTesters: maxTesters || 100
        });

        await feature.save();

        res.json({ success: true, message: 'Beta feature created successfully.', feature });
    } catch (error) {
        console.error('createBetaFeature error:', error);
        res.json({ success: false, message: error.message });
    }
};

// @desc   Get all beta features (Admin)
// @route  GET /api/beta/features/all
export const getAllBetaFeatures = async (req, res) => {
    try {
        const features = await betaFeatureModel.find().sort({ createdAt: -1 });
        res.json({ success: true, features });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Update a beta feature (Admin)
// @route  PUT /api/beta/features/:featureId
export const updateBetaFeature = async (req, res) => {
    try {
        const { featureId } = req.params;
        const updates = req.body;
        delete updates._id;

        const feature = await betaFeatureModel.findByIdAndUpdate(featureId, updates, { new: true });
        if (!feature) return res.json({ success: false, message: 'Feature not found.' });

        res.json({ success: true, message: 'Feature updated.', feature });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Delete a beta feature (Admin)
// @route  DELETE /api/beta/features/:featureId
export const deleteBetaFeature = async (req, res) => {
    try {
        const { featureId } = req.params;
        await betaFeatureModel.findByIdAndDelete(featureId);
        await betaAccessModel.deleteMany({ featureId });
        res.json({ success: true, message: 'Feature and its applications deleted.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / USER-FACING
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Get all active beta features (Users — accepting only)
// @route  GET /api/beta/features
export const getActiveBetaFeatures = async (req, res) => {
    try {
        const features = await betaFeatureModel
            .find({ isActive: true })
            .sort({ createdAt: -1 });
        res.json({ success: true, features });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Get user's own beta applications
// @route  GET /api/beta/my-applications
export const getMyBetaApplications = async (req, res) => {
    try {
        const { userId } = req.body;
        const applications = await betaAccessModel
            .find({ userId })
            .sort({ createdAt: -1 });
        res.json({ success: true, applications });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Apply for a beta feature
// @route  POST /api/beta/apply
export const applyForBetaAccess = async (req, res) => {
    try {
        const { userId, featureId, motivation } = req.body;

        if (!featureId || !motivation?.trim()) {
            return res.json({ success: false, message: 'Feature and motivation are required.' });
        }
        if (motivation.trim().length < 20) {
            return res.json({ success: false, message: 'Please write at least 20 characters in your motivation.' });
        }

        const user = await userModel.findById(userId).select('name email subscription');
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const feature = await betaFeatureModel.findById(featureId);
        if (!feature) return res.json({ success: false, message: 'Feature not found.' });
        if (!feature.isActive) return res.json({ success: false, message: 'This feature is no longer accepting applications.' });
        if (feature.status === 'closed') return res.json({ success: false, message: 'Applications for this feature are closed.' });
        if (feature.status === 'launched') return res.json({ success: false, message: 'This feature has already been publicly launched.' });

        // Check if already applied
        const existing = await betaAccessModel.findOne({ userId, featureId });
        if (existing) {
            return res.json({ success: false, message: 'You have already applied for this feature.' });
        }

        // Seat check
        if (feature.currentTesters >= feature.maxTesters) {
            return res.json({ success: false, message: 'All beta seats for this feature are filled. Check back later!' });
        }

        const application = new betaAccessModel({
            userId,
            userName: user.name,
            userEmail: user.email,
            userSubscription: user.subscription?.plan || 'None',
            featureId,
            featureName: feature.name,
            motivation: motivation.trim(),
            status: 'pending'
        });

        await application.save();

        // Send confirmation email
        try {
            const html = BETA_APPLICATION_RECEIVED_TEMPLATE
                .replace(/{userName}/g, user.name)
                .replace(/{featureName}/g, feature.name)
                .replace(/{featureCategory}/g, feature.category);

            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: user.email,
                subject: `🚀 Beta Application Received — ${feature.name} | PawVaidya`,
                html
            });
        } catch (emailErr) {
            console.error('Beta application confirmation email failed:', emailErr.message);
        }

        res.json({ success: true, message: 'Application submitted! Check your email for confirmation.' });
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ success: false, message: 'You have already applied for this feature.' });
        }
        console.error('applyForBetaAccess error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — APPLICATION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// @desc   Get all beta applications (Admin)
// @route  GET /api/beta/applications
export const getAllBetaApplications = async (req, res) => {
    try {
        const { status, featureId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (featureId) filter.featureId = featureId;

        const applications = await betaAccessModel
            .find(filter)
            .sort({ createdAt: -1 })
            .populate('featureId', 'name category slug status');

        res.json({ success: true, applications });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Approve a beta application (Admin)
// @route  POST /api/beta/applications/approve
export const approveBetaApplication = async (req, res) => {
    try {
        const { applicationId, adminNote } = req.body;

        const app = await betaAccessModel.findById(applicationId);
        if (!app) return res.json({ success: false, message: 'Application not found.' });
        if (app.status !== 'pending') return res.json({ success: false, message: 'Application already processed.' });

        const feature = await betaFeatureModel.findById(app.featureId);
        if (!feature) return res.json({ success: false, message: 'Feature not found.' });

        // Increment tester count
        await betaFeatureModel.findByIdAndUpdate(app.featureId, { $inc: { currentTesters: 1 } });

        app.status = 'approved';
        app.adminNote = adminNote || '';
        app.reviewedAt = new Date();
        await app.save();

        // Send approval email
        try {
            const adminNoteHtml = adminNote
                ? `<div class="admin-note"><strong>📝 Note from Admin:</strong><br/>${adminNote}</div>`
                : '';

            const html = BETA_APPROVED_TEMPLATE
                .replace(/{userName}/g, app.userName)
                .replace(/{featureName}/g, app.featureName)
                .replace(/{featureCategory}/g, feature.category)
                .replace(/{adminNoteHtml}/g, adminNoteHtml)
                .replace(/{appUrl}/g, APP_URL);

            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: app.userEmail,
                subject: `🎉 Beta Access Approved — ${app.featureName} | PawVaidya`,
                html
            });
        } catch (emailErr) {
            console.error('Beta approval email failed:', emailErr.message);
        }

        res.json({ success: true, message: `${app.userName}'s application approved. Notification email sent.` });
    } catch (error) {
        console.error('approveBetaApplication error:', error);
        res.json({ success: false, message: error.message });
    }
};

// @desc   Reject a beta application (Admin)
// @route  POST /api/beta/applications/reject
export const rejectBetaApplication = async (req, res) => {
    try {
        const { applicationId, adminNote } = req.body;

        const app = await betaAccessModel.findById(applicationId);
        if (!app) return res.json({ success: false, message: 'Application not found.' });
        if (app.status !== 'pending') return res.json({ success: false, message: 'Application already processed.' });

        app.status = 'rejected';
        app.adminNote = adminNote || '';
        app.reviewedAt = new Date();
        await app.save();

        // Send rejection email
        try {
            const adminNoteHtml = adminNote
                ? `<div class="admin-note"><strong>📝 Admin Note:</strong><br/>${adminNote}</div>`
                : '';

            const html = BETA_REJECTED_TEMPLATE
                .replace(/{userName}/g, app.userName)
                .replace(/{featureName}/g, app.featureName)
                .replace(/{adminNoteHtml}/g, adminNoteHtml)
                .replace(/{appUrl}/g, APP_URL);

            await transporter.sendMail({
                from: process.env.SENDER_EMAIL,
                to: app.userEmail,
                subject: `📋 Beta Application Update — ${app.featureName} | PawVaidya`,
                html
            });
        } catch (emailErr) {
            console.error('Beta rejection email failed:', emailErr.message);
        }

        res.json({ success: true, message: 'Application rejected. Notification email sent.' });
    } catch (error) {
        console.error('rejectBetaApplication error:', error);
        res.json({ success: false, message: error.message });
    }
};

// @desc   Get beta stats for admin dashboard
// @route  GET /api/beta/stats
export const getBetaStats = async (req, res) => {
    try {
        const [totalFeatures, totalApplications, pendingCount, approvedCount, rejectedCount] = await Promise.all([
            betaFeatureModel.countDocuments({ isActive: true }),
            betaAccessModel.countDocuments(),
            betaAccessModel.countDocuments({ status: 'pending' }),
            betaAccessModel.countDocuments({ status: 'approved' }),
            betaAccessModel.countDocuments({ status: 'rejected' })
        ]);

        res.json({
            success: true,
            stats: { totalFeatures, totalApplications, pendingCount, approvedCount, rejectedCount }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// @desc   Check if user has beta access for a specific feature slug
// @route  GET /api/beta/check/:slug
export const checkBetaAccess = async (req, res) => {
    try {
        const { userId } = req.body;
        const { slug } = req.params;

        const feature = await betaFeatureModel.findOne({ slug });
        if (!feature) return res.json({ success: true, hasAccess: false });

        const application = await betaAccessModel.findOne({ userId, featureId: feature._id, status: 'approved' });
        res.json({ success: true, hasAccess: !!application, feature });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
