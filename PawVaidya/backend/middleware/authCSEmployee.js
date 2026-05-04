import jwt from 'jsonwebtoken';

export const authCSEmployee = async (req, res, next) => {
    try {
        const { cstoken } = req.headers;
        if (!cstoken) {
            return res.json({ success: false, message: 'Not authorized. Please login.' });
        }
        const decoded = jwt.verify(cstoken, process.env.JWT_SECRET);
        req.employeeId = decoded.id; // Correct way to attach data in middleware
        req.body.employeeId = decoded.id; // Legacy/fallback
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.json({ success: false, message: 'Session expired. Please login again.' });
        }
        res.json({ success: false, message: error.message });
    }
};
