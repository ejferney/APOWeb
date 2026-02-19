const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    prefix: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        maxLength: 3
    },
    nextSequence: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('Category', CategorySchema);
