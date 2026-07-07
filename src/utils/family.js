// Helpers for clans and big-little family trees.

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #64748b, #94a3b8)';

// A clan may arrive populated (an object) or as null/undefined.
export function clanGradient(clan) {
    if (clan && clan.colorPrimary && clan.colorSecondary) {
        return `linear-gradient(135deg, ${clan.colorPrimary}, ${clan.colorSecondary})`;
    }
    return DEFAULT_GRADIENT;
}

export function initials(user) {
    if (!user) return '?';
    return `${(user.firstName || '?')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase();
}

const bigIdOf = (u) => {
    if (!u.big) return null;
    return (u.big._id || u.big).toString();
};

export const clanIdOf = (u) => {
    if (!u.clan) return null;
    return (u.clan._id || u.clan).toString();
};

// Build a big→little forest from a flat user list.
// Returns { roots, nodeById } where each node is { user, children: [] }.
// A member is a root if they have no big, or their big is not in this list.
export function buildForest(users) {
    const nodeById = new Map();
    users.forEach(u => nodeById.set(u._id.toString(), { user: u, children: [] }));

    const roots = [];
    users.forEach(u => {
        const bId = bigIdOf(u);
        if (bId && nodeById.has(bId)) {
            nodeById.get(bId).children.push(nodeById.get(u._id.toString()));
        } else {
            roots.push(nodeById.get(u._id.toString()));
        }
    });

    const byName = (a, b) =>
        `${a.user.lastName} ${a.user.firstName}`.localeCompare(`${b.user.lastName} ${b.user.firstName}`);
    const sortRec = (node) => {
        node.children.sort(byName);
        node.children.forEach(sortRec);
    };
    roots.sort(byName);
    roots.forEach(sortRec);

    return { roots, nodeById };
}

// Group users by clan id. Returns [{ clan, users }] plus a trailing group with
// clan === null for unassigned members. Only clans that have members appear,
// plus every clan passed in `allClans` (so empty clans still show in manager).
export function groupByClan(users, allClans = []) {
    const groups = new Map();
    allClans.forEach(c => groups.set(c._id.toString(), { clan: c, users: [] }));

    const unassigned = [];
    users.forEach(u => {
        const cId = clanIdOf(u);
        if (cId && groups.has(cId)) {
            groups.get(cId).users.push(u);
        } else if (cId && u.clan && u.clan.name) {
            // Clan populated but not in allClans (fallback)
            groups.set(cId, { clan: u.clan, users: [u] });
        } else {
            unassigned.push(u);
        }
    });

    const result = [...groups.values()].sort((a, b) => a.clan.name.localeCompare(b.clan.name));
    if (unassigned.length) result.push({ clan: null, users: unassigned });
    return result;
}
