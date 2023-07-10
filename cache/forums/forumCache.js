// to add forums to the cache from database

const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');
const redisClient = require('../redis.js');

// cache key prefixes
// to cache individual forums
// format: 'forum:single:forumid'
const FORUM_SINGLE_KEY_BASE = 'forum:single';

// to cache created forums by user
// format: 'forum:created:userid'
const FORUM_CREATED_KEY_BASE = 'forum:created';

// to cache subscribed forums by usr
// format: 'forum:subscribed:userid'
const FORUM_SUBSCRIBED_KEY_BASE = 'forum:subscribed';

// to cache aggregated recommended forums
const FORUM_RECOMMENDED_KEY_BASE = 'forum:recommended';

// to cache aggregated categorized forums
const FORUM_CATEGORIZED_KEY_BASE = 'forum:categorized';

// expiration times for forum cache
// short expiry for potentially quickly changing data (based on subscribe) - (cache not updated)
const FORUM_SHORT_EXPIRATION_TIME = 60;

// long expiry for data updated in cache
const FORUM_LONG_EXPIRATION_TIME = 60 * 60;

// to add forums from database to cache
function cacheForums(forums, key) {
    // check if cache entry is for storing created forums or for a single forum
    const forCreated = key.startsWith(FORUM_CREATED_KEY_BASE);
    const forSingle = key.startsWith(FORUM_SINGLE_KEY_BASE);

    // determine expiration time
    const expiry = (forCreated || forSingle) ? FORUM_LONG_EXPIRATION_TIME : FORUM_SHORT_EXPIRATION_TIME;

    const promises = [
        redisClient.json.set(key, '$', forums),
        redisClient.expire(key, expiry)
    ];

    // if cache entry is for storing created forums then add another array of forum ids for referencing
    if (forCreated) {
        // get array of forum ids
        const forumIds = forums.map(forum => forum._id);

        // get new key value for forumIds
        const forumIdKey = getIndexKey(key);

        // add to promises
        promises.concat([
            redisClient.json.set(forumIdKey, '$', forumIds),
            redisClient.expire(forumIdKey, expiry)
        ]);
    }

    return Promise.all(promises);
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

module.exports = {
    FORUM_RECOMMENDED_KEY_BASE,
    FORUM_CATEGORIZED_KEY_BASE,
    FORUM_LONG_EXPIRATION_TIME,
    cacheForums,
    getCreatedForumKey,
    getSubscribedForumKey,
    getForumKey
}