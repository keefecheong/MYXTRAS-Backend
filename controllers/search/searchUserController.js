const { User } = require('../../models/user.js');

// get users with username/real names that contain the search term, where both users are not blocking each other
function searchUserPromise(regexTerm, userId, excludeUsers, limit) {
    return User
        .find({
            $and: [
                { _id: { $nin: excludeUsers } },
                { 'blocked_users.user_id': { $ne: userId } },
                {
                    $or: [
                        { username: { $regex: regexTerm } },
                        { real_name: { $regex: regexTerm } }
                    ]
                }
            ]
        })
        .limit(limit)
        .select('real_name username')
        .lean();
}

module.exports = {
    searchUserPromise
}