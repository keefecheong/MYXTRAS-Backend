// to delete forum entry from cache

const redisClient = require('../redis.js');
const Forum = require('../../models/forum.js');

const { getIndexKey, getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');

const { getForumThreadKey } = require('../threads/threadCache.js');
const { getThreadCommentKey } = require('../comments/commentCache.js');
const { deleteAllCachedComments } = require('../comments/commentDeleteCache.js');

// to delete forum entry from cache and database
async function deleteCachedForum(key, createdKey, forumId) {
    const promises = [
        redisClient.json.del(key, '$'),
        Forum.findByIdAndDelete(forumId)
    ];

    const createdIdKey = getIndexKey(createdKey);
    let createdIndex = null;

    try {
        createdIndex = await getIdIndex(createdKey, forumId);
    }
    catch (error) {
        // if error is not produced from inexistent path then throw error to handle in caller function
        if (error.message != "ERR Path '$' does not exist") {
            throw new Error();
        }
    }

    // if forum:created entry exists, delete the associated information
    if (createdIndex != null) {
        promises.concat([
            redisClient.json.arrPop(createdKey, '$', createdIndex),
            redisClient.json.arrPop(createdIdKey, '$', createdIndex)
        ]);
    }

    // delete all associated threads and comments
    const threadKey = getForumThreadKey(forumId);
    const threadIdKey = getIndexKey(threadKey);
    
    const threadIds = await redisClient.json.get(threadKey, {
        path: '$[*]._id'
    });
    
    promises.concat(threadIds.map(threadId => deleteAllCachedComments(getThreadCommentKey(threadId))));

    promises.concat([
        redisClient.json.del(threadKey, '$'),
        redisClient.json.del(threadIdKey, '$')
    ]);

    return Promise.all(promises);
}

module.exports = {
    deleteCachedForum
}