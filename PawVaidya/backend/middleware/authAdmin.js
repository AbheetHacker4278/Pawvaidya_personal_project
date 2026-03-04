import jwt from 'jsonwebtoken';

//admin auth middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers;
        if (!atoken) {
            return res.json({
                success: false,
                message: "not authorized to login"
            })
        }
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)

        // Check if it's the Master Admin (Env variables)
        if (token_decode.email === process.env.ADMIN_EMAIL) {
            req.admin = {
                email: token_decode.email,
                role: 'master',
                permissions: ['all'] // Master has all permissions
            };
            next();
        } else {
            // Check if it's a Child Admin (Database)
            // Import adminModel dynamically inside the function if needed, or assume it's available globally/imported at top
            // Since we use ES modules, top-level import is fine.
            // Need to import adminModel first. I will add the import in a separate step or assume it is imported. 
            // Wait, I should add the import at the top of the file first if it's not there.
            // Let's check the file content again. It matches.

            // I'll rewrite the whole file to include the import and the logic.
            const admin = await import('../models/adminModel.js').then(m => m.default.findOne({ email: token_decode.email }));

            if (!admin) {
                return res.json({
                    success: false,
                    message: "not authorized to login"
                });
            }

            req.admin = {
                email: admin.email,
                role: 'admin',
                permissions: admin.permissions || [],
                id: admin._id
            };
            next();
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.json({
                success: false,
                message: "Session expired. Please login again."
            });
        }
        console.log(error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

export default authAdmin