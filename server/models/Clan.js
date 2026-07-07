const mongoose = require('mongoose');

// A clan groups a big-little family line and is defined by two colors,
// used to render a gradient banner on member profiles and the family tree.
const ClanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    colorPrimary: { type: String, required: true, default: '#3b82f6' },
    colorSecondary: { type: String, required: true, default: '#8b5cf6' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Clan', ClanSchema);
