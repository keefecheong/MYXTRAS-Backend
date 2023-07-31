// to change acknowledge all warnings for a user

const { User } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

module.exports = function acknowledgeWarning(user) {
    // do nothing if user does not have any warnings pending acknowledge
    if (!user.warnings?.some(warning => !warning.acknowledged)) {
        return;
    }

    const targetUser = new User(user);
    targetUser.isNew = false;
    
    targetUser.warnings.forEach(warning => {
        warning.acknowledged = true;
    });

    Promise.all([
        updateCachedUser({ warnings: targetUser.warnings }, targetUser._id, true),
        targetUser.save()
    ]).catch(error => console.log(error));
}