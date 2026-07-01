import admin from 'firebase-admin';
import fs from 'fs';

let firebaseApp = null;
let storageBucket = null;

export const connectFirebase = () => {
    try {
        if (firebaseApp) return firebaseApp;

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

        if (!projectId || !clientEmail || !privateKey || !bucketName) {
            console.warn("⚠️ Firebase Storage credentials not fully set in environment variables. Firebase uploads will fall back or fail.");
            return null;
        }

        // Clean private key format
        if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        const formattedPrivateKey = privateKey ? privateKey.replace(/\\n/g, '\n') : undefined;

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey
            }),
            storageBucket: bucketName
        }, 'pawvaidya'); // named app to prevent conflicts

        storageBucket = admin.storage(firebaseApp).bucket();
        console.log("🔥 Firebase Admin SDK initialized successfully for storage bucket:", bucketName);
        return firebaseApp;
    } catch (error) {
        console.error("❌ Failed to initialize Firebase Admin:", error.message);
        return null;
    }
};

export const uploadToFirebase = async (filePath, destinationPath, mimeType) => {
    try {
        // Ensure initialized
        if (!storageBucket) {
            connectFirebase();
        }
        if (!storageBucket) {
            throw new Error("Firebase storage bucket is not initialized. Please configure your Firebase environment variables.");
        }

        // Upload local file to bucket
        const options = {
            destination: destinationPath,
            public: true,
            metadata: {
                contentType: mimeType,
                metadata: {
                    firebaseStorageDownloadTokens: Date.now().toString()
                }
            }
        };

        const [file] = await storageBucket.upload(filePath, options);

        // Try to make public as fallback, but we will use getSignedUrl for absolute reliability
        try {
            await file.makePublic();
        } catch (e) {
            console.warn("Could not make file public explicitly:", e.message);
        }

        // Generate signed URL with far future expiration (approx. 50 years)
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '12-31-2075'
        });

        const publicUrl = signedUrl;

        // Clean up local file after upload
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error("Error deleting local file after Firebase upload:", err.message);
        }

        return publicUrl;
    } catch (error) {
        console.error("Error uploading to Firebase Storage:", error.message);
        // Ensure local file is still cleaned up on error
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) { }
        throw error;
    }
};

export const deleteFromFirebase = async (url) => {
    try {
        if (!storageBucket) {
            connectFirebase();
        }
        if (!storageBucket) {
            console.warn("Firebase Storage bucket is not initialized for deletion.");
            return false;
        }

        // Check if URL is from Firebase
        const bucketName = storageBucket.name;
        const prefix = `https://storage.googleapis.com/${bucketName}/`;
        const altPrefix = `https://firebasestorage.googleapis.com/`;

        let filePath = null;

        if (url.startsWith(prefix)) {
            const rawPath = url.substring(prefix.length).split('?')[0];
            filePath = decodeURIComponent(rawPath);
        } else if (url.includes(altPrefix) && url.includes(bucketName)) {
            // e.g. https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media
            const parts = url.split('/o/');
            if (parts.length > 1) {
                const rawPath = parts[1].split('?')[0];
                filePath = decodeURIComponent(rawPath);
            }
        }

        if (filePath) {
            const file = storageBucket.file(filePath);
            const [exists] = await file.exists();
            if (exists) {
                await file.delete();
                console.log(`Deleted file from Firebase Storage: ${filePath}`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error deleting from Firebase Storage:", error.message);
        return false;
    }
};

let cachedStats = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export const getFirebaseStorageStats = async () => {
    try {
        const now = Date.now();
        if (cachedStats && (now - lastFetchTime < CACHE_TTL)) {
            return cachedStats;
        }

        if (!storageBucket) {
            connectFirebase();
        }
        if (!storageBucket) {
            return {
                status: 'offline',
                latency: 0,
                error: 'Firebase Storage not initialized',
                details: {
                    bucketName: 'N/A',
                    usedStorage: '0.00 MB',
                    remainingStorage: '5.00 GB',
                    totalQuota: '5.00 GB',
                    percentUsed: '0%',
                    fileCount: 0
                }
            };
        }

        const start = Date.now();
        // Ping: get files with maxResults 1 to verify connection
        const [files] = await storageBucket.getFiles({ maxResults: 1 });
        const latency = Date.now() - start;

        // Fetch all files to sum their sizes for exact usage
        const [allFiles] = await storageBucket.getFiles();
        let totalSizeBytes = 0;
        allFiles.forEach(file => {
            if (file.metadata && file.metadata.size) {
                totalSizeBytes += parseInt(file.metadata.size);
            }
        });

        // Free tier (Spark plan) Storage limit is 5 GB
        const totalQuotaBytes = 5 * 1024 * 1024 * 1024; // 5 GB
        const usedCredits = (totalSizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
        const remainingCredits = Math.max(0, (totalQuotaBytes - totalSizeBytes) / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        const percentUsed = ((totalSizeBytes / totalQuotaBytes) * 100).toFixed(2);

        const stats = {
            status: 'online',
            latency,
            details: {
                bucketName: storageBucket.name,
                usedStorage: usedCredits,
                remainingStorage: remainingCredits,
                totalQuota: '5.00 GB',
                percentUsed: `${percentUsed}%`,
                fileCount: allFiles.length
            }
        };

        cachedStats = stats;
        lastFetchTime = now;
        return stats;
    } catch (err) {
        console.error("Error fetching Firebase Storage Stats:", err.message);
        return {
            status: 'offline',
            latency: 0,
            error: err.message,
            details: {
                bucketName: storageBucket ? storageBucket.name : 'Unknown',
                usedStorage: '0.00 MB',
                remainingStorage: '5.00 GB',
                totalQuota: '5.00 GB',
                percentUsed: '0%',
                fileCount: 0
            }
        };
    }
};

