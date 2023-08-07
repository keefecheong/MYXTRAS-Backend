// expected outcomes when comments have been deleted in bulk (terminate/block user)

const mongoose = require('mongoose');
const { PARENT_MODEL_POST } = require('../models/comment.js');

const redisClient = require('../../cache/redis.js');
const { getUserPostKey, getPostIdPath } = require('../../post/cache/postCache.js');
const { getForumThreadKey, getThreadIdPath } = require('../../thread/cache/threadCache.js');

const expectEqualValue = require('../../utils/test/expectEqualValue.js');

// expect parent in database to have comment_count of <initialComments> if not deleted
// otherwise expect comment_count of <initialComments - deletedComments>
async function verifyDBBulkDeleteComments(parentId, parentModel, initialComments, deletedComments, deleted) {
    const parentCommentCount = (await mongoose.model(parentModel).findById(parentId).lean()).comment_count;

    const expectedCommentCount = deleted ? initialComments - deletedComments : initialComments;
    
    expectEqualValue(parentCommentCount, expectedCommentCount);
}

// same test as above but for cache
async function verifyCacheBulkDeleteComments(parentId, parentMeta, parentModel, initialComments, deletedComments, deleted) {
    const forPost = parentModel == PARENT_MODEL_POST;
    const parentCommentCount = forPost ? 
        await redisClient.json.get(getUserPostKey(parentMeta), { path: `${getPostIdPath(parentId)}.comment_count` }) :
        await redisClient.json.get(getForumThreadKey(parentMeta), { path: `${getThreadIdPath(parentId)}.comment_count` });

    const expectedCommentCount = deleted ? initialComments - deletedComments : initialComments;

    expectEqualValue(parentCommentCount, expectedCommentCount);
}

module.exports = {
    verifyDBBulkDeleteComments,
    verifyCacheBulkDeleteComments
}