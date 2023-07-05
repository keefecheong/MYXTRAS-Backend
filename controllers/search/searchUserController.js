const User = require('../../models/user.js');

function searchUserPromise(regexTerm, userId, limit) {
    return User
        .find({
            $and: [
                { _id: { $ne: userId } },
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