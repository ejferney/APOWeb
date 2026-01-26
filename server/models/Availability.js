const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    // Array of slot IDs e.g. "mon-0900", "fri-1430"
    slots: [{ type: String }]
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
