// to check if there are posts created by a user

const Post = require('../models/post.js');

const redisClient = require('../../cache/redis.js');
const { getUserPostKey } = require('../cache/postCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');

// check database records to determine if there are posts created by a user
async function verifyDBUserHasCreatedPosts(userId, terminated) {
    expectEmpty(await Post.find({ creator_id: userId }).lean(), terminated);
}

// check cache entry to determine if there are posts created by a user
async function verifyCacheUserHasCreatedPosts(userId, terminated) {
    expectEmpty(await redisClient.json.get(getUserPostKey(userId)), terminated);
}

module.exports = {
    verifyDBUserHasCreatedPosts,
    verifyCacheUserHasCreatedPosts
}