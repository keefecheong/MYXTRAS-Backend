// to delete a thread

const Thread = require("../models/thread.js");
const performAllSync = require("../../utils/general/performAllSync.js");
const { deleteCachedThread } = require("../cache/threadDeleteCache.js");

module.exports = function deleteThreadUtil(forumId, threadId, threadInCache) {
  let promises = [];

  // if thread is in cache then get promises to update cache
  if (threadInCache) {
    promises = deleteCachedThread(forumId, threadId);
  }

  // delete thread from cache and database
  return performAllSync(promises, Thread.findByIdAndDelete(threadId));
};
