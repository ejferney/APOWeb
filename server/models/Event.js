const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    location: { type: String, required: true },
    type: {
        type: String,
        enum: ['meeting', 'service', 'fellowship', 'other'],
        default: 'other'
    },
    description: { type: String },
    image: { type: String },
    status: {
        type: String,
        enum: ['upcoming', 'completed'],
        default: 'upcoming'
    },
    creditType: {
        type: String,
        enum: ['service', 'fellowship', 'leadership', 'committee', 'none'],
        default: 'none'
    },
    creditAmount: { type: Number, default: 0 },
    // Multiple credits support
    creditDistribution: [{
        type: {
            type: String,
            enum: ['service', 'fellowship', 'leadership', 'committee'],
            required: true
        },
        amount: { type: Number, required: true }
    }],
    attendees: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, default: '' },
        creditAmount: { type: Number }, // Optional override
        isDriver: { type: Boolean, default: false },
        seats: { type: Number, default: 0 }
    }],

    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
