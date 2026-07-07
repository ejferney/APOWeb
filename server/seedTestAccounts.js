/**
 * Seeds a full cast of demo accounts + sample data so every role and feature
 * can be tried out. Idempotent: it wipes anything it previously created
 * (all @apo.test users and the demo clans/events/logs) and rebuilds a clean set.
 *
 * Run from the server folder:  node seedTestAccounts.js
 * Or:  npm run seed:test
 *
 * Every account uses the same password:  apo12345
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Clan = require('./models/Clan');
const Event = require('./models/Event');
const Announcement = require('./models/Announcement');
const ServiceLog = require('./models/ServiceLog');

const PASSWORD = 'apo12345';
const DOMAIN = '@apo.test';

// email key -> profile. hours chosen so the leaderboards have clear, distinct winners.
const PEOPLE = {
    president:  { firstName: 'Riley',   lastName: 'Reyes',  email: `president${DOMAIN}`,       role: 'officer', position: 'President',       membershipType: 'active',   serviceHours: 18, leadershipHours: 10 },
    vpcold:     { firstName: 'Cameron', lastName: 'Cole',   email: `vpcold${DOMAIN}`,          role: 'officer', position: 'VP CoLD',         membershipType: 'active',   serviceHours: 6,  leadershipHours: 20 },
    vpm:        { firstName: 'Morgan',  lastName: 'Mills',  email: `vpm${DOMAIN}`,             role: 'officer', position: 'VP Membership',   membershipType: 'active',   serviceHours: 14, leadershipHours: 12 },
    vpservice:  { firstName: 'Jamie',   lastName: 'Serna',  email: `vpservice${DOMAIN}`,       role: 'officer', position: 'VP Service',      membershipType: 'active',   serviceHours: 12, leadershipHours: 4 },
    pledgeEd:   { firstName: 'Pat',     lastName: 'Ellis',  email: `pledge-educator${DOMAIN}`, role: 'officer', position: 'Pledge Educator', membershipType: 'active',   serviceHours: 10, leadershipHours: 8 },
    treasurer:  { firstName: 'Taylor',  lastName: 'Tran',   email: `treasurer${DOMAIN}`,       role: 'officer', position: 'Treasurer',       membershipType: 'active',   serviceHours: 9,  leadershipHours: 6 },
    member:     { firstName: 'Alex',    lastName: 'Adams',  email: `member${DOMAIN}`,          role: 'member',  position: null,              membershipType: 'active',   serviceHours: 30, leadershipHours: 5 },
    pledge:     { firstName: 'Peyton',  lastName: 'Park',   email: `pledge${DOMAIN}`,          role: 'member',  position: null,              membershipType: 'pledge',   serviceHours: 8,  leadershipHours: 2 },
    alumni:     { firstName: 'Avery',   lastName: 'Allen',  email: `alumni${DOMAIN}`,          role: 'member',  position: null,              membershipType: 'alumni',   serviceHours: 5,  leadershipHours: 0 }
};

const CLANS = {
    ember: { name: 'Clan Ember', colorPrimary: '#f97316', colorSecondary: '#dc2626' },
    tide:  { name: 'Clan Tide',  colorPrimary: '#0ea5e9', colorSecondary: '#6366f1' }
};

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apo-web');
        console.log('Connected to MongoDB');

        // --- Clean slate for previously-seeded demo data ---
        const oldUsers = await User.find({ email: new RegExp(`${DOMAIN.replace('.', '\\.')}$`) });
        const oldIds = oldUsers.map(u => u._id);
        await ServiceLog.deleteMany({ user: { $in: oldIds } });
        await Announcement.deleteMany({ author: { $in: oldIds } });
        await Event.deleteMany({ createdBy: { $in: oldIds } });
        await User.deleteMany({ _id: { $in: oldIds } });
        await Clan.deleteMany({ name: { $in: Object.values(CLANS).map(c => c.name) } });

        // --- Users ---
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(PASSWORD, salt);
        const u = {};
        for (const [key, p] of Object.entries(PEOPLE)) {
            const doc = new User({ ...p, password: hashed, pledgeClass: 'Demo' });
            if (!p.position) doc.position = undefined;
            await doc.save();
            u[key] = doc;
        }

        // --- Clans ---
        const ember = await new Clan({ ...CLANS.ember, createdBy: u.pledgeEd._id }).save();
        const tide = await new Clan({ ...CLANS.tide, createdBy: u.pledgeEd._id }).save();

        // --- Families (big + clan). One big can have several littles. ---
        // Clan Ember: Riley (top) -> Alex, Jamie, Pat; Alex -> Peyton
        await assign(u.president, { clan: ember._id });
        await assign(u.member,    { clan: ember._id, big: u.president._id });
        await assign(u.vpservice, { clan: ember._id, big: u.president._id });
        await assign(u.pledgeEd,  { clan: ember._id, big: u.president._id });
        await assign(u.pledge,    { clan: ember._id, big: u.member._id });
        // Clan Tide: Cameron (top) -> Morgan, Taylor
        await assign(u.vpcold,    { clan: tide._id });
        await assign(u.vpm,       { clan: tide._id, big: u.vpcold._id });
        await assign(u.treasurer, { clan: tide._id, big: u.vpcold._id });
        // Avery (alumni) left unassigned to show the "Unassigned" group

        // --- A few pending credit requests so approvers have something to review ---
        await new ServiceLog({ user: u.member._id, category: 'leadership', hours: 4, date: new Date('2026-06-28'), description: 'Ran a new-member leadership workshop', contact: 'advisor@campus.edu' }).save();
        await new ServiceLog({ user: u.pledge._id, category: 'fellowship', hours: 2, date: new Date('2026-06-30'), description: 'Organized a pledge-class social', contact: '' }).save();
        await new ServiceLog({ user: u.pledge._id, category: 'service', hours: 3, date: new Date('2026-07-01'), description: 'Volunteered at the food bank', contact: 'foodbank@city.org' }).save();

        // --- An announcement + an upcoming event so dashboards look alive ---
        await new Announcement({ title: 'Welcome to the chapter portal', body: 'Log in, check your credits, RSVP to events, and find your family in the tree. Reach out to an exec with any questions!', author: u.president._id }).save();
        const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const soonEnd = new Date(soon.getTime() + 2 * 60 * 60 * 1000);
        await new Event({ title: 'Weekly Chapter Meeting', start: soon, end: soonEnd, location: 'Student Union, Room 302', type: 'meeting', description: 'Mandatory weekly meeting.', creditType: 'fellowship', creditAmount: 1, createdBy: u.president._id }).save();

        // --- Report ---
        console.log('\n===== Test accounts (password for all: ' + PASSWORD + ') =====');
        const rows = [
            ['President',       PEOPLE.president.email],
            ['VP CoLD',         PEOPLE.vpcold.email],
            ['VP Membership',   PEOPLE.vpm.email],
            ['VP Service',      PEOPLE.vpservice.email],
            ['Pledge Educator', PEOPLE.pledgeEd.email],
            ['Treasurer',       PEOPLE.treasurer.email],
            ['Active member',   PEOPLE.member.email],
            ['Pledge',          PEOPLE.pledge.email],
            ['Alumni',          PEOPLE.alumni.email]
        ];
        rows.forEach(([role, email]) => console.log(`  ${role.padEnd(16)} ${email}`));
        console.log('\nSeed complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

async function assign(userDoc, { clan, big }) {
    if (clan) userDoc.clan = clan;
    if (big) userDoc.big = big;
    await userDoc.save();
}
