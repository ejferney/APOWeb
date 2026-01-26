const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const auth = require('../middleware/auth');

// @route   GET /api/availability/me
// @desc    Get current user's availability
router.get('/me', auth, async (req, res) => {
    try {
        let avail = await Availability.findOne({ user: req.user.userId });
        if (!avail) {
            return res.json({ slots: [] });
        }
        res.json(avail);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/availability
// @desc    Save user's availability
router.post('/', auth, async (req, res) => {
    try {
        const { slots } = req.body;

        let avail = await Availability.findOne({ user: req.user.userId });
        if (avail) {
            avail.slots = slots;
            await avail.save();
        } else {
            avail = new Availability({
                user: req.user.userId,
                slots
            });
            await avail.save();
        }
        res.json(avail);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/availability/all
// @desc    Get aggregated heatmap data (Oficers only)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const allAvail = await Availability.find().populate('user', 'firstName lastName');

        // Aggregate counts
        const heatmap = {}; // { 'mon-0900': 5, ... }

        allAvail.forEach(entry => {
            entry.slots.forEach(slot => {
                heatmap[slot] = (heatmap[slot] || 0) + 1;
            });
        });

        res.json(heatmap);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
