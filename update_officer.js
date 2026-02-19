const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config({ path: './server/.env' }); // Adjust path if needed

const updateTestOfficer = async () => {
    try {
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
        // Ensure they have the officer role too, just in case
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
