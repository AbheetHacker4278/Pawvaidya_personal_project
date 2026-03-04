import jwt from 'jsonwebtoken';

//user auth middleware
export const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;
        if (!dtoken) {
            return res.json({
                success: false,
                message: "not authorized to login"
            })
        }
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        req.body.docId = token_decode.id
        next()
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
