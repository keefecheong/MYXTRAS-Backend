// controller functions to handle actions for likes under posts

const Post = require('../../models/post.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const { getUserPostKey } = require('../../cache/posts/postCache.js');
const { cachedPostAddLike, cachedPostRemoveLike } = require('../../cache/posts/postLikeCache.js');

// to add a like under the requested post
async function postLike(req, res) {
    const userId = req.user._id;

    // check if the specified post is liked by the user
    const likeExists = res.post.likes.find(creator_id => creator_id == userId);
    
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return returnBadReq(res, 'You have already liked this post.');
    }

    // convert post to mongoose document to perform operations
    const post = new Post(res.post);
    post.isNew = false;

    // update post's likes list
    post.likes.push(userId);

    try {
        // if post is in cache then update cache immediately and update database asynchronously
        if (res.postFromCache) {
            await cachedPostAddLike(getUserPostKey(post.creator_id._id), res.postIndex, userId, post);
        }
        // otherwise update database immediately
        else {
            await post.save();
        }

        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to remove a like under the requested post
async function deleteLike(req, res) {
    const userId = req.user._id;

    // check if the specified post is liked by the user
    const likeIndex = res.post.likes.findIndex(user_id => compareId(user_id, userId));
    
    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return returnBadReq(res, 'You have not liked this post.');
    }

    // convert post to mongoose document to perform operations
    const post = new Post(res.post);
    post.isNew = false;

    // remove user id from post's likes list
    post.likes.splice(likeIndex, 1);

    try {
        // if post is in cache then update cache immediately and update database asynchronously
        if (res.postFromCache) {
            await cachedPostRemoveLike(getUserPostKey(post.creator_id._id), res.postIndex, likeIndex, post)
        }
        // otherwise update database immediately
        else {
            await post.save();
        }

        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    postLike,
    deleteLike
}