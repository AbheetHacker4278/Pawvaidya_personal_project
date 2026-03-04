import reportModel from '../models/reportModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import blogModel from '../models/blogModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { getIO } from '../socketServer.js';

// Submit a report (User or Doctor)
const submitReport = async (req, res) => {
    try {
        const {
            reporterType,
            reporterId,
            reportedType,
            reportedId,
            appointmentId,
            blogId,
            reason,
            description
        } = req.body;

        // Validate required fields
        if (!reporterType || !reporterId || !reportedType || !reportedId || !reason || !description) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        // Verify reporter exists
        const reporterModel = reporterType === 'user' ? userModel : doctorModel;
        const reporter = await reporterModel.findById(reporterId);
        if (!reporter) {
            return res.json({ success: false, message: 'Reporter not found' });
        }

        // Verify reported person exists (only for non-blog reports or if ID is provided)
        if (reportedId) {
            const reportedModel = reportedType === 'user' ? userModel : doctorModel;
            const reported = await reportedModel.findById(reportedId);
            if (!reported && !blogId) {
                return res.json({ success: false, message: 'Reported person not found' });
            }
        } else if (!blogId) {
            return res.json({ success: false, message: 'Reported person ID is required' });
        }

        // Check if already reported
        const existingReport = await reportModel.findOne({
            reporterId,
            reportedId,
            blogId: blogId || null,
            status: { $in: ['pending', 'under_review'] }
        });

        if (existingReport) {
            return res.json({ success: false, message: 'You have already reported this person' });
        }

        // Create report
        const report = new reportModel({
            reporterType,
            reporterId,
            reporterModel: reporterType === 'user' ? 'user' : 'doctor',
            reportedType,
            reportedId,
            reportedModel: reportedType === 'user' ? 'user' : 'doctor',
            appointmentId: appointmentId || null,
            blogId: blogId || null,
            reason,
            description,
            status: 'pending'
        });

        await report.save();

        res.json({
            success: true,
            message: 'Report submitted successfully. Our team will review it shortly.',
            reportId: report._id
        });

    } catch (error) {
        console.error('Error submitting report:', error);
        res.json({ success: false, message: error.message });
    }
};

// Upload evidence for a report
const uploadEvidence = async (req, res) => {
    try {
        const { reportId } = req.body;

        if (!req.file) {
            return res.json({ success: false, message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'report_evidence',
            resource_type: 'auto'
        });

        // Update report with evidence URL
        const report = await reportModel.findById(reportId);
        if (!report) {
            return res.json({ success: false, message: 'Report not found' });
        }

        report.evidence.push(result.secure_url);
        await report.save();

        res.json({
            success: true,
            message: 'Evidence uploaded successfully',
            evidenceUrl: result.secure_url
        });

    } catch (error) {
        console.error('Error uploading evidence:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all reports (Admin only)
const getAllReports = async (req, res) => {
    try {
        const { status, reportedType } = req.query;

        let query = { isTrashed: false }; // Exclude trashed reports by default
        if (status) query.status = status;
        if (reportedType) query.reportedType = reportedType;

        const reports = await reportModel.find(query)
            .sort({ createdAt: -1 });

        res.json({ success: true, reports });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get report by ID (Admin only)
const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await reportModel.findById(reportId);

        if (!report) {
            return res.json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, report });

    } catch (error) {
        console.error('Error fetching report:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update report status (Admin only)
const updateReportStatus = async (req, res) => {
    try {
        const { reportId, status, adminNotes, actionTaken, adminId } = req.body;

        const report = await reportModel.findById(reportId);
        if (!report) {
            return res.json({ success: false, message: 'Report not found' });
        }

        report.status = status;
        if (adminNotes) report.adminNotes = adminNotes;
        if (actionTaken) report.actionTaken = actionTaken;
        report.reviewedBy = adminId;
        report.reviewedAt = new Date();

        await report.save();

        res.json({
            success: true,
            message: 'Report updated successfully',
            report
        });

    } catch (error) {
        console.error('Error updating report:', error);
        res.json({ success: false, message: error.message });
    }
};

// Ban user (Admin only)
const banUser = async (req, res) => {
    try {
        const { userId, reason, adminId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        user.isBanned = true;
        user.banReason = reason;
        user.bannedAt = new Date();
        user.bannedBy = adminId;

        await user.save();

        // Cancel all active appointments for this user
        const cancelledAppointments = await appointmentModel.updateMany(
            {
                userId: userId,
                cancelled: false,
                isCompleted: false
            },
            {
                cancelled: true,
                cancelReason: 'User account has been banned'
            }
        );

        console.log(`Cancelled ${cancelledAppointments.modifiedCount} appointments for banned user ${user.name}`);

        // Emit socket event to force logout the user in real-time
        try {
            const io = getIO();
            io.emit('user-banned', {
                userId: userId,
                message: `Your account has been banned. Reason: ${reason}`,
                banReason: reason
            });
            console.log(`Emitted user-banned event for user ${userId}`);
        } catch (socketError) {
            console.error('Error emitting socket event:', socketError);
        }

        res.json({
            success: true,
            message: `User ${user.name} has been banned successfully. ${cancelledAppointments.modifiedCount} appointments cancelled.`
        });

    } catch (error) {
        console.error('Error banning user:', error);
        res.json({ success: false, message: error.message });
    }
};

// Unban user (Admin only)
const unbanUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        user.isBanned = false;
        user.banReason = '';
        user.bannedAt = null;
        user.bannedBy = null;

        await user.save();

        res.json({
            success: true,
            message: `User ${user.name} has been unbanned successfully`
        });

    } catch (error) {
        console.error('Error unbanning user:', error);
        res.json({ success: false, message: error.message });
    }
};

// Ban doctor (Admin only)
const banDoctor = async (req, res) => {
    try {
        const { doctorId, reason, adminId } = req.body;

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        doctor.isBanned = true;
        doctor.banReason = reason;
        doctor.bannedAt = new Date();
        doctor.bannedBy = adminId;
        doctor.available = false; // Also make unavailable

        await doctor.save();

        // Cancel all active appointments for this doctor
        const cancelledAppointments = await appointmentModel.updateMany(
            {
                docId: doctorId,
                cancelled: false,
                isCompleted: false
            },
            {
                cancelled: true,
                cancelReason: 'Doctor account has been banned'
            }
        );

        console.log(`Cancelled ${cancelledAppointments.modifiedCount} appointments for banned doctor ${doctor.name}`);

        // Emit socket event to force logout the doctor in real-time
        try {
            const io = getIO();
            io.emit('doctor-banned', {
                doctorId: doctorId,
                message: `Your account has been banned. Reason: ${reason}`,
                banReason: reason
            });
            console.log(`Emitted doctor-banned event for doctor ${doctorId}`);
        } catch (socketError) {
            console.error('Error emitting socket event:', socketError);
        }

        res.json({
            success: true,
            message: `Doctor ${doctor.name} has been banned successfully. ${cancelledAppointments.modifiedCount} appointments cancelled.`
        });

    } catch (error) {
        console.error('Error banning doctor:', error);
        res.json({ success: false, message: error.message });
    }
};

// Unban doctor (Admin only)
const unbanDoctor = async (req, res) => {
    try {
        const { doctorId } = req.body;

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
        }

        doctor.isBanned = false;
        doctor.banReason = '';
        doctor.bannedAt = null;
        doctor.bannedBy = null;
        doctor.available = true; // Make available again

        await doctor.save();

        res.json({
            success: true,
            message: `Doctor ${doctor.name} has been unbanned successfully`
        });

    } catch (error) {
        console.error('Error unbanning doctor:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get my reports (User or Doctor)
const getMyReports = async (req, res) => {
    try {
        const { userId, userType } = req.query;

        const reports = await reportModel.find({
            reporterId: userId,
            reporterType: userType
        })
            .sort({ createdAt: -1 });

        res.json({ success: true, reports });

    } catch (error) {
        console.error('Error fetching my reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get reports against me (User or Doctor)
const getReportsAgainstMe = async (req, res) => {
    try {
        const { userId, userType } = req.query;

        const reports = await reportModel.find({
            reportedId: userId,
            reportedType: userType
        })
            .sort({ createdAt: -1 });

        res.json({ success: true, reports });

    } catch (error) {
        console.error('Error fetching reports against me:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get report statistics (Admin only)
const getReportStatistics = async (req, res) => {
    try {
        const totalReports = await reportModel.countDocuments();
        const pendingReports = await reportModel.countDocuments({ status: 'pending' });
        const underReviewReports = await reportModel.countDocuments({ status: 'under_review' });
        const resolvedReports = await reportModel.countDocuments({ status: 'resolved' });
        const dismissedReports = await reportModel.countDocuments({ status: 'dismissed' });

        const bannedUsers = await userModel.countDocuments({ isBanned: true });
        const bannedDoctors = await doctorModel.countDocuments({ isBanned: true });

        // Reports by reason
        const reportsByReason = await reportModel.aggregate([
            { $group: { _id: '$reason', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            statistics: {
                totalReports,
                pendingReports,
                underReviewReports,
                resolvedReports,
                dismissedReports,
                bannedUsers,
                bannedDoctors,
                reportsByReason
            }
        });

    } catch (error) {
        console.error('Error fetching report statistics:', error);
        res.json({ success: false, message: error.message });
    }
};

// Mark reports as read
const markReportsAsRead = async (req, res) => {
    try {
        const { reportIds } = req.body;

        await reportModel.updateMany(
            { _id: { $in: reportIds } },
            { isRead: true }
        );

        res.json({ success: true, message: 'Reports marked as read' });
    } catch (error) {
        console.error('Error marking reports as read:', error);
        res.json({ success: false, message: error.message });
    }
};

// Move reports to trash
const moveReportsToTrash = async (req, res) => {
    try {
        const { reportIds } = req.body;

        await reportModel.updateMany(
            { _id: { $in: reportIds } },
            { isTrashed: true }
        );

        res.json({ success: true, message: 'Reports moved to trash' });
    } catch (error) {
        console.error('Error moving reports to trash:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete reports permanently
const deleteReports = async (req, res) => {
    try {
        const { reportIds } = req.body;

        await reportModel.deleteMany({ _id: { $in: reportIds } });

        res.json({ success: true, message: 'Reports deleted permanently' });
    } catch (error) {
        console.error('Error deleting reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get trashed reports
const getTrashedReports = async (req, res) => {
    try {
        const reports = await reportModel.find({ isTrashed: true })
            .sort({ createdAt: -1 });

        res.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching trashed reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Restore reports from trash
const restoreReports = async (req, res) => {
    try {
        const { reportIds } = req.body;

        await reportModel.updateMany(
            { _id: { $in: reportIds } },
            { isTrashed: false }
        );

        res.json({ success: true, message: 'Reports restored successfully' });
    } catch (error) {
        console.error('Error restoring reports:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete a blog post by admin
const deletePostByAdmin = async (req, res) => {
    try {
        const { blogId, reportId, adminId } = req.body;

        const blog = await blogModel.findById(blogId);
        if (!blog) {
            return res.json({ success: false, message: 'Blog post not found' });
        }

        const title = blog.title;

        await blogModel.findByIdAndDelete(blogId);

        // Update report status if reportId is provided
        if (reportId) {
            await reportModel.findByIdAndUpdate(reportId, {
                status: 'resolved',
                actionTaken: 'post_deleted',
                adminNotes: `Post "${title}" deleted by admin.`,
                reviewedBy: adminId,
                reviewedAt: new Date()
            });
        }

        res.json({ success: true, message: `Blog post "${title}" deleted successfully` });

    } catch (error) {
        console.error('Error deleting blog post by admin:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    submitReport,
    uploadEvidence,
    getAllReports,
    getReportById,
    updateReportStatus,
    banUser,
    unbanUser,
    banDoctor,
    unbanDoctor,
    getMyReports,
    getReportsAgainstMe,
    getReportStatistics,
    markReportsAsRead,
    moveReportsToTrash,
    deleteReports,
    getTrashedReports,
    restoreReports,
    deletePostByAdmin
};
