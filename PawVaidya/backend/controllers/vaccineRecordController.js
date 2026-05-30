import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import userModel from '../models/userModel.js';
import vaccineRecordModel from '../models/vaccineRecordModel.js';
import { generateGeminiContent } from '../utils/geminiHelper.js';

// POST /api/vaccine-records/upload
export const uploadVaccineRecord = async (req, res) => {
    let localFilePath = null;
    try {
        const userId = req.userId || req.body.userId; // Injected by authuser middleware
        const { petId, petName } = req.body;

        if (!req.file) {
            return res.json({ success: false, message: "No document file uploaded." });
        }

        localFilePath = req.file.path;

        if (!petName) {
            return res.json({ success: false, message: "Pet name is required." });
        }

        // 1. Upload to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
            folder: 'vaccine_vault',
            resource_type: 'auto' // handles both images and PDFs
        });

        // 2. Read local file for Gemini Vision OCR parsing
        const fileBuffer = fs.readFileSync(localFilePath);
        const base64Data = fileBuffer.toString("base64");
        const mimeType = req.file.mimetype;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        // 3. Formulate OCR prompt
        const prompt = `
Analyze this veterinary record, vaccination certificate, or medical report for a pet named "${petName}".
Extract the key vaccination entry and return the details in JSON format.
The JSON must follow this exact format:
{
  "vaccineName": "Rabies / DHPP / FVRCP etc.",
  "batchId": "Batch number or Lot number, empty string if not found",
  "administrationDate": "YYYY-MM-DD format of when it was administered",
  "nextDosageDate": "YYYY-MM-DD format of when the next booster/dosage is due (if not explicitly written, estimate based on vaccine rules e.g., 1 year from administration date)",
  "notes": "Brief extraction of any clinics, doctor initials, or general notes from the card"
}

Respond ONLY with valid JSON. Do not include markdown code block formatting (like \`\`\`json) in your response. If you cannot extract anything, try your best to estimate the fields based on what is visible in the document.
`;

        // 4. Query Gemini Vision OCR
        console.log("[Vaccine OCR] Requesting Gemini OCR parse...");
        const resultText = await generateGeminiContent({
            prompt,
            image: imagePart,
            jsonMode: true
        });

        let cleanedJson = resultText;
        if (cleanedJson.startsWith("```")) {
            cleanedJson = cleanedJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        }

        const ocrData = JSON.parse(cleanedJson);

        // 5. Save Record to Database
        const newRecord = new vaccineRecordModel({
            userId,
            petId: petId || null,
            petName,
            documentUrl: cloudinaryResult.secure_url,
            vaccineName: ocrData.vaccineName || "Unknown Vaccine",
            batchId: ocrData.batchId || "",
            administrationDate: ocrData.administrationDate ? new Date(ocrData.administrationDate) : new Date(),
            nextDosageDate: ocrData.nextDosageDate ? new Date(ocrData.nextDosageDate) : null,
            notes: ocrData.notes || "",
            rawOcrText: resultText
        });

        await newRecord.save();

        // 6. Award +2 loyalty PawPoints
        const user = await userModel.findById(userId);
        if (user) {
            user.pawpoints = (user.pawpoints || 0) + 2;
            await user.save();
        }

        return res.json({
            success: true,
            message: "Vaccine record uploaded and parsed successfully.",
            record: newRecord,
            earnedPawPoints: 2
        });

    } catch (error) {
        console.error("Error uploading vaccine record:", error);
        return res.json({ success: false, message: "Failed to parse vaccine record: " + error.message });
    } finally {
        // Clean up temporary local upload file
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log(`[Vaccine OCR] Cleaned up temporary local file: ${localFilePath}`);
            } catch (err) {
                console.error("Error deleting temporary file:", err.message);
            }
        }
    }
};

// GET /api/vaccine-records/list
export const listVaccineRecords = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const records = await vaccineRecordModel.find({ userId })
            .sort({ administrationDate: -1 })
            .populate('petId');

        return res.json({ success: true, records });
    } catch (error) {
        console.error("Error listing vaccine records:", error);
        return res.json({ success: false, message: error.message });
    }
};

// POST /api/vaccine-records/toggle-reminders/:id
export const toggleReminders = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;

        const record = await vaccineRecordModel.findOne({ _id: id, userId });
        if (!record) {
            return res.json({ success: false, message: "Record not found or unauthorized." });
        }

        record.remindersEnabled = !record.remindersEnabled;
        await record.save();

        return res.json({
            success: true,
            message: `Reminders successfully ${record.remindersEnabled ? 'enabled' : 'disabled'}.`,
            record
        });
    } catch (error) {
        console.error("Error toggling reminders:", error);
        return res.json({ success: false, message: error.message });
    }
};

// DELETE /api/vaccine-records/:id
export const deleteVaccineRecord = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { id } = req.params;

        const deleted = await vaccineRecordModel.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.json({ success: false, message: "Record not found or unauthorized." });
        }

        return res.json({ success: true, message: "Vaccine record deleted successfully." });
    } catch (error) {
        console.error("Error deleting vaccine record:", error);
        return res.json({ success: false, message: error.message });
    }
};
