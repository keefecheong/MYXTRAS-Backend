// to add new forum/update existing forum in cache

const redisClient = require("../../cache/redis.js");
const {
  FORUM_LONG_EXPIRATION_TIME,
  getForumIdPath,
  getForumKey,
  getCreatedForumKey,
} = require("./forumCache.js");
const returnPromiseResult = require("../../utils/general/returnPromiseResult.js");

// to add new forum to cache and update forum:created entry if exists
async function cacheNewForum(forum, userDetails) {
  if (!redisClient.isReady) {
    return false;
  }

  const forumKey = getForumKey(forum._id);
  const createdKey = getCreatedForumKey(forum.creator_id);

  const jsonForum = forum.toObject();

  jsonForum.creator_id = userDetails;

  const promises = [
    redisClient.json.set(forumKey, "$", jsonForum),
    redisClient.expire(forumKey, FORUM_LONG_EXPIRATION_TIME),
  ];

  // check if created key exists
  const createdKeyExists = await redisClient.exists(createdKey);

  // if key exists then update the key with the new forum's required details
  if (createdKeyExists) {
    const createdForum = {
      _id: forum._id,
      forum_name: forum.forum_name,
      forum_id: forum.forum_id,
      forum_pic_link: forum.forum_pic_link,
    };

    promises.push(redisClient.json.arrAppend(createdKey, "$", createdForum));
  }

  return await returnPromiseResult(promises);
}

// to update forum data in cache
async function updateCachedForum(updatedValues, forumId, creatorId) {
  if (!redisClient.isReady) {
    return false;
  }

  const forumKey = getForumKey(forumId);
  const createdKey = getCreatedForumKey(creatorId);

  // increase version key
  const promises = [redisClient.json.numIncrBy(forumKey, "$.__v", 1)];

  // add promise for each updated key/value
  for (const updatedKey in updatedValues) {
    if (updatedValues.hasOwnProperty(updatedKey)) {
      const updatedValue = updatedValues[updatedKey];

      promises.push(
        redisClient.json.set(forumKey, `$.${updatedKey}`, updatedValue),
      );

      // if forum:created entry exists, update forum:created entry's key/value pairs
      promises.push(
        redisClient.json.set(
          createdKey,
          `${getForumIdPath(forumId)}.${updatedKey}`,
          updatedValue,
          { XX: true },
        ),
      );
    }
  }

  return await returnPromiseResult(promises);
}

module.exports = {
  cacheNewForum,
  updateCachedForum,
};
