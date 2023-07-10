// middleware to get a thread

const Thread = require('../../models/thread.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getForumThreadKey, getThreadFromCache } = require('../../cache/threads/threadCache.js');

// find thread by id
async function getThread(req, res, next) {
    const forumId = req.params.forumID;
    const threadId = req.params.threadID;
    let target = null;
    
    try {
        // attempt to get thread from cache
        const result = await getThreadFromCache(getForumThreadKey(forumId), threadId);

        // if retrieval is successful then set target as retrieved thread
        if (result.success) {
            target = result.thread;

            // set threadFromCache to indicate the thread is retrieved from cache
            res.threadFromCache = true;
            res.threadIndex = result.threadIndex;
        }
        else {
            // if error is not produced because thread is not found in cache then return 500 error
            if (result.error != "ERR Path '$' does not exist") {
                return returnServerErrorReq(res);
            }

            // if thread is not found in cache then try to retrieve from database
            target = await Thread.findById(threadId).lean();

            // set threadFromCache to indicate the thread is not retrieved from cache
            res.threadFromCache = false;
        }
        
        // if target is still null means that the thread does not exist, return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.thread = target;
    next();
}

module.exports = {
    getThread
}