// to verify that threads are populated in database and cache properly

const Thread = require("../models/thread.js");

const redisClient = require("../../cache/redis.js");
const { getForumThreadKey } = require("../cache/threadCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");
const expectEqualLengthResults = require("../../utils/test/expectEqualLengthResults.js");

// check that all threads specified by threadIds exist in the database
function verifyDBPopulatedThreads(threadIds) {
  return {
    title: "should add threads to database",
    callback: async () =>
      expectEqualLengthResults(
        await Thread.find({ _id: { $in: threadIds } }, { _id: 1 }).lean(),
        threadIds,
      ),
    params: [threadIds],
  };
}

// check that all forums specified by forumIds have a corresponding thread entry in the cache
function verifyCachePopulatedThreads(forumIds) {
  return {
    title: "should populate threads in cache",
    callback: async () =>
      expectEmpty(
        await Promise.all(
          forumIds.map((forumId) =>
            redisClient.json.get(getForumThreadKey(forumId)),
          ),
        ),
        false,
      ),
    params: [forumIds],
  };
}

module.exports = {
  verifyDBPopulatedThreads,
  verifyCachePopulatedThreads,
};
