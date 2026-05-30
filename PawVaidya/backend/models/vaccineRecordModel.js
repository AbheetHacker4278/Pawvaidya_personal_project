import mongoose from "mongoose";

const vaccineRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'pet', default: null },
    petName: { type: String, required: true },
    documentUrl: { type: String, required: true }, // URL of uploaded image/PDF
    vaccineName: { type: String, required: true },
    batchId: { type: String, default: "" },
    administrationDate: { type: Date, required: true },
    nextDosageDate: { type: Date, default: null },
    remindersEnabled: { type: Boolean, default: true },
    remindersSent: {
        sevenDaysPrior: { type: Boolean, default: false },
        oneDayPrior: { type: Boolean, default: false }
    },
    notes: { type: String, default: "" },
    rawOcrText: { type: String, default: "" }
}, { timestamps: true });

const vaccineRecordModel = mongoose.models.vaccineRecord || mongoose.model("vaccineRecord", vaccineRecordSchema);

export default vaccineRecordModel;
