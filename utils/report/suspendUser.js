const { User, USER_STATUS_SUSPENDED, USER_STATUS_TERMINATED } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');
const returnPromiseResult = require('../general/returnPromiseResult.js');

// to suspend/remove suspend of a user and update cache and database
module.exports = async function suspendUser(toSuspend, user, endTime) {
    // do nothing if user is currently terminated
    if (user.status?.status == USER_STATUS_TERMINATED) {
        return false;
    }

    if (!toSuspend) {
        // if user is not suspended return false
        if (user.status?.status != USER_STATUS_SUSPENDED) {
            return false;
        }

        const currentEndTime = new Date(user.status.end_time).getTime();

        // if end_time is not reached then return false
        if (Date.now() - currentEndTime < 0) {
            return false;
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
    return await returnPromiseResult([
        updateCachedUser(updatedValues, targetUser._id),
        targetUser.save()
    ]);
}