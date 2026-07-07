// Shared credit computation used by MemberDashboard and ServiceLogs.
// Mirrors the backend completion logic: a per-attendee creditAmount override
// applies its difference to the FIRST category in the distribution.

export function computeEventStats(history, userId) {
    const acc = {
        serviceHours: 0,
        fellowshipHours: 0,
        leadershipHours: 0,
        committeeHours: 0
    };
    if (!Array.isArray(history) || !userId) return acc;

    const addCredit = (type, amount) => {
        if (type === 'service') acc.serviceHours += amount;
        if (type === 'fellowship') acc.fellowshipHours += amount;
        if (type === 'leadership') acc.leadershipHours += amount;
        if (type === 'committee') acc.committeeHours += amount;
    };

    history.forEach(evt => {
        const userAttendee = evt.attendees?.find(a => {
            const aId = a.user?._id || a.user;
            return aId && aId.toString() === userId.toString();
        });

        const override = userAttendee?.creditAmount;
        const hasDistribution = evt.creditDistribution && evt.creditDistribution.length > 0;

        if (override !== undefined && override !== null) {
            if (hasDistribution) {
                const totalDefault = evt.creditDistribution.reduce((sum, c) => sum + c.amount, 0);
                const diff = override - totalDefault;
                evt.creditDistribution.forEach((c, i) => {
                    addCredit(c.type, i === 0 ? c.amount + diff : c.amount);
                });
            } else if (evt.creditType && evt.creditType !== 'none') {
                addCredit(evt.creditType, override);
            }
        } else {
            if (hasDistribution) {
                evt.creditDistribution.forEach(c => addCredit(c.type, c.amount));
            } else if (evt.creditType && evt.creditType !== 'none') {
                addCredit(evt.creditType, evt.creditAmount || 0);
            }
        }
    });
    return acc;
}

// Adds approved self-reported logs on top of event stats.
export function addServiceLogStats(stats, logs) {
    const acc = { ...stats };
    (logs || []).forEach(log => {
        if (log.status !== 'approved') return;
        if (log.category === 'service') acc.serviceHours += log.hours;
        if (log.category === 'fellowship') acc.fellowshipHours += log.hours;
        if (log.category === 'leadership') acc.leadershipHours += log.hours;
        if (log.category === 'committee') acc.committeeHours += log.hours;
    });
    return acc;
}
