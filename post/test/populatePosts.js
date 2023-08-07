// to populate posts

const Post = require('../models/post.js');
const addCommentsToDB = require('../../comment/test/populateComments.js');
const { PARENT_MODEL_POST } = require('../../comment/models/comment.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const generateRandomReactions = require('../../utils/test/generateRandomReactions.js');

// to add posts and comments to database then populate cache
module.exports = async function addPostsToDB(count, creatorIds, commentCount = 5) {
    // create posts for each user
    const posts = creatorIds.flatMap(creatorId => generatePostsPerCreator(creatorId, count, creatorIds));

    // add posts and comments to database
    await Post.insertMany(posts);

    const postComments = await addCommentsToDB(commentCount, posts.map(post => post._id), PARENT_MODEL_POST, creatorIds);

    const postData = posts.map(post => { 
        return { 
            _id: post._id, 
            creator_id: post.creator_id 
        }
    });

    // populate cache
    await populatePostCache(creatorIds, postData);

    return { postData, postComments };
}

// generate <count> posts by a user
function generatePostsPerCreator(creatorId, count, userIds) {
    const posts = [];

    for (let i = 0; i < count; i++) {
        posts.push(new Post({
            creator_id: creatorId,
            content_links: ['http://fakelink/post.png'],
            original_names: ['post.jpg'],
            likes: userIds,
            saved_by: userIds
        }));
    }

    return posts;
}

// to populate cache with posts and comments
async function populatePostCache(userIds, posts) {
    await Promise.all([
        // populate cache with each user's posts
        userIds.map(userId => sendMockRequest('/api/posts/by/self', userId, 'get')),
        // populate cache with each post's comments
        posts.map(post => sendMockRequest(`/api/posts/user/${post.creator_id}/post/${post._id}/comments`, post.creator_id, 'get'))
    ].flat());
}