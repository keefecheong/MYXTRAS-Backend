// controller functions to handle actions for saving posts

const Post = require('../models/post.js');

const returnCreatedReq = require('../../utils/returnReq/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/returnReq/returnNoContentReq.js');
const returnBadReq = require('../../utils/returnReq/returnBadReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/general/saveDocAsync.js');

const checkBlocked = require('../../user/utils/checkBlocked.js');

const { cachedPostAddSave, cachedPostRemoveSave } = require('../cache/postSaveCache.js');

// to save a post
async function savePost(req, res) {
    const post = new Post(res.post);
    post.isNew = false;

    const userId = req.user._id;

    // check if either the creator or requesting user has blocked each other
    const blocked = checkBlocked(post.creator_id._id, post.creator_id.blocked_users, userId, req.user.blocked_users);

    if (blocked) {
        return returnBadReq(res, 'Could not save this post.');
    }

    // check if the specified post is saved by the user
    const saveExists = post.saved_by.find(user_id => compareId(user_id, userId));
    
    // if the user has not saved the post, continue to save the post
    // otherwise, return 400 error
    if (saveExists) {
        return returnBadReq(res, 'You have already saved this post.');
    }

    // update post's saved_by list
    post.saved_by.push(userId);

    try {
        // update cache entry
        const updateCacheResult = await cachedPostAddSave(post.creator_id._id, post._id, userId);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to remove a saved post
async function removeSavedPost(req, res) {
    const userId = req.user._id;

    // check if the specified post is saved by the user
    const saveIndex = res.post.saved_by.findIndex(user_id => compareId(user_id, userId));
    
    // if the user has saved the post, continue to remove the user from saved_by
    // otherwise, return 400 error
    if (saveIndex == -1) {
        return returnBadReq(res, 'You have not saved this post.');
    }

    // convert post to mongoose document to perform operations
    const post = new Post(res.post);
    post.isNew = false;

    // remove user id from post's saved_by list
    post.saved_by.splice(saveIndex, 1);

    try {
        // update cache entry
        const updateCacheResult = await cachedPostRemoveSave(post.creator_id._id, post._id, saveIndex);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(post, updateCacheResult);

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