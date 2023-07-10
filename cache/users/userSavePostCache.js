// to update cached user when a post is saved/unsaved

const redisClient = require('../redis.js');

const { getUserKey } = require('../users/userCache.js');

// to add a saved post to user in cache and update database asynchronously
async function cachedUserSavePost(user, postId) {
    const key = getUserKey(user._id);

    await Promise.all([
        redisClient.json.arrAppend(key, '$.saved_posts', postId),
        redisClient.json.numIncrBy(key, '$.__v', 1)
    ]);

    user.save().catch(error => console.log(error));
}

// to remove a saved post from user in cache and update database asynchronously
async function cachedUserRemoveSavedPost(user, saveIndex) {
    const key = getUserKey(user._id);

    await Promise.all([
        redisClient.json.arrPop(key, '$.saved_posts', saveIndex),
        redisClient.json.numIncrBy(key, '$.__v', -1)
    ]);

    user.save().catch(error => console.log(error));
}

module.exports = {
    cachedUserSavePost,
    cachedUserRemoveSavedPost
}