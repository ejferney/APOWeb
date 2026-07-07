const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['member', 'officer', 'admin'], default: 'member' },
    membershipType: { type: String, enum: ['active', 'associate', 'pledge', 'prospect', 'inactive', 'alumni'], default: 'pledge' },
    pledgeClass: { type: String },
    gradYear: { type: Number },
    phone: { type: String },
    avatar: { type: String },
    position: { type: String }, // e.g., 'President', 'VP Service'
    big: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // this member's big
    clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan' }, // family/clan they belong to
    serviceHours: { type: Number, default: 0 },
    fellowshipHours: { type: Number, default: 0 },
    leadershipHours: { type: Number, default: 0 },
    committeeHours: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
