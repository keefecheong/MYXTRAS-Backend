// to add Unblock entries from the database to cache

const redisClient = require('../redis.js');
const { UNBLOCK_TTL } = require('../../models/unblock.js');

// cache key prefixes
// to cache individual unblock entries
// format: 'unblock:blockerid:blockedid
const UNBLOCK_SINGLE_KEY_BASE = 'unblock';

// to store an entry from database to cache
function cacheUnblock(unblock) {
    if (!redisClient.isReady) {
        return;
    }

    if (!unblock) {
        return;
    }

    const key = getUnblockKey(unblock.blocker_id, unblock.blocked_id);

    // set cache entry to expire when the Unblock entry expires
    const expiry = unblock.unblock_time.getTime() + UNBLOCK_TTL * 60 * 1000 - Date.now();

    const promises = [
        redisClient.json.set(key, '$', unblock),
        redisClient.expire(key, expiry)
    ];

    return Promise.all(promises);
}

// to get cache keys
function getUnblockKey(blockerId, blockedId) {
    return `${UNBLOCK_SINGLE_KEY_BASE}:${blockerId}:${blockedId}`;
}

module.exports = {
    cacheUnblock,
    getUnblockKey
}