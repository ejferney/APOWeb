const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');

const updateTestOfficer = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env');
            // Try default local if env missing
            process.env.MONGODB_URI = 'mongodb://localhost:27017/apo-web';
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find user with email containing 'officer' or name 'Test Officer'
        const user = await User.findOne({
            $or: [
                { email: { $regex: 'officer', $options: 'i' } },
                { firstName: 'Test', lastName: 'Officer' }
            ]
        });

        if (!user) {
            console.log('❌ Test Officer user not found');
            process.exit(1);
        }

        user.position = 'President';
        user.role = 'officer';
        await user.save();

        console.log(`✅ Updated user ${user.firstName} ${user.lastName} (${user.email}) to position: President`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateTestOfficer();
