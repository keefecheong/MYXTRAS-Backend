// controller functions to handle actions for likes under posts

const Post = require('../../models/post.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const checkBlocked = require('../../utils/users/checkBlocked.js');

const { cachedPostAddLike, cachedPostRemoveLike } = require('../../cache/posts/postLikeCache.js');

// to add a like under the requested post
async function postLike(req, res) {
    var post = res.post;
    const userId = req.user._id;

    // check if either the creator or requesting user has blocked each other
    const blocked = checkBlocked(post.creator_id._id, post.creator_id.blocked_users, userId, req.user.blocked_users);

    if (blocked) {
        return returnBadReq(res, 'Could not like this post.');
    }

    // check if the specified post is liked by the user
    const likeExists = post.likes.find(creator_id => creator_id == userId);
    
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return returnBadReq(res, 'You have already liked this post.');
    }

    // convert post to mongoose document to perform operations
    post = new Post(post);
    post.isNew = false;

    // update post's likes list
    post.likes.push(userId);

    try {
        // update cache entry
        const updateCacheResult = await cachedPostAddLike(post.creator_id._id, post._id, userId);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

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
        // update cache entry
        const updateCacheResult = await cachedPostRemoveLike(post.creator_id._id, post._id, likeIndex);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

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