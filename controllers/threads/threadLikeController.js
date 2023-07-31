// controller functions for adding/removing likes for threads

const Thread = require('../../models/thread.js');
const { User } = require('../../models/user.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const { cachedThreadAddLike, cachedThreadRemoveLike } = require('../../cache/threads/threadLikeCache.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

// add like to thread
async function addLikeThread(req, res) {
    const userId = req.user._id;

    const likeExists = res.thread.likes.some(user_id => compareId(user_id, userId));

    const self = new User(req.user)
    self.isNew = false;
    const tasks = self.daily_missions;

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

    const updatedValues = {};
    const targetTaskTitle = 'Like 5 threads';
    const targetTaskIndex = tasks.findIndex(task => task.title.substring(0, task.title.startsWith(targetTaskTitle)));

    if (targetTaskIndex !== -1){
        var actualTaskTitle = tasks[targetTaskIndex].title;
        const openParenthesisIndex = actualTaskTitle.indexOf('(');
        const closeParenthesisIndex = actualTaskTitle.indexOf(')');

        if (openParenthesisIndex !== -1 && closeParenthesisIndex !== -1) {
            const numberInParenthesis = actualTaskTitle.substring(openParenthesisIndex + 1, closeParenthesisIndex);
            const parsedNumber = parseInt(numberInParenthesis, 10);
            if (parsedNumber <= 5 && parsedNumber > 0){
                // Decrement the parsed number by 1
                const decrementedNumber = parsedNumber - 1;

                // Update the actual task title with the decremented number
                const updatedTaskTitle = actualTaskTitle.replace(`(${parsedNumber})`, `(${decrementedNumber})`);
                tasks[targetTaskIndex].title = updatedTaskTitle;

                if (decrementedNumber == 0){
                    tasks[targetTaskIndex].locked = false;
                }

                updatedValues.daily_missions = tasks;
            }
        }
    }

    try {
        // if thread is in cache then update cache
        const updateCacheResult = await cachedThreadAddLike(thread.parent_id._id, thread._id, userId, res.threadFromCache);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(thread, updateCacheResult);

        const updateCacheResult2 = await updateCachedUser(updatedValues, self._id, true);
        await saveDocAsync(self, updateCacheResult2);

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