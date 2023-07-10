// functions to add new post to cache/update existing post in cache

const redisClient = require('../redis.js');
const { getIndexKey } = require('../../utils/cache/cacheIndexUtils.js');

// to add new post to cache if parent key already exists
async function cacheNewPost(post, key, userDetails) {
    // check if key exists
    const keyExists = await redisClient.exists(key);

    // if key does not exist in cache then update database immediately and return
    if (!keyExists) {
        await post.save();
        return;
    }

    const postIdKey = getIndexKey(key);

    const jsonPost = post.toObject();
    jsonPost.creator_id = userDetails;
    
    // add post and update post id array (prepend)
    await Promise.all([
        redisClient.json.arrInsert(key, '$', 0, jsonPost),
        redisClient.json.arrInsert(postIdKey, '$', 0, jsonPost._id)
    ]);

    // asynchronously save post
    post.save().catch(error => console.log(error));
}

// to update post data in cache if exists
async function updateCachedPost(updatedValues, key, postIndex, post) {
    // increase version key
    const promises = [redisClient.json.numIncrBy(key, `$[${postIndex}].__v`, 1)];

    // add promise for each updated key/value
    for (const updatedKey in updatedValues) {
        if (updatedValues.hasOwnProperty(updatedKey)) {
            promises.push(redisClient.json.set(key, `$[${postIndex}].${updatedKey}`, updatedValues[updatedKey]));
        }
    }

    // udpate post
    await Promise.all(promises);

    // asynchronously save post
    post.save().catch(error => console.log(error));
}

module.exports = {
    cacheNewPost,
    updateCachedPost
}