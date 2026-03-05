const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Todo', 'In Progress', 'Completed', 'Blocked'],
        default: 'Todo'
    },
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isArchived: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Task', TaskSchema);
