const User = require('../models/User');

// Positions with full executive access to family/clan management.
// The President can reach every exec tool, and the Pledge Educator owns families.
const EXEC_POSITIONS = ['Pledge Educator', 'President'];

// Gate for family/clan management. Must run AFTER the `auth` middleware.
module.exports = async function (req, res, next) {
    try {
        if (req.user.role === 'admin') return next();

        const me = await User.findById(req.user.userId).select('position role');
        if (me && (me.role === 'admin' || EXEC_POSITIONS.includes(me.position))) {
            return next();
        }
        return res.status(403).json({ msg: 'Only the Pledge Educator or President can manage families' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

module.exports.EXEC_POSITIONS = EXEC_POSITIONS;
