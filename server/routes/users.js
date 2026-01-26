const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (directory)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Select specific fields to return, excluding password
        const users = await User.find().select('-password').sort({ lastName: 1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
