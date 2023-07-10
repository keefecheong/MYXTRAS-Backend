// utils for dealing with object ids

const redisClient = require('../../cache/redis.js');

// to get cache key for storing ids
function getIndexKey(key) {
    const prefix = key.split(':', 1);
    return key.replace(`${prefix}:`, `${prefix}-index:`);
}

// to check if a cache entry exists for a certain id and return the index
function getIdIndex(key, id) {
    const idKey = getIndexKey(key);
    return redisClient.json.arrIndex(idKey, '$', id);
}

module.exports = {
    getIndexKey,
    getIdIndex
}