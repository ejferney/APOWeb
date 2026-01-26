const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.find().sort({ start: 1 }).populate('attendees.user', 'firstName lastName email');
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/events
// @desc    Create an event
// @access  Private (Officer/Admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, start, end, location, type, description, image } = req.body;

        const newEvent = new Event({
            title,
            start,
            end,
            location,
            type,
            description,
            image,
            createdBy: req.user.userId
        });

        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Officer/Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        await event.deleteOne();
        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event (Toggle)
// @access  Private
router.post('/:id/rsvp', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const { comment } = req.body;

        // Check if already rsvp'd
        const existingAttendeeIndex = event.attendees.findIndex(
            a => a.user && a.user.toString() === req.user.userId
        );

        if (existingAttendeeIndex !== -1) {
            // Remove (Un-RSVP) - Toggle behavior
            // If they are un-RSVPing, we remove them regardless of comment
            event.attendees.splice(existingAttendeeIndex, 1);
        } else {
            // Add (RSVP)
            event.attendees.push({
                user: req.user.userId,
                comment: comment || ''
            });
        }

        await event.save();

        // Re-fetch to return populated attendees
        const populatedEvent = await Event.findById(req.params.id).populate('attendees.user', 'firstName lastName email');
        res.json(populatedEvent.attendees);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
