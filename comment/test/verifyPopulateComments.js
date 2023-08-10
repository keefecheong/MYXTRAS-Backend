// to verify that comments are populated in database and cache properly

const { Comment, PARENT_MODEL_POST } = require('../models/comment.js');

const redisClient = require('../../cache/redis.js');
const { getPostCommentKey, getThreadCommentKey } = require('../cache/commentCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all comments specified by commentIds exist in the database
function verifyDBPopulatedComments(commentIds) {
    return {
        title: 'should add comments to database',
        callback: async () => expectEqualLengthResults(await Comment.find(
            { _id: { $in: commentIds } },
            { _id: 1 }
        ).lean(), commentIds),
        params: [commentIds]
    }
}

// check that all parents with comments have comment entries in the cache
function verifyCachePopulatedComments(parentIds, parentModel) {
    return {
        title: 'should populate comments in cache',
        callback: async () => expectEmpty(await Promise.all(
            parentIds.map(
                parentId => redisClient.json.get(parentModel == PARENT_MODEL_POST 
                    ? getPostCommentKey(parentId) : 
                    getThreadCommentKey(parentId)
                )
            )
        ), false),
        params: [parentIds, parentModel]
    }
}

module.exports = {
    verifyDBPopulatedComments,
    verifyCachePopulatedComments
}