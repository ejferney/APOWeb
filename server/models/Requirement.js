const mongoose = require('mongoose');

const RequirementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['active', 'associate', 'pledge', 'prospect', 'inactive', 'alumni'],
        required: true,
        unique: true
    },
    serviceHours: { type: Number, default: 0 },
    fellowshipHours: { type: Number, default: 0 },
    leadershipHours: { type: Number, default: 0 },
    committeeHours: { type: Number, default: 0 }
});

module.exports = mongoose.model('Requirement', RequirementSchema);
