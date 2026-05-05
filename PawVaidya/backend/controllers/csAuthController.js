import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import CSEmployee from '../models/csEmployeeModel.js';
import CSLoginHistory from '../models/csLoginHistoryModel.js';

// POST /api/cs/login
export const csLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ success: false, message: 'Email and password are required.' });

        const employee = await CSEmployee.findOne({ email });
        if (!employee) return res.json({ success: false, message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) return res.json({ success: false, message: 'Invalid credentials.' });

        if (employee.status === 'suspended') {
            return res.json({ success: false, message: `Account suspended. Reason: ${employee.suspendedReason || 'Policy violation'}` });
        }

        // Check if profile deadline has passed
        if (!employee.profileComplete && employee.profileDeadline && new Date() > new Date(employee.profileDeadline)) {
            await CSEmployee.findByIdAndUpdate(employee._id, {
                status: 'suspended',
                suspendedReason: 'Profile not completed within 2 days of account creation.',
                suspendedAt: new Date()
            });
            return res.json({ success: false, message: 'Your account has been suspended because you did not complete your profile within 2 days. Please contact the admin.' });
        }

        // Determine if face verification is needed
        const needsFaceReg = employee.faceDescriptor.length === 0;
        const needsProfileCompletion = !employee.profileComplete;

        // Generate a pre-auth token (limited scope)
        const preToken = jwt.sign({ id: employee._id, scope: 'pre-auth' }, process.env.JWT_SECRET, { expiresIn: '15m' });

        return res.json({
            success: true,
            preToken,
            needsFaceRegistration: needsFaceReg,
            needsProfileCompletion,
            employeeId: employee._id,
            name: employee.name,
            message: needsFaceReg ? 'Please complete face registration.' : (needsProfileCompletion ? 'Please complete your profile.' : 'Proceed to face verification.')
        });

    } catch (error) {
        console.error('csLogin error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/face-register  –  one-time setup, saves face descriptor
export const faceRegister = async (req, res) => {
    try {
        const { preToken, faceDescriptor, faceImage } = req.body;
        if (!preToken || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const decoded = jwt.verify(preToken, process.env.JWT_SECRET);
        if (decoded.scope !== 'pre-auth') return res.json({ success: false, message: 'Invalid token.' });

        const updateData = {
            faceDescriptor,
            faceVerified: true,
            status: 'active'
        };

        if (faceImage) {
            const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_faces' });
            updateData.registeredFaceImage = uploadRes.secure_url;
        }

        await CSEmployee.findByIdAndUpdate(decoded.id, updateData);

        return res.json({ success: true, message: 'Face registered successfully. You can now log in.' });
    } catch (error) {
        console.error('faceRegister error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/face-verify  –  login step 2: compare submitted descriptor
export const faceVerify = async (req, res) => {
    try {
        const { preToken, faceDescriptor } = req.body;
        if (!preToken || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const decoded = jwt.verify(preToken, process.env.JWT_SECRET);
        if (decoded.scope !== 'pre-auth') return res.json({ success: false, message: 'Invalid token.' });

        const employee = await CSEmployee.findById(decoded.id);
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });

        if (employee.faceDescriptor.length === 0) {
            return res.json({ success: false, message: 'Face not registered yet. Please register first.' });
        }

        // Euclidean distance (threshold 0.6)
        const stored = employee.faceDescriptor;
        const submitted = faceDescriptor;
        if (stored.length !== submitted.length) return res.json({ success: false, message: 'Face descriptor mismatch. Please try again.' });

        let sumSq = 0;
        for (let i = 0; i < stored.length; i++) {
            sumSq += Math.pow(stored[i] - submitted[i], 2);
        }
        const distance = Math.sqrt(sumSq);

        if (distance > 0.6) {
            return res.json({ success: false, message: 'Face not recognized. Please try again.' });
        }

        // Issue full access token
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const ua = req.headers['user-agent'] || '';
        const { faceImage } = req.body;

        let loginFaceImageUrl = '';
        if (faceImage) {
            try {
                const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_login_faces' });
                loginFaceImageUrl = uploadRes.secure_url;
            } catch (err) {
                console.error('Face image upload failed:', err);
            }
        }

        await CSEmployee.findByIdAndUpdate(employee._id, {
            lastLogin: new Date(),
            lastLoginIp: ip,
            faceVerified: true,
            isOnline: true
        });

        await CSLoginHistory.create({
            employeeId: employee._id,
            employeeName: employee.name,
            loginAt: new Date(),
            ip,
            device: ua.substring(0, 200),
            loginFaceImage: loginFaceImageUrl
        });

        const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        return res.json({
            success: true,
            token,
            employee: {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                profilePic: employee.profilePic,
                status: employee.status,
                profileComplete: employee.profileComplete,
                fiveStarCount: employee.fiveStarCount || 0,
                adminIncentive: employee.adminIncentive || { amount: 0, expiresAt: null }
            },
            message: 'Login successful.'
        });
    } catch (error) {
        console.error('faceVerify error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/complete-profile  –  fill in profile details
export const completeProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { name, phone, bio, profilePic } = req.body;
        if (!employeeId) return res.json({ success: false, message: 'Unauthorized.' });

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        if (profilePic) updateData.profilePic = profilePic;
        updateData.profileComplete = true;

        await CSEmployee.findByIdAndUpdate(employeeId, updateData);

        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('completeProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/update-profile
export const updateCSProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { name, phone, bio } = req.body;
        const imageFile = req.file;

        if (!employeeId) return res.json({ success: false, message: 'Unauthorized.' });

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            updateData.profilePic = imageUpload.secure_url;
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, updateData, { new: true }).select('-password -plainPassword -faceDescriptor');

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('updateCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/profile
export const getCSProfile = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await CSEmployee.findById(employeeId).select('-password -plainPassword -faceDescriptor');
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });
        return res.json({ success: true, employee });
    } catch (error) {
        console.error('getCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// GET /api/cs/public-profile/:id  –  basic info shown to user before rating
export const getPublicCSProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await CSEmployee.findById(id).select('name profilePic averageRating totalRatings totalTicketsResolved joinedAt');
        if (!employee) return res.json({ success: false, message: 'Employee not found.' });
        return res.json({ success: true, employee });
    } catch (error) {
        console.error('getPublicCSProfile error:', error);
        res.json({ success: false, message: error.message });
    }
};
// POST /api/cs/logout
export const csLogout = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        if (employeeId) {
            await CSEmployee.findByIdAndUpdate(employeeId, { isOnline: false });

            // Update login history with logout time
            const lastLogin = await CSLoginHistory.findOne({ employeeId, logoutAt: null }).sort({ loginAt: -1 });
            if (lastLogin) {
                const logoutAt = new Date();
                const duration = Math.round((logoutAt - lastLogin.loginAt) / (1000 * 60));
                lastLogin.logoutAt = logoutAt;
                lastLogin.sessionDurationMinutes = Math.max(0, duration);
                await lastLogin.save();
            }
        }
        return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        console.error('csLogout error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/re-register-face
export const reRegisterFace = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { faceDescriptor, faceImage } = req.body;
        if (!employeeId || !faceDescriptor) return res.json({ success: false, message: 'Missing required fields.' });

        const updateData = {
            faceDescriptor,
            faceVerified: true
        };

        if (faceImage) {
            const uploadRes = await cloudinary.uploader.upload(faceImage, { folder: 'cs_faces' });
            updateData.registeredFaceImage = uploadRes.secure_url;
        }

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(employeeId, updateData, { new: true }).select('-password -plainPassword -faceDescriptor');

        return res.json({ success: true, message: 'Biometrics updated successfully.', employee: updatedEmployee });
    } catch (error) {
        console.error('reRegisterFace error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/upload-document
export const uploadCSDocument = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { docType } = req.body;
        const docFile = req.file;

        if (!employeeId || !docType || !docFile) {
            return res.json({ success: false, message: 'Missing required fields or file.' });
        }

        const uploadRes = await cloudinary.uploader.upload(docFile.path, {
            resource_type: 'image',
            folder: 'cs_docs',
            access_mode: 'public'
        });

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            {
                $push: {
                    documents: {
                        docType,
                        docUrl: uploadRes.secure_url
                    }
                }
            },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');

        return res.json({
            success: true,
            message: 'Document uploaded successfully.',
            employee: updatedEmployee
        });
    } catch (error) {
        console.error('uploadCSDocument error:', error);
        res.json({ success: false, message: error.message });
    }
};

// POST /api/cs/delete-document
export const deleteCSDocument = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { docId } = req.body;

        if (!employeeId || !docId) return res.json({ success: false, message: 'Missing document ID.' });

        const updatedEmployee = await CSEmployee.findByIdAndUpdate(
            employeeId,
            { $pull: { documents: { _id: docId } } },
            { new: true }
        ).select('-password -plainPassword -faceDescriptor');

        return res.json({ success: true, message: 'Document deleted successfully.', employee: updatedEmployee });
    } catch (error) {
        console.error('deleteCSDocument error:', error);
        res.json({ success: false, message: error.message });
    }
};

export default { csLogin, faceRegister, faceVerify, completeProfile, updateCSProfile, getCSProfile, getPublicCSProfile, csLogout, reRegisterFace, uploadCSDocument, deleteCSDocument };
