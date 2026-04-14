import mongoose from "mongoose";

const petSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    breed: { type: String, default: "Not Selected" },
    age: { type: String, default: "1" },
    gender: { type: String, default: "Male" },
    image: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    category: { type: String, default: "Not Selected" },
    qrToken: { type: String, unique: true, sparse: true }
}, { timestamps: true });

const petModel = mongoose.models.pet || mongoose.model("pet", petSchema);

export default petModel;
