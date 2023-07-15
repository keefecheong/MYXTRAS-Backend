// to delete forum entry from cache

const redisClient = require('../redis.js');

const { getForumKey, getCreatedForumKey, getForumIdPath } = require('./forumCache.js');
const { getForumThreadKey } = require('../threads/threadCache.js');
const { getThreadCommentKey } = require('../comments/commentCache.js');
const { deleteAllCachedComments } = require('../comments/commentDeleteCache.js');

// to delete forum entry from cache
async function deleteCachedForum(forumId, userId) {
    if (!redisClient.isReady) {
        return [];
    }

    const forumKey = getForumKey(forumId);
    const createdKey = getCreatedForumKey(userId);

    var promises = [
        redisClient.json.del(forumKey, '$')
    ];

    // if forum:created entry exists, delete the associated information
    promises.push(redisClient.json.del(createdKey, getForumIdPath(forumId)));

    // delete all associated threads and comments
    const threadKey = getForumThreadKey(forumId);
    
    const threadIds = await redisClient.json.get(threadKey, {
        path: '$.*._id'
    });
    
    promises = promises.concat(threadIds.map(threadId => deleteAllCachedComments(getThreadCommentKey(threadId))));

    promises.push(redisClient.json.del(threadKey, '$'));

    return promises;
}

module.exports = {
    deleteCachedForum
}