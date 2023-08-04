const { User } = require('../../user/models/user.js');
const { cachedUserAddWarning } = require('../../user/cache/userWarningCache.js');

// to warn user and update cache and database
module.exports = async function warnUser(userId, warning) {
    // update cache and database synchronously
    await Promise.all([
        cachedUserAddWarning(userId, warning),
        User.findByIdAndUpdate(userId, { $push: { warnings: warning } })
    ]);
}