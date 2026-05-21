import jwt from "jsonwebtoken";

// Hybrid authorization middleware for Doctor chatbot endpoint.
// Allows access if EITHER a valid doctor token (dtoken) OR a valid admin token (atoken) is provided.
const authDoctorOrAdmin = async (req, res, next) => {
    try {
        const { dtoken, atoken } = req.headers;

        if (atoken) {
            // Verify as Admin
            const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
            req.body.adminId = token_decode.id || token_decode.email;
            next();
        } else if (dtoken) {
            // Verify as Doctor
            const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET);
            req.body.docId = token_decode.id;
            next();
        } else {
            return res.json({
                success: false,
                message: "Not authorized. Access token is missing."
            });
        }
    } catch (error) {
        console.error("[authDoctorOrAdmin] Verification failed:", error.message);
        return res.json({
            success: false,
            message: "Session expired or invalid authentication token."
        });
    }
};

export default authDoctorOrAdmin;
