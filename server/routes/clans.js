const express = require('express');
const router = express.Router();
const Clan = require('../models/Clan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const pledgeEducator = require('../middleware/pledgeEducator');

// @route   GET /api/clans
// @desc    List all clans
// @access  Private (any member)
router.get('/', auth, async (req, res) => {
    try {
        const clans = await Clan.find().sort({ name: 1 });
        res.json(clans);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/clans
// @desc    Create a clan
// @access  Private (Pledge Educator/Admin)
router.post('/', auth, pledgeEducator, async (req, res) => {
    try {
        const { name, colorPrimary, colorSecondary } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ msg: 'Clan name is required' });
        }

        const existing = await Clan.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ msg: 'A clan with that name already exists' });
        }

        const clan = new Clan({
            name: name.trim(),
            colorPrimary: colorPrimary || '#3b82f6',
            colorSecondary: colorSecondary || '#8b5cf6',
            createdBy: req.user.userId
        });
        await clan.save();
        res.status(201).json(clan);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/clans/:id
// @desc    Update a clan (name / colors)
// @access  Private (Pledge Educator/Admin)
router.put('/:id', auth, pledgeEducator, async (req, res) => {
    try {
        const { name, colorPrimary, colorSecondary } = req.body;
        const clan = await Clan.findById(req.params.id);
        if (!clan) {
            return res.status(404).json({ msg: 'Clan not found' });
        }

        if (name !== undefined && name.trim()) {
            const dup = await Clan.findOne({ name: name.trim(), _id: { $ne: clan._id } });
            if (dup) return res.status(400).json({ msg: 'A clan with that name already exists' });
            clan.name = name.trim();
        }
        if (colorPrimary !== undefined) clan.colorPrimary = colorPrimary;
        if (colorSecondary !== undefined) clan.colorSecondary = colorSecondary;

        await clan.save();
        res.json(clan);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/clans/:id
// @desc    Delete a clan and detach it from members
// @access  Private (Pledge Educator/Admin)
router.delete('/:id', auth, pledgeEducator, async (req, res) => {
    try {
        const clan = await Clan.findById(req.params.id);
        if (!clan) {
            return res.status(404).json({ msg: 'Clan not found' });
        }

        await User.updateMany({ clan: clan._id }, { $unset: { clan: '' } });
        await clan.deleteOne();
        res.json({ msg: 'Clan removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
