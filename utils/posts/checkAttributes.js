// functions to check attributes of posts to set fields before returning to frontend

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
    post.isOwner = post.creator_id._id.equals(userId);
    post.liked = post.likes.some(user_id => user_id.equals(userId));
    post.saved = savedPosts.some(post_id => post_id.equals(post._id));
    return post;
}

module.exports = {
    checkPostAttributes,
    checkPostAttributesAll
}