import { v2 as cloudinary } from 'cloudinary';
import { uploadToFirebase } from '../config/firebase.js';

/**
 * Uploads a file either to Cloudinary (for images) or to Firebase Storage (for PDFs and other document types).
 * @param {Object} file - The file object from multer (e.g. req.file)
 * @param {string} folder - The folder/destination path prefix (e.g. 'chat_files')
 * @returns {Promise<{url: string, type: string, publicId: string}>}
 */
export const uploadFile = async (file, folder) => {
    if (!file) {
        throw new Error("No file provided for upload");
    }

    const mimeType = file.mimetype ? file.mimetype.toLowerCase() : '';
    const originalName = file.originalname || '';
    
    // Check if the file is an image
    const isImage = mimeType.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp|heic|svg)$/i.test(originalName);

    if (isImage) {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            resource_type: 'image',
            folder: folder
        });
        return {
            url: uploadResult.secure_url,
            type: 'image',
            publicId: uploadResult.public_id
        };
    } else {
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const cleanFileName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
        const destinationPath = `${folder}/${timestamp}_${cleanFileName}`;
        
        const publicUrl = await uploadToFirebase(file.path, destinationPath, file.mimetype || 'application/octet-stream');
        
        return {
            url: publicUrl,
            type: 'raw', // Keep as 'raw' or 'file' to match frontend checks for PDF/attachments
            publicId: destinationPath
        };
    }
};
