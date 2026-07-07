const express = require('express');
const router = express.Router();
const ServiceLog = require('../models/ServiceLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

const CATEGORY_FIELD = {
    service: 'serviceHours',
    fellowship: 'fellowshipHours',
    leadership: 'leadershipHours',
    committee: 'committeeHours'
};

// Which officer position owns approvals for a given credit category.
// Categories not listed here (service, committee) can be approved by any officer.
const CATEGORY_APPROVER = {
    leadership: 'VP CoLD',
    fellowship: 'VP Membership'
};

const isOfficer = (req) => req.user.role === 'officer' || req.user.role === 'admin';

// Can this user (with role + position) approve a credit of the given category?
// Admins and the President can approve anything; category-specific credits are
// restricted to the responsible VP; the rest fall to any officer.
const canApprove = (me, category) => {
    if (!me) return false;
    if (me.role === 'admin' || me.position === 'President') return true;
    const owner = CATEGORY_APPROVER[category];
    if (owner) return me.position === owner;
    return me.role === 'officer';
};

// @route   POST /api/service-logs
// @desc    Submit self-reported hours (goes to pending queue)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { category, hours, date, description, contact } = req.body;

        const parsedHours = parseFloat(hours);
        if (!CATEGORY_FIELD[category]) {
            return res.status(400).json({ msg: 'Invalid category' });
        }
        if (isNaN(parsedHours) || parsedHours <= 0) {
            return res.status(400).json({ msg: 'Hours must be a positive number' });
        }
        if (!date || !description) {
            return res.status(400).json({ msg: 'Date and description are required' });
        }

        const log = new ServiceLog({
            user: req.user.userId,
            category,
            hours: parsedHours,
            date,
            description,
            contact: contact || ''
        });
        await log.save();
        res.status(201).json(log);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/service-logs/mine
// @desc    Get own submissions
// @access  Private
router.get('/mine', auth, async (req, res) => {
    try {
        const logs = await ServiceLog.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('reviewedBy', 'firstName lastName');
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/service-logs
// @desc    Get all submissions, optionally filtered by status
// @access  Private (Officer/Admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (!isOfficer(req)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const query = {};
        if (req.query.status) query.status = req.query.status;

        const logs = await ServiceLog.find(query)
            .sort({ createdAt: -1 })
            .populate('user', 'firstName lastName email membershipType')
            .populate('reviewedBy', 'firstName lastName');
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/service-logs/:id/review
// @desc    Approve or deny a pending submission. Approval credits the user's hours.
// @access  Private (approver depends on the credit category)
router.put('/:id/review', auth, async (req, res) => {
    try {
        const { action, note } = req.body;
        if (!['approve', 'deny'].includes(action)) {
            return res.status(400).json({ msg: 'Action must be approve or deny' });
        }

        const log = await ServiceLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ msg: 'Submission not found' });
        }
        if (log.status !== 'pending') {
            return res.status(400).json({ msg: 'Submission was already reviewed' });
        }

        const me = await User.findById(req.user.userId).select('role position');
        if (!canApprove(me, log.category)) {
            const owner = CATEGORY_APPROVER[log.category];
            return res.status(403).json({
                msg: owner ? `Only the ${owner} can review ${log.category} credits` : 'Access denied'
            });
        }

        log.status = action === 'approve' ? 'approved' : 'denied';
        log.reviewedBy = req.user.userId;
        log.reviewNote = note || '';
        await log.save();

        // Credit the hours to the member's running totals on approval
        if (log.status === 'approved') {
            const field = CATEGORY_FIELD[log.category];
            await User.findByIdAndUpdate(log.user, { $inc: { [field]: log.hours } });
        }

        const populated = await ServiceLog.findById(log._id)
            .populate('user', 'firstName lastName email membershipType')
            .populate('reviewedBy', 'firstName lastName');
        res.json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/service-logs/:id
// @desc    Withdraw own pending submission
// @access  Private (owner only, while pending)
router.delete('/:id', auth, async (req, res) => {
    try {
        const log = await ServiceLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ msg: 'Submission not found' });
        }
        if (log.user.toString() !== req.user.userId) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        if (log.status !== 'pending') {
            return res.status(400).json({ msg: 'Only pending submissions can be withdrawn' });
        }

        await log.deleteOne();
        res.json({ msg: 'Submission withdrawn' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
