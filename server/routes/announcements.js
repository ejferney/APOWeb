const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

// @route   GET /api/announcements
// @desc    Get latest announcements
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('author', 'firstName lastName position');
        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/announcements
// @desc    Post an announcement
// @access  Private (Officer/Admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({ msg: 'Title and body are required' });
        }

        const announcement = new Announcement({
            title,
            body,
            author: req.user.userId
        });
        await announcement.save();

        const populated = await Announcement.findById(announcement._id)
            .populate('author', 'firstName lastName position');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (Officer/Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ msg: 'Announcement not found' });
        }

        await announcement.deleteOne();
        res.json({ msg: 'Announcement removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
