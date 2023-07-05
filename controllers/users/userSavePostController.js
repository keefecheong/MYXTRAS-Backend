// controller functions to add/remove a post to/from saved_posts

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to save a post
async function savePost(req, res) {
    // check if the specified post is saved by the user
    const saveExists = req.user.saved_posts.find(postId => postId == req.params.postId);

    if (saveExists) {
        return returnBadReq(res, 'You have already saved this post.');
    }

    // update user's saved_posts list
    req.user.saved_posts.push(req.params.postId);

    try {
        await req.user.save();
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to remove a saved post
async function removeSavedPost(req, res) {
    // check if the specified post is saved by the user
    const saveIndex = req.user.saved_posts.indexOf(req.params.postId);

    // if the user has saved the post, continue to remove the post
    // otherwise return 400 error
    if (saveIndex == -1) {
        return returnBadReq(res, 'You have not saved this post');
    }

    // remove post id from the user's saved_posts list
    req.user.saved_posts.splice(saveIndex, 1);

    try {
        await req.user.save();
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