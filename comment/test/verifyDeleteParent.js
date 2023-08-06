// to verify that comments under a certain deleted parent no longer exist in both database and cache

const { Comment, PARENT_MODEL_POST } = require('../models/comment.js');

const redisClient = require('../../cache/redis.js');
const { getPostCommentKey, getThreadCommentKey } = require('../cache/commentCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');

// expect database query results to be null if parent is deleted and not null otherwise
async function verifyDBDeleteCommentParent(parentId, deleted) {
    expectEmpty(await Comment.find({ parent_id: parentId }), deleted);
}

// expect cache entries to be null if parent is deleted and not null otherwise
async function verifyCacheDeleteCommentParent(parentId, parentModel, deleted) {
    const key = parentModel == PARENT_MODEL_POST ? getPostCommentKey(parentId) : getThreadCommentKey(parentId);
    expectEmpty(await redisClient.json.get(key), deleted);
}

module.exports = {
    verifyDBDeleteCommentParent,
    verifyCacheDeleteCommentParent
}