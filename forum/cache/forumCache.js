// to add forums to the cache from database

const redisClient = require("../../cache/redis.js");
const {
  storeDetailsSingle,
  retrieveDetailsSingle,
} = require("../../user/utils/userDetailsCacheUtil.js");

// cache key prefixes
// to cache individual forums
// format: 'forum:single:forumid'
const FORUM_SINGLE_KEY_BASE = "forum:single";

// to cache created forums by user
// format: 'forum:created:userid'
const FORUM_CREATED_KEY_BASE = "forum:created";

// to cache subscribed forums by user
// format: 'forum:subscribed:userid'
const FORUM_SUBSCRIBED_KEY_BASE = "forum:subscribed";

// to cache aggregated recommended forums
const FORUM_RECOMMENDED_KEY_BASE = "forum:recommended";

// to cache aggregated categorized forums
const FORUM_CATEGORIZED_KEY_BASE = "forum:categorized";

// expiration times for forum cache
// short expiry for potentially quickly changing data - (cache not updated)
const FORUM_SHORT_EXPIRATION_TIME = 60;

// long expiry for data updated in cache
const FORUM_LONG_EXPIRATION_TIME = 60 * 60;

// to add forums from database to cache
function cacheForums(forums, key) {
  // check if cache entry is for storing created/subscribed forums or for a single forum
  const forCreated = key.startsWith(FORUM_CREATED_KEY_BASE);
  const forSubscribed = key.startsWith(FORUM_SUBSCRIBED_KEY_BASE);
  const forSingle = key.startsWith(FORUM_SINGLE_KEY_BASE);

  // determine expiration time
  const expiry =
    forCreated || forSingle || forSubscribed
      ? FORUM_LONG_EXPIRATION_TIME
      : FORUM_SHORT_EXPIRATION_TIME;

  let workingData;
  let promises = [];

  // if for single forum separate creator details and store in another key
  if (forSingle) {
    const storeDetailsResult = storeDetailsSingle(forums);

    workingData = storeDetailsResult.workingData;
    promises = storeDetailsResult.creatorDetailsPromises;
  }

  promises = promises.concat([
    redisClient.json.set(key, "$", forSingle ? workingData : forums),
    redisClient.expire(key, expiry),
  ]);

  return Promise.all(promises);
}

// to get a forum from cache
async function getForumFromCache(key) {
  // return if not for querying single forum
  if (!redisClient.isReady || !key.startsWith(FORUM_SINGLE_KEY_BASE)) {
    return null;
  }

  const forum = await redisClient.json.get(key);

  return await retrieveDetailsSingle(forum);
}

// to get cache keys
function getCreatedForumKey(userId) {
  return `${FORUM_CREATED_KEY_BASE}:${userId}`;
}

function getSubscribedForumKey(userId) {
  return `${FORUM_SUBSCRIBED_KEY_BASE}:${userId}`;
}

function getForumKey(forumId) {
  return `${FORUM_SINGLE_KEY_BASE}:${forumId}`;
}

// to get path for a forum id in subscribers/created arrays
function getForumIdPath(forumId) {
  return `$[?(@._id=="${forumId}")]`;
}

// to get path for forums subscribed by a user
function getForumSubscriberPath(userId) {
  return `$.subscribers[?(@=="${userId}")]`;
}

module.exports = {
  FORUM_SINGLE_KEY_BASE,
  FORUM_RECOMMENDED_KEY_BASE,
  FORUM_CATEGORIZED_KEY_BASE,
  FORUM_LONG_EXPIRATION_TIME,
  cacheForums,
  getForumFromCache,
  getCreatedForumKey,
  getSubscribedForumKey,
  getForumKey,
  getForumIdPath,
  getForumSubscriberPath,
};
