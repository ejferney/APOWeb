const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const pledgeEducator = require('../middleware/pledgeEducator');

// @route   GET /api/users
// @desc    Get all users (directory)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // Select specific fields to return, excluding password
        const users = await User.find()
            .select('-password')
            .sort({ lastName: 1 })
            .populate('big', 'firstName lastName')
            .populate('clan');
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

// @route   PUT /api/users/me
// @desc    Update own profile (limited fields)
// @access  Private
router.put('/me', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, pledgeClass, gradYear } = req.body;

        const updateFields = {};
        if (firstName !== undefined && firstName.trim()) updateFields.firstName = firstName.trim();
        if (lastName !== undefined && lastName.trim()) updateFields.lastName = lastName.trim();
        if (phone !== undefined) updateFields.phone = phone;
        if (pledgeClass !== undefined) updateFields.pledgeClass = pledgeClass;
        if (gradYear !== undefined) updateFields.gradYear = gradYear ? parseInt(gradYear, 10) : null;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/me/password
// @desc    Change own password
// @access  Private
router.put('/me/password', auth, async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Both current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/:id/family
// @desc    Assign a member's big and/or clan. Setting a big makes them the
//          little of that member; the little inherits the big's clan unless a
//          clan is explicitly provided.
// @access  Private (Pledge Educator/Admin)
router.put('/:id/family', auth, pledgeEducator, async (req, res) => {
    try {
        const targetId = req.params.id;
        const { big, clan } = req.body;

        const target = await User.findById(targetId);
        if (!target) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const setFields = {};
        const unsetFields = {};

        // --- Big handling ---
        if (big) {
            if (big === targetId) {
                return res.status(400).json({ msg: 'A member cannot be their own big' });
            }
            const bigUser = await User.findById(big).select('big clan');
            if (!bigUser) {
                return res.status(400).json({ msg: 'Selected big does not exist' });
            }

            // Cycle check: walk up the proposed big's chain; if we reach the
            // target, assigning this big would create a loop.
            const all = await User.find().select('big');
            const bigOf = {};
            all.forEach(u => { bigOf[u._id.toString()] = u.big ? u.big.toString() : null; });

            let cursor = big;
            const seen = new Set([targetId]);
            while (cursor) {
                if (seen.has(cursor)) {
                    return res.status(400).json({ msg: 'That assignment would create a circular big-little loop' });
                }
                seen.add(cursor);
                cursor = bigOf[cursor];
            }

            setFields.big = big;
            // Inherit the big's clan unless the caller set one explicitly
            if (clan === undefined && bigUser.clan) {
                setFields.clan = bigUser.clan;
            }
        } else if (big === null || big === '') {
            unsetFields.big = '';
        }

        // --- Clan handling (explicit) ---
        if (clan) {
            setFields.clan = clan;
        } else if (clan === null || clan === '') {
            unsetFields.clan = '';
        }

        const ops = {};
        if (Object.keys(setFields).length) ops.$set = setFields;
        if (Object.keys(unsetFields).length) ops.$unset = unsetFields;

        const updated = await User.findByIdAndUpdate(targetId, ops, { new: true })
            .select('-password')
            .populate('big', 'firstName lastName')
            .populate('clan');

        res.json(updated);
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
