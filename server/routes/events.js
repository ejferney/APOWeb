const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { attended, status } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (attended === 'true') {
            query['attendees.user'] = req.user.userId;
        }

        const events = await Event.find(query)
            .sort({ start: 1 })
            .populate('attendees.user', 'firstName lastName email')
            .populate('completedBy', 'firstName lastName');

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

        const { title, start, end, location, type, description, image, creditType, creditAmount, creditDistribution } = req.body;

        const newEvent = new Event({
            title,
            start,
            end,
            location,
            type,
            description,
            image,
            creditType: creditType || 'none',
            creditAmount: creditAmount || 0,
            creditDistribution: creditDistribution || [],
            createdBy: req.user.userId
        });

        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Officer/Admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, start, end, location, type, description, image, creditType, creditAmount, creditDistribution } = req.body;

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        event.title = title || event.title;
        event.start = start || event.start;
        event.end = end || event.end;
        event.location = location || event.location;
        event.type = type || event.type;
        event.description = description !== undefined ? description : event.description;
        event.image = image !== undefined ? image : event.image;

        event.creditType = creditType || event.creditType;
        event.creditAmount = creditAmount !== undefined ? creditAmount : event.creditAmount;
        event.creditDistribution = creditDistribution || event.creditDistribution;

        await event.save();
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

// @route   PUT /api/events/:id/complete
// @desc    Complete event and award credits (with overrides)
// @access  Private (Officer/Admin only)
router.put('/:id/complete', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { attendees: finalizedAttendees } = req.body; // Expects array of { user: userId, creditAmount: number, comment: string }

        const event = await Event.findById(req.params.id).populate('attendees.user');
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        const User = require('../models/User');

        // REVERT LOGIC: If already completed, subtract previous credits
        if (event.status === 'completed') {
            console.log(`Reverting credits for event ${event._id} (Re-completion)`);

            // Check for multi-credit distribution first
            if (event.creditDistribution && event.creditDistribution.length > 0) {
                const revertUpdates = event.attendees.map(attendee => {
                    const userId = attendee.user?._id || attendee.user;
                    if (!userId) return null;

                    const incUpdate = {};
                    let totalDistributed = 0;
                    event.creditDistribution.forEach(credit => totalDistributed += credit.amount);

                    // Check for override (Revert Phase)
                    let overrideAmount = attendee.creditAmount;

                    event.creditDistribution.forEach((credit, index) => {
                        let amountToApply = credit.amount;
                        // Handle override logic implies adjusting the first credit type
                        if (overrideAmount !== undefined && overrideAmount !== null && Math.abs(overrideAmount - totalDistributed) > 0.01) {
                            if (index === 0) {
                                amountToApply += (overrideAmount - totalDistributed);
                            }
                        }

                        if (credit.type === 'service') incUpdate.serviceHours = (incUpdate.serviceHours || 0) - amountToApply;
                        if (credit.type === 'fellowship') incUpdate.fellowshipHours = (incUpdate.fellowshipHours || 0) - amountToApply;
                        if (credit.type === 'leadership') incUpdate.leadershipHours = (incUpdate.leadershipHours || 0) - amountToApply;
                        if (credit.type === 'committee') incUpdate.committeeHours = (incUpdate.committeeHours || 0) - amountToApply;
                    });

                    if (Object.keys(incUpdate).length === 0) return null;
                    return User.findByIdAndUpdate(userId, { $inc: incUpdate });
                });
                await Promise.all(revertUpdates.filter(u => u !== null));

            } else if (event.creditType && event.creditType !== 'none') {
                // Legacy Single Credit Logic
                const revertUpdates = event.attendees.map(attendee => {
                    const userId = attendee.user?._id || attendee.user;
                    if (!userId) return null;

                    // Use the stored override or default
                    let amount = parseFloat(attendee.creditAmount !== undefined ? attendee.creditAmount : event.creditAmount);
                    if (isNaN(amount) || amount <= 0) return null;

                    const incUpdate = {};
                    if (event.creditType === 'service') incUpdate.serviceHours = -amount;
                    if (event.creditType === 'fellowship') incUpdate.fellowshipHours = -amount;
                    if (event.creditType === 'leadership') incUpdate.leadershipHours = -amount;
                    if (event.creditType === 'committee') incUpdate.committeeHours = -amount;

                    return User.findByIdAndUpdate(userId, { $inc: incUpdate });
                });
                await Promise.all(revertUpdates.filter(u => u !== null));
            }
        }

        // UPDATE ATTENDEES LIST
        if (finalizedAttendees && Array.isArray(finalizedAttendees)) {
            event.attendees = finalizedAttendees.map(fa => ({
                user: fa.user,
                comment: fa.comment || '',
                creditAmount: parseFloat(fa.creditAmount) // Save the override (legacy/single)
            }));
        }

        // APPLY NEW CREDITS
        // Check for multi-credit distribution first
        if (event.creditDistribution && event.creditDistribution.length > 0) {
            const updates = event.attendees.map(attendee => {
                const userId = attendee.user?._id || attendee.user;
                if (!userId) return null;
                // Note: For multi-credit, we ignore per-attendee overrides for now as they are ambiguous

                const incUpdate = {};
                let totalDistributed = 0;
                event.creditDistribution.forEach(credit => totalDistributed += credit.amount);

                // Check for override
                let overrideAmount = attendee.creditAmount; // This is now populated in event.attendees
                // If override amount is provided, we need to adjust the distribution
                // Strategy: Adjust the FIRST credit type by the difference

                event.creditDistribution.forEach((credit, index) => {
                    let amountToApply = credit.amount;
                    if (overrideAmount !== undefined && overrideAmount !== null && Math.abs(overrideAmount - totalDistributed) > 0.01) {
                        // Apply difference to first item
                        if (index === 0) {
                            amountToApply += (overrideAmount - totalDistributed);
                        }
                    }

                    if (credit.type === 'service') incUpdate.serviceHours = (incUpdate.serviceHours || 0) + amountToApply;
                    if (credit.type === 'fellowship') incUpdate.fellowshipHours = (incUpdate.fellowshipHours || 0) + amountToApply;
                    if (credit.type === 'leadership') incUpdate.leadershipHours = (incUpdate.leadershipHours || 0) + amountToApply;
                    if (credit.type === 'committee') incUpdate.committeeHours = (incUpdate.committeeHours || 0) + amountToApply;
                });

                if (Object.keys(incUpdate).length === 0) return null;
                return User.findByIdAndUpdate(userId, { $inc: incUpdate }, { new: true });
            });
            await Promise.all(updates.filter(u => u !== null));

        } else if (event.creditType && event.creditType !== 'none') {
            // Legacy Single Credit Apply
            const updates = event.attendees.map(attendee => {
                const userId = attendee.user?._id || attendee.user;
                if (!userId) return null;
                let amount = parseFloat(attendee.creditAmount !== undefined ? attendee.creditAmount : event.creditAmount);
                if (isNaN(amount) || amount <= 0) return null;

                const incUpdate = {};
                if (event.creditType === 'service') incUpdate.serviceHours = amount;
                if (event.creditType === 'fellowship') incUpdate.fellowshipHours = amount;
                if (event.creditType === 'leadership') incUpdate.leadershipHours = amount;
                if (event.creditType === 'committee') incUpdate.committeeHours = amount;

                return User.findByIdAndUpdate(userId, { $inc: incUpdate }, { new: true });
            });
            await Promise.all(updates.filter(u => u !== null));
        }


        event.status = 'completed';
        event.completedBy = req.user.userId; // Track who did it

        await event.save();

        const populatedEvent = await Event.findById(event._id)
            .populate('attendees.user', 'firstName lastName email')
            .populate('completedBy', 'firstName lastName');

        res.json(populatedEvent);
    } catch (err) {
        console.error("Completion Error:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP to an event (Join/Leave/Update)
// @access  Private
router.post('/:id/rsvp', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.status === 'completed') {
            return res.status(400).json({ msg: 'Cannot RSVP to a completed event' });
        }

        const { comment, isDriver, seats, leaving } = req.body;

        // Check if already rsvp'd
        const existingAttendeeIndex = event.attendees.findIndex(
            a => a.user && a.user.toString() === req.user.userId
        );

        if (leaving) {
            if (existingAttendeeIndex !== -1) {
                event.attendees.splice(existingAttendeeIndex, 1);
            }
        } else {
            // Joining or Updating
            if (existingAttendeeIndex !== -1) {
                // Update
                if (comment !== undefined) event.attendees[existingAttendeeIndex].comment = comment;
                if (isDriver !== undefined) event.attendees[existingAttendeeIndex].isDriver = isDriver;
                if (seats !== undefined) event.attendees[existingAttendeeIndex].seats = seats;
            } else {
                // Add
                event.attendees.push({
                    user: req.user.userId,
                    comment: comment || '',
                    isDriver: !!isDriver,
                    seats: seats || 0
                });
            }
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
