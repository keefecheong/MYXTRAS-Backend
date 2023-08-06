// to verify that comments are populated in database and cache properly

const { Comment, PARENT_MODEL_POST } = require('../models/comment.js');

const redisClient = require('../../cache/redis.js');
const { getPostCommentKey, getThreadCommentKey } = require('../cache/commentCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all comments specified by commentIds exist in the database
async function verifyDBPopulatedComments(commentIds) {
    const populatedComments = await Comment.find(
        { _id: { $in: commentIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedComments, commentIds);
}

// check that all parents with comments have comment entries in the cache
async function verifyCachePopulatedComments(parentIds, parentModel) {
    const populatedComments = await Promise.all(
        parentIds.map(
            parentId => redisClient.json.get(parentModel == PARENT_MODEL_POST 
                ? getPostCommentKey(parentId) : 
                getThreadCommentKey(parentId)
            )
        )
    );

    expectEmpty(populatedComments, false);
}

module.exports = {
    verifyDBPopulatedComments,
    verifyCachePopulatedComments
}