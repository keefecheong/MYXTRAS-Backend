// controller functions for adding/removing dislike for threads

const Thread = require("../models/thread.js");

const returnCreatedReq = require("../../utils/returnReq/returnCreatedReq.js");
const returnNoContentReq = require("../../utils/returnReq/returnNoContentReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const compareId = require("../../utils/general/compareId.js");
const saveDocAsync = require("../../utils/general/saveDocAsync.js");

const {
  cachedThreadAddDislike,
  cachedThreadRemoveDislike,
} = require("../cache/threadDislikeCache.js");

// add dislike to thread
async function addDislikeThread(req, res) {
  const userId = req.user._id;

  const dislikeExists = res.thread.dislikes.some((user_id) =>
    compareId(user_id, userId),
  );

  // if the user has not liked the thread, continue to add the like
  // otherwise, return 400 error
  if (dislikeExists) {
    return returnBadReq(res, "You have already disliked this thread.");
  }

  const likeExists = res.thread.likes.some((user_id) =>
    compareId(user_id, userId)
  );

  // if the user has liked the thread return 400 error
  if (likeExists) {
    return returnBadReq(res, "You cannot like and dislike the thread at the same time.");
  }

  // convert thread to mongoose document to perform operations
  const thread = new Thread(res.thread);
  thread.isNew = false;

  // update thread's likes list
  thread.dislikes.push(userId);

  try {
    // update cache if thread is in cache
    const updateCacheResult = await cachedThreadAddDislike(
      thread.parent_id._id,
      thread._id,
      userId,
      res.threadFromCache,
    );

    // update database asynchronously if cache is updated successfully and synchronously otherwise
    await saveDocAsync(thread, updateCacheResult);

    returnCreatedReq(res);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// remove dislike from thread
async function removeDislikeThread(req, res) {
  const userId = req.user._id;

  // check if the specified thread is liked by the user
  const dislikeIndex = res.thread.dislikes.findIndex((user_id) =>
    compareId(user_id, userId),
  );

  // if the user has liked the thread, continue to remove the like
  // otherwise, return 400 error
  if (dislikeIndex == -1) {
    return returnBadReq(res, "You have not disliked this thread.");
  }

  // convert thread to mongoose document to perform operations
  const thread = new Thread(res.thread);
  thread.isNew = false;

  // remove user id from thread's dislikes list
  thread.dislikes.splice(dislikeIndex, 1);

  try {
    // update cache if thread is in cache
    const updateCacheResult = await cachedThreadRemoveDislike(
      thread.parent_id._id,
      thread._id,
      dislikeIndex,
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
  addDislikeThread,
  removeDislikeThread,
};
