const mongoose = require('mongoose');

// A self-reported hour submission (service done outside chapter events).
// Approved hours are added to the user's hour totals.
const ServiceLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
        type: String,
        enum: ['service', 'fellowship', 'leadership', 'committee'],
        required: true
    },
    hours: { type: Number, required: true, min: 0.25 },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    contact: { type: String, default: '' }, // who can verify (name/email/org)
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceLog', ServiceLogSchema);
