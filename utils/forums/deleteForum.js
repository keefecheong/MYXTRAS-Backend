// to delete a forum

const Forum = require('../../models/forum.js');
const performAllSync = require('../cache/performAllSync.js');
const { deleteCachedForum } = require('../../cache/forums/forumDeleteCache.js');

module.exports = async function deleteForumUtil(forumId, creatorId) {
    // get promises to delete forum from cache
    const cachePromises = await deleteCachedForum(forumId, creatorId);

    // delete forum from cache and database synchronously
    return performAllSync(cachePromises, Forum.findByIdAndDelete(forumId));
}