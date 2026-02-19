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

// @route   GET /api/users/me
// @desc    Get current user profile (fresh stats)
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (e.g. membershipType, role)
// @access  Private (Officer/Admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { membershipType, role, pledgeClass } = req.body;

        // Build update object
        const updateFields = {};
        if (membershipType) updateFields.membershipType = membershipType;
        if (role) updateFields.role = role;
        if (pledgeClass) updateFields.pledgeClass = pledgeClass;
        if (req.body.position) updateFields.position = req.body.position;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/users/transition
// @desc    Transfer an officer position to another user
// @access  Private (Officer/Admin only)
router.post('/transition', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { transitions } = req.body; // Expecting { transitions: [{ position, newUserId }, ...] }

        if (!transitions || !Array.isArray(transitions) || transitions.length === 0) {
            return res.status(400).json({ msg: 'Invalid or empty transitions data' });
        }

        const results = [];

        // Process each transition
        for (const { position, newUserId } of transitions) {
            if (!position || !newUserId) continue;

            // 1. Remove position from ALL users currently holding it (atomic cleanup)
            await User.updateMany(
                { position: position },
                { $unset: { position: "" } }
            );

            // 2. Assign position to new user and ensure they are an officer
            const updatedUser = await User.findByIdAndUpdate(
                newUserId,
                {
                    position: position,
                    role: 'officer' // Auto-promote to officer if not already
                },
                { new: true }
            ).select('-password');

            if (updatedUser) {
                results.push({ position, user: updatedUser.firstName + ' ' + updatedUser.lastName });
            }
        }

        res.json({ msg: `Successfully updated ${results.length} positions`, results });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/users/status-bulk
// @desc    Bulk update user status (e.g., Pledge -> Active)
// @access  Private (Officer/Admin only)
router.post('/status-bulk', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { userIds, membershipType, pledgeClass } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ msg: 'No users selected' });
        }

        if (!membershipType && !pledgeClass) {
            return res.status(400).json({ msg: 'No updates provided' });
        }

        const updateFields = {};
        if (membershipType) updateFields.membershipType = membershipType;
        if (pledgeClass) updateFields.pledgeClass = pledgeClass;

        // If promoting to active/associate, ensure role is at least 'member'
        if (['active', 'associate', 'alumni'].includes(membershipType)) {
            // We generally don't want to downgrade officers, so we might just leave role alone
            // unless we specifically want to reset it. For now, let's just update membershipType.
        }

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: updateFields }
        );

        res.json({ msg: `Updated ${result.modifiedCount} users`, result });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
