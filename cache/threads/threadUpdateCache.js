// functions to add new thread to cache/update existing thread in cache

const redisClient = require('../redis.js');
const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');

// to add new thread to cache if parent key already exists
async function cacheNewThread(thread, key, userDetails, forumDetails) {
    // check if key exists
    const keyExists = await redisClient.exists(key);

    // if key does not exist then update database immediately and return
    if (!keyExists) {
        await thread.save();
        return;
    }

    const threadIdKey = getIndexKey(key);

    const jsonThread = thread.toObject();
    jsonThread.creator_id = userDetails;
    jsonThread.parent_id = forumDetails;

    // add thread and update thread id array (prepend)
    await Promise.all([
        redisClient.json.arrInsert(key, '$', 0, jsonThread),
        redisClient.json.arrInsert(threadIdKey, '$', 0, jsonThread._id)
    ]);

    // asynchronously update database
    thread.save().catch(error => console.log(error));
}

// to update thread data in cache if exists
async function updateCachedThread(updatedValues, key, threadIndex, thread) {
    // increase version key
    const promises = [redisClient.json.numIncrBy(key, `$[${threadIndex}].__v`, 1)];
    
    // add promise for each updated key/value
    for (const updatedKey in updatedValues) {
        if (updatedValues.hasOwnProperty(updatedKey)) {
            promises.push(redisClient.json.set(key, `$[${threadIndex}].${updatedKey}`, updatedValues[updatedKey]));
        }
    }

    // udpate thread
    await Promise.all(promises);

    // asynchronously update database
    thread.save().catch(error => console.log(error));
}

module.exports = {
    cacheNewThread,
    updateCachedThread
}