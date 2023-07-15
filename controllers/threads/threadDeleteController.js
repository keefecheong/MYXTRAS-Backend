// controller functions to handle DELETE requests for threads

const Thread = require('../../models/thread.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');
const performAllSync = require('../../utils/cache/performAllSync.js');

const { deleteCachedThread } = require('../../cache/threads/threadDeleteCache.js');

// to delete a thread
async function deleteThread(req, res) {
    // check if requesting user is the creator of the thread
    // if the requesting user is not the creator then return 401 error
    if (!compareId(req.user._id, res.thread.creator_id._id)) {
        returnUnauthorizedReq(res);
    }

    try {
        const threadId = req.params.threadID;
        let promises = [];

        // if post is in cache then get promises to update cache
        if (res.threadFromCache) {
            promises = deleteCachedThread(req.params.forumID, threadId);
        }
        
        await performAllSync(promises, Thread.findByIdAndDelete(threadId));

        returnGoodReq(res, { message: 'Thread removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteThread
}