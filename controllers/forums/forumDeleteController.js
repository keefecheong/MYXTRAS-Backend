// controller functions to handle DELETE requests for forums

const Forum = require('../../models/forum.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');
const performAllSync = require('../../utils/cache/performAllSync.js');

const { deleteCachedForum } = require('../../cache/forums/forumDeleteCache.js');

// to delete a forum
async function deleteForum(req, res) {
    const userId = req.user._id;
    const forumId = req.params.forumID;

    if (!compareId(userId, res.forum.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // get promises to delete forum from cache
        const cachePromises = await deleteCachedForum(forumId, userId);

        // delete forum from cache and database synchronously
        await performAllSync(cachePromises, Forum.findByIdAndDelete(forumId));

        returnGoodReq(res, { message: 'Forum removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteForum
}