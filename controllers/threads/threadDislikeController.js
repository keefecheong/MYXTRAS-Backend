// controller functions for adding/removing dislike for threads

const Thread = require('../../models/thread.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const { getForumThreadKey } = require('../../cache/threads/threadCache.js');
const { cachedThreadAddDislike, cachedThreadRemoveDislike } = require('../../cache/threads/threadDislikeCache.js');

// add dislike to thread
async function addDislikeThread(req, res) {
    const userId = req.user._id;

    const dislikeExists = res.thread.dislikes.some(user_id => compareId(user_id, userId));

    // if the user has not liked the thread, continue to add the like
    // otherwise, return 400 error
    if (dislikeExists) {
        return returnBadReq(res, 'You have already disliked this thread.');
    }

    // convert thread to mongoose document to perform operations
    const thread = new Thread(res.thread);
    thread.isNew = false;

    // update thread's likes list
    thread.dislikes.push(userId);

    try {
        // if thread is in cache then update cache immediately and update database asynchronously
        if (res.threadFromCache) {
            await cachedThreadAddDislike(getForumThreadKey(res.thread.parent_id._id), res.threadIndex, userId, thread);
        }
        // otherwise update database immediately
        else {
            await res.thread.save();
        }
        
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// remove dislike from thread
async function removeDislikeThread(req, res) {
    const userId = req.user._id;

    // check if the specified thread is liked by the user
    const dislikeIndex = res.thread.dislikes.findIndex(user_id => compareId(user_id, userId));

    // if the user has liked the thread, continue to remove the like
    // otherwise, return 400 error
    if (dislikeIndex == -1) {
        return returnBadReq(res, 'You have not disliked this thread.');
    }

    // convert thread to mongoose document to perform operations
    const thread = new Thread(res.thread);
    thread.isNew = false;

    // remove user id from thread's dislikes list
    thread.dislikes.splice(dislikeIndex, 1);

    try {
        // if thread is in cache then update cache immediately and update database asynchronously
        if (res.threadFromCache) {
            await cachedThreadRemoveDislike(getForumThreadKey(res.thread.parent_id._id), res.threadIndex, dislikeIndex, thread);
        }
        // otherwise update database immediately
        else {
            await res.thread.save();
        }
        
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    addDislikeThread,
    removeDislikeThread
}