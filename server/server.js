require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apo-web')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('APO Web API Running');
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const availabilityRoutes = require('./routes/availability');
const eventRoutes = require('./routes/events');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/requirements', require('./routes/requirements'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/categories', require('./routes/categories'));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
