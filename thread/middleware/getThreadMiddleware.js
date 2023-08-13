// middleware to get a thread

const Thread = require("../models/thread.js");

const returnNotFoundReq = require("../../utils/returnReq/returnNotFoundReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const { getOneThreadFromCache } = require("../cache/threadCache.js");

// find thread by id
async function getThread(req, res, next) {
  const forumId = req.params.forumId;
  const threadId = req.params.threadId;

  let target = null;

  try {
    // attempt to get thread from cache
    const result = await getOneThreadFromCache(forumId, threadId);

    const threadRetrieved = result != null;

    res.threadFromCache = threadRetrieved;

    // if retrieval is successful then set target as retrieved thread
    if (threadRetrieved) {
      target = result[0];
    } else {
      // if thread is not found in cache then try to retrieve from database
      target = await Thread.findOne({
        _id: threadId,
        parent_id: forumId,
      }).lean();
    }

    // if target is still null means that the thread does not exist, return 404 error
    if (!target) {
      return returnNotFoundReq(res);
    }
  } catch (error) {
    return returnServerErrorReq(res);
  }

  res.thread = target;
  next();
}

module.exports = {
  getThread,
};
