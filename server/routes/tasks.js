const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Category = require('../models/Category');

// @route   GET /api/tasks
// @desc    Get all tasks (with optional filters)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('assignedTo', 'firstName lastName avatar role')
            .populate('category', 'name prefix')
            .populate('dependencies', 'taskId title status')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/tasks/my-tasks
// @desc    Get tasks assigned to current user
// @access  Private
router.get('/my-tasks', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.userId })
            .populate('assignedTo', 'firstName lastName avatar role')
            .populate('category', 'name prefix')
            .populate('dependencies', 'taskId title status')
            .sort({ dueDate: 1 });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (Officer/Admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only officers can create tasks' });
        }

        const { title, description, assignedTo, categoryId, priority, startDate, dueDate, dependencies } = req.body;

        // 1. Find Category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // 2. Generate Task ID
        const seq = category.nextSequence;
        const paddedSeq = String(seq).padStart(3, '0');
        const taskId = `${category.prefix}${paddedSeq}`;

        // 3. Create Task
        const newTask = new Task({
            taskId,
            title,
            description,
            assignedTo, // Array of User IDs
            category: categoryId,
            priority,
            startDate,
            dueDate,
            dependencies,
            createdBy: req.user.userId
        });

        await newTask.save();

        // 4. Increment Category Sequence
        category.nextSequence += 1;
        await category.save();

        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'firstName lastName avatar')
            .populate('category', 'name prefix')
            .populate('dependencies', 'taskId title status');

        res.json(populatedTask);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Allow update of fields
        const { title, description, assignedTo, priority, status, startDate, dueDate, dependencies } = req.body;

        if (title) task.title = title;
        if (description) task.description = description;
        if (assignedTo) task.assignedTo = assignedTo;
        if (priority) task.priority = priority;
        if (status) task.status = status;
        if (startDate) task.startDate = startDate;
        if (dueDate) task.dueDate = dueDate;
        if (dependencies) task.dependencies = dependencies;

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'firstName lastName avatar')
            .populate('category', 'name prefix')
            .populate('dependencies', 'taskId title status');

        res.json(updatedTask);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Officer/Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
