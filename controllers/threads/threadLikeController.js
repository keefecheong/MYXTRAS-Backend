// controller functions for adding/removing likes for threads

const Thread = require('../../models/thread.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const { cachedThreadAddLike, cachedThreadRemoveLike } = require('../../cache/threads/threadLikeCache.js');

// add like to thread
async function addLikeThread(req, res) {
    const userId = req.user._id;

    const likeExists = res.thread.likes.some(user_id => compareId(user_id, userId));

    // if the user has not liked the thread, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return returnBadReq(res, 'You have already liked this thread.');
    }

    // convert thread to mongoose document to perform operations
    const thread = new Thread(res.thread);
    thread.isNew = false;

    // update thread's likes list
    thread.likes.push(userId);

    try {
        // if thread is in cache then update cache
        const updateCacheResult = await cachedThreadAddLike(thread.parent_id._id, thread._id, userId, res.threadFromCache);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(thread, updateCacheResult);

        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// remove like from thread
async function removeLikeThread(req, res) {
    const userId = req.user._id;

    // check if the specified thread is liked by the user
    const likeIndex = res.thread.likes.findIndex(user_id => compareId(user_id, userId));

    // if the user has liked the thread, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return returnBadReq(res, 'You have not liked this thread.');
    }

    // convert thread to mongoose document to perform operations
    const thread = new Thread(res.thread);
    thread.isNew = false;

    // remove user id from thread's likes list
    thread.likes.splice(likeIndex, 1);

    try {
        // if thread is in cache then update cache
        const updateCacheResult = await cachedThreadRemoveLike(thread.parent_id._id, thread._id, likeIndex, res.threadFromCache);
        
        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(thread, updateCacheResult);
        
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    addLikeThread,
    removeLikeThread
}