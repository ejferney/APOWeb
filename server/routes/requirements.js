const express = require('express');
const router = express.Router();
const Requirement = require('../models/Requirement');
const auth = require('../middleware/auth');

// @route   GET /api/requirements
// @desc    Get all requirements
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let requirements = await Requirement.find();

        // If no requirements exist yet, seed defaults
        if (requirements.length === 0) {
            // Seed defaults if none
            const defaults = [
                { type: 'active', serviceHours: 25, fellowshipHours: 15, leadershipHours: 5, committeeHours: 0 },
                { type: 'associate', serviceHours: 12.5, fellowshipHours: 7.5, leadershipHours: 2.5, committeeHours: 0 },
                { type: 'pledge', serviceHours: 10, fellowshipHours: 10, leadershipHours: 5, committeeHours: 0 },
                { type: 'prospect', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 },
                { type: 'inactive', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 },
                { type: 'alumni', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 }
            ];
            await Requirement.insertMany(defaults);
            requirements = await Requirement.find();
        } else if (requirements.length < 6) {
            // If partial requirements exist (e.g. from before upgrade), add missing ones
            const existingTypes = requirements.map(r => r.type);
            const defaults = [
                { type: 'active', serviceHours: 25, fellowshipHours: 15, leadershipHours: 5, committeeHours: 0 },
                { type: 'associate', serviceHours: 12.5, fellowshipHours: 7.5, leadershipHours: 2.5, committeeHours: 0 },
                { type: 'pledge', serviceHours: 10, fellowshipHours: 10, leadershipHours: 5, committeeHours: 0 },
                { type: 'prospect', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 },
                { type: 'inactive', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 },
                { type: 'alumni', serviceHours: 0, fellowshipHours: 0, leadershipHours: 0, committeeHours: 0 }
            ];
            const missing = defaults.filter(d => !existingTypes.includes(d.type));
            if (missing.length > 0) {
                await Requirement.insertMany(missing);
                requirements = await Requirement.find();
            }
        }

        res.json(requirements);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/requirements/:type
// @desc    Update requirements for a specific type
// @access  Private (Officer/Admin only)
router.put('/:type', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { serviceHours, fellowshipHours, leadershipHours, committeeHours } = req.body;
        const type = req.params.type;

        let requirement = await Requirement.findOne({ type });

        if (!requirement) {
            requirement = new Requirement({ type });
        }

        requirement.serviceHours = serviceHours !== undefined ? serviceHours : requirement.serviceHours;
        requirement.fellowshipHours = fellowshipHours !== undefined ? fellowshipHours : requirement.fellowshipHours;
        requirement.leadershipHours = leadershipHours !== undefined ? leadershipHours : requirement.leadershipHours;
        requirement.committeeHours = committeeHours !== undefined ? committeeHours : requirement.committeeHours;

        await requirement.save();
        res.json(requirement);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
