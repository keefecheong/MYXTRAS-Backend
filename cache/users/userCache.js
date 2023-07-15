// to add users from the database to the cache

const redisClient = require('../redis.js');

// cache key prefixes
// to cache individual users
// format: 'user:single:userid'
const USER_SINGLE_KEY_BASE = 'user:single';

// to cache user's followers
// format: 'user:followers:userid'
const USER_FOLLOWER_KEY_BASE = 'user:followers';

// to cache user's following users' user id
// format: 'user:following:userid'
const USER_FOLLOWING_KEY_BASE = 'user:following';

// expiration time
// 1 hour for all (cache is updated)
const USER_EXPIRATION_TIME = 60 * 60;

// to retrieve a single user from cache if exists
async function getUserFromCache(key, populateFollowers) {
    if (!redisClient.isReady) {
        return null;
    }
    
    let user = await redisClient.json.get(key);

    if (populateFollowers) {
        // if request requires follower data
        // check if follower data exists for this user
        const followerEntry = await redisClient.json.get(getFollowerKey(key.split(':')[2]));

        // if follower data does not exist return null to request database to populate it
        if (!followerEntry) {
            return null;
        }

        // otherwise set the populated data as followers
        user.followers = followerEntry;
    }

    return user;
}

// to store user from database to cache
function cacheUser(data, key, populateFollowers) {
    const workingData = Array.isArray(data) ? [...data] : {...data};

    let followers, followerKey;

    if (populateFollowers) {
        // if cache entry is for storing individual users and user's followers are populated then get the follower data
        followers = workingData.followers;
        followerKey = getFollowerKey(key.split(':')[2]);

        // depopulate followers
        workingData.followers = followers.map(user => user._id);
    }

    // set promises
    const promises = [
        redisClient.json.set(key, '$', workingData),
        redisClient.expire(key, USER_EXPIRATION_TIME)
    ];

    // if there is follower data then add follower data to cache
    if (followers) {
        promises.push(redisClient.json.set(followerKey, '$', followers));
        promises.push(redisClient.expire(followerKey, USER_EXPIRATION_TIME));
    }

    return Promise.all(promises);
}

// to get cache keys
function getUserKey(userId) {
    return `${USER_SINGLE_KEY_BASE}:${userId}`;
}

function getFollowerKey(userId) {
    return `${USER_FOLLOWER_KEY_BASE}:${userId}`;
}

function getFollowingKey(userId) {
    return `${USER_FOLLOWING_KEY_BASE}:${userId}`;
}

// to get path by user id
function getFollowingPath(userId) {
    return `$[?(@._id=="${userId}")]`;
}

function getBlockedPath(userId) {
    return `$.blocked_users[?(@.user_id=="${userId}")]`;
}

function getSavedPostPath(userId) {
    return `$.saved_posts[?(@.creator_id=="${userId}")]`;
}

module.exports = {
    USER_EXPIRATION_TIME,
    getUserFromCache,
    cacheUser,
    getUserKey,
    getFollowerKey,
    getFollowingKey,
    getFollowingPath,
    getBlockedPath,
    getSavedPostPath
}