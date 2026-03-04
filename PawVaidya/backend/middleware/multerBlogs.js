import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/blogs');
if (!fs.existsSync(uploadsDir)) {
    // Create the directory recursively if it doesn't exist
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists before saving
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'images') {
        // Allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    } else if (file.fieldname === 'videos') {
        // Allow videos
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'), false);
        }
    } else {
        cb(new Error('Invalid field name'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Max 10 files
    }
});

// Middleware to handle multiple image and video fields
export const uploadBlogFiles = upload.fields([
    { name: 'images', maxCount: 5 }, // Max 5 images
    { name: 'videos', maxCount: 3 }  // Max 3 videos
]);

export default upload;

