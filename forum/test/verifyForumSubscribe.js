// to check if a user is subscribed to a forum

const Forum = require("../models/forum.js");

const redisClient = require("../../cache/redis.js");
const { FORUM_SINGLE_KEY_BASE } = require("../cache/forumCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");
const compareId = require("../../utils/general/compareId.js");

// check database to determine if a user is subscribed to any forums created by other users
async function verifyDBUserSubscribedToOtherForums(userId, terminated) {
  expectEmpty(
    await Forum.find({
      creator_id: { $ne: userId },
      subscribers: { $in: [userId] },
    }).lean(),
    terminated,
  );
}

// check cache to determine if a user is subscribed to any forums created by other users
async function verifyCacheUserSubscribedToOtherForums(userId, terminated) {
  const subscribedForums = [];

  for await (const key of redisClient.scanIterator({
    MATCH: `${FORUM_SINGLE_KEY_BASE}:*`,
  })) {
    const forum = await redisClient.json.get(key);

    if (
      !compareId(forum.creator_id, userId) &&
      forum.subscribers.some((subscriberId) => compareId(subscriberId, userId))
    ) {
      subscribedForums.push(key);
    }
  }

  expectEmpty(subscribedForums, terminated);
}

module.exports = {
  verifyDBUserSubscribedToOtherForums,
  verifyCacheUserSubscribedToOtherForums,
};
