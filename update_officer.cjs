const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server/.env') });

// Since the project is type: module, but server files are CJS (determined by checking server.js),
// we are running this as a .cjs file to force CommonJS mode.

// We need to require the model. If the model file is .js and the project is type: module, 
// strictly speaking it should be ESM. 
// However, checking server/models/User.js (Step 438), it uses `module.exports`.
// So it is CJS.
// If we run this script as .cjs, `require` will work for other CJS files.

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['member', 'officer', 'admin'], default: 'member' },
    membershipType: { type: String, enum: ['active', 'associate', 'pledge', 'prospect', 'inactive', 'alumni'], default: 'pledge' },
    pledgeClass: { type: String },
    gradYear: { type: Number },
    phone: { type: String },
    avatar: { type: String },
    position: { type: String },
    serviceHours: { type: Number, default: 0 },
    fellowshipHours: { type: Number, default: 0 },
    leadershipHours: { type: Number, default: 0 },
    committeeHours: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const updateTestOfficer = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env');
            process.exit(1);
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
