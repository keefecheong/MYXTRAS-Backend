// controller functions for adding/removing likes for threads

const Thread = require("../models/thread.js");

const returnCreatedReq = require("../../utils/returnReq/returnCreatedReq.js");
const returnNoContentReq = require("../../utils/returnReq/returnNoContentReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const compareId = require("../../utils/general/compareId.js");
const saveDocAsync = require("../../utils/general/saveDocAsync.js");

const {
  cachedThreadAddLike,
  cachedThreadRemoveLike,
} = require("../cache/threadLikeCache.js");
const updateUserTasks = require("../../gamification/utils/updateUserTasks.js");

// add like to thread
async function addLikeThread(req, res) {
  const userId = req.user._id;

  const likeExists = res.thread.likes.some((user_id) =>
    compareId(user_id, userId),
  );

  // if the user has not liked the thread, continue to add the like
  // otherwise, return 400 error
  if (likeExists) {
    return returnBadReq(res, "You have already liked this thread.");
  }
  
  const dislikeExists = res.thread.dislikes.some((user_id) =>
    compareId(user_id, userId)
  );

  // if the user has disliked the thread, return 400 error
  if (dislikeExists) {
    return returnBadReq(res, "You cannot like and dislike the thread at the same time.");
  }

  // convert thread to mongoose document to perform operations
  const thread = new Thread(res.thread);
  thread.isNew = false;

  // update thread's likes list
  thread.likes.push(userId);

  try {
    // if thread is in cache then update cache
    const updateCacheResult = await cachedThreadAddLike(
      thread.parent_id._id,
      thread._id,
      userId,
      res.threadFromCache,
    );

    // update database asynchronously if cache is updated successfully and synchronously otherwise
    await saveDocAsync(thread, updateCacheResult);

    // update user tasks
    await updateUserTasks(req.user, "Like 5 threads");

    returnCreatedReq(res);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// remove like from thread
async function removeLikeThread(req, res) {
  const userId = req.user._id;

  // check if the specified thread is liked by the user
  const likeIndex = res.thread.likes.findIndex((user_id) =>
    compareId(user_id, userId),
  );

  // if the user has liked the thread, continue to remove the like
  // otherwise, return 400 error
  if (likeIndex == -1) {
    return returnBadReq(res, "You have not liked this thread.");
  }

  // convert thread to mongoose document to perform operations
  const thread = new Thread(res.thread);
  thread.isNew = false;

  // remove user id from thread's likes list
  thread.likes.splice(likeIndex, 1);

  try {
    // if thread is in cache then update cache
    const updateCacheResult = await cachedThreadRemoveLike(
      thread.parent_id._id,
      thread._id,
      likeIndex,
      res.threadFromCache,
    );

    // update database asynchronously if cache is updated successfully and synchronously otherwise
    await saveDocAsync(thread, updateCacheResult);

    returnNoContentReq(res);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  addLikeThread,
  removeLikeThread,
};
