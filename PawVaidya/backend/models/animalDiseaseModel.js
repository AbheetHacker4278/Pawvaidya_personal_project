import mongoose from 'mongoose';

const caseLogSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true
    },
    statusAtLog: {
        type: String,
        default: 'Monitoring'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const animalDiseaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'pet',
        default: null
    },
    petName: {
        type: String,
        required: true
    },
    animalType: {
        type: String,
        required: true,
        enum: ['Dog', 'Cat', 'Cow', 'Sheep', 'Goat']
    },
    age: {
        type: Number,
        default: 1
    },
    symptoms: [{
        name: { type: String, required: true },
        severity: { type: Number, required: true, min: 1, max: 5 }
    }],
    predictions: [{
        condition: { type: String, required: true },
        confidence: { type: Number, required: true } // Percentage e.g. 85.5
    }],
    caseStatus: {
        type: String,
        enum: ['Monitoring', 'Requires Vet', 'Resolved'],
        default: 'Monitoring'
    },
    trackingLogs: [caseLogSchema],
    pawPointsEarned: {
        type: Number,
        default: 3
    }
}, { timestamps: true });

const animalDiseaseModel = mongoose.models.AnimalDisease || mongoose.model('AnimalDisease', animalDiseaseSchema);

export default animalDiseaseModel;
