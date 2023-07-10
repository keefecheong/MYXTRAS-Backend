// functions to check attributes of posts to set fields before returning to frontend

const compareId = require('../general/compareId.js');

// adds fields to the post object:
// 1. check if the requesting user is the owner of the post
// 2. check if the requesting user has liked the post
// for an array of posts
function checkPostAttributesAll(posts, userId, savedPosts) {
    let result = [];

    for (let i = 0; i < posts.length; i ++) {
        result.push(checkPostAttributes(posts[i], userId, savedPosts));
    }

    return result;
}

// for one post
function checkPostAttributes(post, userId, savedPosts) {
    post.isOwner = compareId(post.creator_id._id, userId);

    // delete original names if not owner since unnecesary
    if (!post.isOwner) {
        delete post.original_names;
    }
    
    post.liked = post.likes.some(user_id => compareId(user_id, userId));
    // change likes to count to reduce data size
    post.likes = post.likes.length;
    
    post.saved = savedPosts.some(post_id => compareId(post_id, post._id));
    
    return post;
}

module.exports = {
    checkPostAttributes,
    checkPostAttributesAll
}