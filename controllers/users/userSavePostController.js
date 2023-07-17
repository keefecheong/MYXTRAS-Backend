// controller functions to add/remove a post to/from saved_posts

const { User } = require('../../models/user.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const checkBlocked = require('../../utils/users/checkBlocked.js');

const { cachedUserSavePost, cachedUserRemoveSavedPost } = require('../../cache/users/userSavePostCache.js');

// to save a post
async function savePost(req, res) {
    const post = res.post;
    const postId = post._id;

    // check if either creator or requesting user has blocked each other
    const blocked = checkBlocked(post.creator_id._id, post.creator_id.blocked_users, req.user._id, req.user.blocked_users);

    if (blocked) {
        return returnBadReq(res, 'Could not save this post.');
    }

    // check if the specified post is saved by the user
    const saveExists = req.user.saved_posts.find(entry => compareId(entry.post_id, postId));

    if (saveExists) {
        return returnBadReq(res, 'You have already saved this post.');
    }

    // update user's saved_posts list
    const user = new User(req.user);
    user.isNew = false;

    const savedPostEntry = {
        post_id: postId,
        creator_id: post.creator_id._id
    };

    user.saved_posts.push(savedPostEntry);

    try {
        // update cache
        const updateCacheResult = await cachedUserSavePost(user, savedPostEntry);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(user, updateCacheResult);
        
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to remove a saved post
async function removeSavedPost(req, res) {
    const postId = req.params.postId;

    // check if the specified post is saved by the user
    const saveIndex = req.user.saved_posts.findIndex(entry => compareId(entry.post_id, postId));

    // if the user has saved the post, continue to remove the post
    // otherwise return 400 error
    if (saveIndex == -1) {
        return returnBadReq(res, 'You have not saved this post');
    }

    // remove post id from the user's saved_posts list
    const user = new User(req.user);
    user.isNew = false;

    user.saved_posts.splice(saveIndex, 1);

    try {
        // update cache
        const updateCacheResult = await cachedUserRemoveSavedPost(user, saveIndex);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(user, updateCacheResult);
        
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    savePost,
    removeSavedPost
}