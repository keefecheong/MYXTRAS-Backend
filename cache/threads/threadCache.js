// to add thread data from database to the cache

const redisClient = require('../redis.js');
const { getIndexKey, getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');

// cache key prefixes
// to cache threads grouped by parent forum id
// format: 'thread:forum:forumid'
const THREAD_FORUM_KEY_BASE = 'thread:forum';

// to cache aggregated threads grouped by tags
// format: 'thread:popular:tag1-tag2'
const THREAD_POPULAR_KEY_BASE = 'thread:popular';

// expiration times for thread cache
// 1 hour for threads cached by forum id (cache is updated)
const THREAD_FORUM_EXPIRATION_TIME = 60 * 60;

// 1 minute for threads cached by tags (by aggregation) - (cache is not updated)
const THREAD_POPULAR_EXPIRATION_TIME = 60;

// to retrieve a single thread from cache if exists
async function getThreadFromCache(key, threadId) {
    try {
        const threadIndex = await getIdIndex(key, threadId);

        const thread = await redisClient.json.get(key, {
            path: `$[${threadIndex}]`
        });

        return { success: true, thread: thread[0], threadIndex };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}

// to store thread data from database in cache
function cacheThreads(threads, key, popularType) {
    // check if cache entry is for storing by forum or by tags
    const byForum = key.startsWith(THREAD_FORUM_KEY_BASE);

    // determine expiration time
    const expiry = byForum ? THREAD_FORUM_EXPIRATION_TIME : THREAD_POPULAR_EXPIRATION_TIME;

    const promises = [
        redisClient.json.set(key, '$', threads, {
            // for popular route (6 threads max) only set cache if cache entry does not exist
            // prevent overwriting threads retrieved from explore
            NX: !byForum && popularType == 'popular'
        }),
        redisClient.expire(key, expiry)
    ];

    // if cache entry is for storing by forum then add another array of thread ids for referencing
    if (byForum) {
        // get array of thread ids
        const threadIds = threads.map(thread => thread._id);

        // get new key value for threadIds
        const threadIdKey = getIndexKey(key);

        // add to promises
        promises.concat([
            redisClient.json.set(threadIdKey, '$', threadIds),
            redisClient.expire(threadIdKey, expiry)
        ]);
    }

    return Promise.all(promises);
}

// to get cache keys
function getForumThreadKey(forumId) {
    return `${THREAD_FORUM_KEY_BASE}:${forumId}`;
}

function getPopularThreadKey(tags) {
    return `${THREAD_POPULAR_KEY_BASE}:${tags}`;
}

module.exports = {
    getThreadFromCache,
    cacheThreads,
    getForumThreadKey,
    getPopularThreadKey
}