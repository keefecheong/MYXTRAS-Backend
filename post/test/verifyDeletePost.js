// expected outcomes when a post has been deleted

const Post = require('../models/post.js');

const redisClient = require('../../cache/redis.js');
const { getUserPostKey, getPostIdPath } = require('../cache/postCache.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const expectEqualValue = require('../../utils/test/expectEqualValue.js');
const expectEmpty = require('../../utils/test/expectEmpty.js');

// send request to delete post and check that response is 200
async function deletePost(creatorId, postId) {
    const res = await sendMockRequest(`/api/posts/user/${creatorId}/post/${postId}`, creatorId, 'delete');
    
    expectEqualValue(res.status, 200);
}

// expect database query results to be null if deleted and not null otherwise
async function verifyDBDeletePost(postId, deleted) {
    expectEmpty(await Post.findById(postId), deleted);
}

// expect cache query results to be null if deleted and not null otherwise
async function verifyCacheDeletePost(creatorId, postId, deleted) {
    expectEmpty(await redisClient.json.get(getUserPostKey(creatorId), { path: getPostIdPath(postId) }), deleted);
}

module.exports = {
    deletePost,
    verifyDBDeletePost,
    verifyCacheDeletePost
}