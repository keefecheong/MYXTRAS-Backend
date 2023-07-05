// controller functions to handle actions for likes under posts

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to add a like under the requested post
async function postLike(req, res) {
    // check if the specified post is liked by the user
    const likeExists = res.post.likes.find(creator_id => creator_id == req.user._id);
    
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return returnBadReq(res, 'You have already liked this post.');
    }

    // update post's likes list
    res.post.likes.push(req.user._id);

    try {
        await res.post.save();
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to remove a like under the requested post
async function deleteLike(req, res) {
    // check if the specified post is liked by the user
    const likeIndex = res.post.likes.indexOf(req.user._id);
    
    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return returnBadReq(res, 'You have not liked this post.');
    }

    // remove user id from post's likes list
    res.post.likes.splice(likeIndex, 1);

    try {
        await res.post.save();
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