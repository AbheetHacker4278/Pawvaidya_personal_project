import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'cs_agent'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  sentimentAnalysis: {
    score: { type: Number, default: 0 },
    label: { type: String, default: 'neutral' },
    deEscalationTip: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('TicketMessage', ticketMessageSchema);
