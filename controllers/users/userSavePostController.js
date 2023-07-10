// controller functions to add/remove a post to/from saved_posts

const User = require('../../models/user.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { cachedUserSavePost, cachedUserRemoveSavedPost } = require('../../cache/users/userSavePostCache.js');

// to save a post
async function savePost(req, res) {
    const postId = req.params.postId;

    // check if the specified post is saved by the user
    const saveExists = req.user.saved_posts.find(post_id => post_id == postId);

    if (saveExists) {
        return returnBadReq(res, 'You have already saved this post.');
    }

    // update user's saved_posts list
    const user = new User(req.user);
    user.isNew = false;

    user.saved_posts.push(postId);

    try {
        await cachedUserSavePost(user, postId);
        
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
    const saveIndex = req.user.saved_posts.indexOf(postId);

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
        await cachedUserRemoveSavedPost(user, saveIndex);
        
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