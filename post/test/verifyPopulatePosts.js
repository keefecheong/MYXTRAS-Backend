// to verify that posts are populated in database and cache properly

const Post = require('../models/post.js');

const redisClient = require('../../cache/redis.js');
const { getUserPostKey } = require('../cache/postCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all posts specified by postIds exist in the database
async function verifyDBPopulatedPosts(postIds) {
    const populatedPosts = await Post.find(
        { _id: { $in: postIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedPosts, postIds);
}

// check that posts by all users specified by creatorIds exist in the cache
async function verifyCachePopulatedPosts(creatorIds) {
    const populatedUserPosts = await Promise.all(
        creatorIds.map(
            creatorId => redisClient.json.get(getUserPostKey(creatorId))
        )
    );

    expectEmpty(populatedUserPosts, false);
}

module.exports = {
    verifyDBPopulatedPosts,
    verifyCachePopulatedPosts
}