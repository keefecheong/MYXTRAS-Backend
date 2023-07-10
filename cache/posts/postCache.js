// to initially add post data from the database to the cache

const redisClient = require('../redis.js');
const { getIndexKey, getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');

// cache key prefixes
// to cache posts grouped by user id
// format: 'post:user:userid'
const POST_USER_KEY_BASE = 'post:user';

// to cache aggregated posts grouped by tags
// format: 'post:popular:tag1-tag2'
const POST_POPULAR_KEY_BASE = 'post:popular';

// expiration times for posts cache
// 1 hour for posts cached by creator id (cache is updated)
const POST_USER_EXPIRATION_TIME = 60 * 60;

// 1 minute for posts cached by tags (by aggregation to get popular posts) - (cache not updated)
const POST_POPULAR_EXPIRATION_TIME = 60;

// to retrieve a single post from cache if exists
async function getPostFromCache(key, postId) {
    try {
        const postIndex = await getIdIndex(key, postId);
    
        const post = await redisClient.json.get(key, {
            path: `$[${postIndex}]`
        });

        return { success: true, post: post[0], postIndex };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
}

// to store post data from database in cache
function cachePosts(posts, key) {
    // check if cache entry is for storing by user or by tags
    const byUser = key.startsWith(POST_USER_KEY_BASE);

    // determine expiration time
    const expiry = byUser ? POST_USER_EXPIRATION_TIME : POST_POPULAR_EXPIRATION_TIME;

    const promises = [
        redisClient.json.set(key, '$', posts),
        redisClient.expire(key, expiry)
    ];

    // if cache entry is for storing by user then add another array of post ids for referencing
    if (byUser) {
        // get array of post ids
        const postIds = posts.map(post => post._id);
    
        // get new key value for the above array
        const postIdKey = getIndexKey(key);

        // add to promises
        promises.concat([
            redisClient.json.set(postIdKey, '$', postIds),
            redisClient.expire(postIdKey, expiry)
        ]);
    }

    return Promise.all(promises);
}

// to get cache keys
function getUserPostKey(userId) {
    return `${POST_USER_KEY_BASE}:${userId}`;
}

function getPopularPostKey(tags) {
    return `${POST_POPULAR_KEY_BASE}:${tags}`;
}

module.exports = {
    cachePosts,
    getPostFromCache,
    getUserPostKey,
    getPopularPostKey
}