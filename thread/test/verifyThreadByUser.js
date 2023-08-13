// to check if there are threads created by a user

const Thread = require("../models/thread.js");

const redisClient = require("../../cache/redis.js");
const {
  THREAD_FORUM_KEY_BASE,
  getThreadByUserPath,
} = require("../cache/threadCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");

// check database records to determine if there are threads created by the user
async function verifyDBUserHasCreatedThreads(userId, terminated) {
  expectEmpty(await Thread.find({ creator_id: userId }).lean(), terminated);
}

// check cache entry to determine if there are threads created by the user
async function verifyCacheUserHasCreatedThreads(userId, terminated) {
  var createdThreads = [];

  for await (const key of redisClient.scanIterator({
    MATCH: `${THREAD_FORUM_KEY_BASE}:*`,
  })) {
    createdThreads.push(
      await redisClient.json.get(key, { path: getThreadByUserPath(userId) }),
    );
  }

  createdThreads = createdThreads.flat().filter((entry) => entry);

  expectEmpty(createdThreads, terminated);
}

module.exports = {
  verifyDBUserHasCreatedThreads,
  verifyCacheUserHasCreatedThreads,
};
