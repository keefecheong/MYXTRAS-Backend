// middleware to get a forum

const Forum = require('../../models/forum.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getForumKey } = require('../../cache/forums/forumCache.js');

// find post by _id
async function getForum(req, res, next) {
    const forumId = req.params.forumID;
    let target;

    try {
        target = await Forum
            .findById(forumId)
            .getCreator()
            .lean()
            .cache({
                key: getForumKey(forumId)
            });
        
        // if target not found then return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.forum = target;
    next();
}

module.exports = {
    getForum
}