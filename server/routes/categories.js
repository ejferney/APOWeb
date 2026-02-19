const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Officer/Admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { name, prefix } = req.body;

        let category = await Category.findOne({ $or: [{ name }, { prefix }] });
        if (category) {
            return res.status(400).json({ message: 'Category name or prefix already exists' });
        }

        category = new Category({
            name,
            prefix: prefix.toUpperCase()
        });

        await category.save();
        res.json(category);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Seed default categories
const seedCategories = async () => {
    try {
        const count = await Category.countDocuments();
        if (count === 0) {
            const categories = [
                { name: 'Finance', prefix: 'F' },
                { name: 'Housekeeping', prefix: 'H' },
                { name: 'Rush', prefix: 'R' },
                { name: 'Marketing', prefix: 'M' },
                { name: 'Leadership', prefix: 'L' },
                { name: 'Policy', prefix: 'P' },
                { name: 'Pledge Educator', prefix: 'PE' },
                { name: 'Admin', prefix: 'A' }
            ];
            await Category.insertMany(categories);
            console.log('✅ Default Kanban Categories Seeded');
        }
    } catch (err) {
        console.error("❌ Category Seeding Error:", err);
    }
};

// Run seed on load (Note: requires DB connection established in server.js)
// We set a small timeout or just rely on Mongoose buffering
setTimeout(seedCategories, 2000);

module.exports = router;
