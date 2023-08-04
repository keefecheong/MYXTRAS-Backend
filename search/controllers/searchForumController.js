
const Forum = require('../../forum/models/forum.js');

function searchForumPromise(regexTerm, limit) {
    return Forum
        .find({
            $or: [
                { forum_id: { $regex: regexTerm } },
                { forum_name: { $regex: regexTerm } },
                { forum_desc: { $regex: regexTerm } }
            ]
        })
        .select('forum_id forum_name')
        .limit(limit)
        .lean();
}

module.exports = {
    searchForumPromise
}