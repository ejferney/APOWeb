const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['member', 'officer', 'admin'], default: 'member' },
    pledgeClass: { type: String },
    gradYear: { type: Number },
    phone: { type: String },
    avatar: { type: String },
    serviceHours: { type: Number, default: 0 },
    fellowshipHours: { type: Number, default: 0 },
    leadershipHours: { type: Number, default: 0 },
    committeeHours: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
