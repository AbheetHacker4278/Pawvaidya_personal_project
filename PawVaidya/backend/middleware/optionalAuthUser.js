import jwt from 'jsonwebtoken';

// Optional user auth middleware
// If a token is provided, decode it and attach userId to req.body.
// If not, simply proceed as a guest user (req.body.userId remains undefined).
const optionalAuthUser = async (req, res, next) => {
    try {
        const { token } = req.headers;
        if (token) {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);
            req.body.userId = token_decode.id;
        }
        next();
    } catch (error) {
        // Even if the token is expired, invalid, or malformed,
        // we do not block the request. We let them proceed as a guest.
        console.warn("[optionalAuthUser] Token verification failed:", error.message);
        next();
    }
};

export default optionalAuthUser;
