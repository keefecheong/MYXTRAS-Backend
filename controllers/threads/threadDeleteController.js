// controller functions to handle DELETE requests for threads

const Thread = require('../../models/thread.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const { getForumThreadKey } = require('../../cache/threads/threadCache.js');
const { deleteCachedThread } = require('../../cache/threads/threadDeleteCache.js');

// to delete a thread
async function deleteThread(req, res) {
    // check if requesting user is the creator of the thread
    // if the requesting user is not the creator then return 401 error
    if (!compareId(req.user._id, res.thread.creator_id._id)) {
        returnUnauthorizedReq(res);
    }

    try {
        // if post is in cache then update both cache and database immediately
        if (res.threadFromCache) {
            await deleteCachedThread(getForumThreadKey(req.params.forumID), res.threadIndex, req.params.threadID);
        }
        // otherwise delete thread from database immediately
        else {
            await Thread.findByIdAndDelete(req.params.threadID);
        }

        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteThread
}