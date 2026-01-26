require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedOfficer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apo-web');
        console.log('✅ Connected to MongoDB');

        const email = 'officer@example.com';
        const password = 'password123';

        // Check if exists
        const exists = await User.findOne({ email });
        if (exists) {
            console.log('⚠️ Test officer already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const officer = new User({
            firstName: 'Test',
            lastName: 'Officer',
            email,
            password: hashedPassword,
            role: 'officer',
            pledgeClass: 'Founder',
            gradYear: 2024
        });

        await officer.save();
        console.log('✅ Test Officer Created!');
        console.log('Email: officer@example.com');
        console.log('Password: password123');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedOfficer();
