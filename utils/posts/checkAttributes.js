// functions to check attributes of posts to set fields before returning to frontend

// adds fields to the post object:
// 1. check if the requesting user is the owner of the post
// 2. check if the requesting user has liked the post
// for an array of posts
function checkPostAttributesAll(posts, userId) {
    let result = [];

    for (let i = 0; i < posts.length; i ++) {
        result.push(checkPostAttributes(posts[i], userId));
    }

    return result;
}

// for one post
function checkPostAttributes(post, userId) {
    post.isOwner = post.creator_id._id.equals(userId);
    post.liked = post.likes.some(creator_id => creator_id.equals(userId));
    return post;
}

module.exports = {
    checkPostAttributes,
    checkPostAttributesAll
}