const { User, USER_STATUS_SUSPENDED, USER_STATUS_TERMINATED } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');
const returnPromiseResult = require('../general/returnPromiseResult.js');

// to suspend/remove suspend of a user and update cache and database
module.exports = async function suspendUser(toSuspend, user, endTime) {
    // do nothing if user is currently terminated
    if (user.status?.status == USER_STATUS_TERMINATED) {
        return { accessGranted: false, terminated: true };
    }

    // checks before removing user's suspended status
    if (!toSuspend) {
        // if user is not suspended return access granted
        if (user.status?.status != USER_STATUS_SUSPENDED) {
            return { accessGranted: true };
        }

        const currentEndTime = new Date(user.status.end_time).getTime();

        // if end_time is not reached then return false
        if (Date.now() - currentEndTime < 0) {
            return { accessGranted: false, suspended: true };
        }
    }

    const targetUser = new User(user);
    targetUser.isNew = false;

    // set suspended status or remove suspended status
    const newStatus = toSuspend ? {
        status: USER_STATUS_SUSPENDED,
        end_time: new Date(endTime)
    } : {};

    targetUser.status = newStatus;

    const updatedValues = {
        status: newStatus
    }

    // update cache and database
    const updated = await returnPromiseResult([
        updateCachedUser(updatedValues, targetUser._id, true),
        targetUser.save()
    ]);

    return { accessGranted: !toSuspend, updated };
}