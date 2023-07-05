// controller functions for adding/removing likes for threads

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// add like to thread
async function addLikeThread(req, res) {
    const likeExists = res.thread.likes.includes(req.user._id);

    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return returnBadReq(res, 'You have already liked this thread.');
    }
    // update post's likes list
    res.thread.likes.push(req.user._id);

    try {
        await res.thread.save();
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// remove like from thread
async function removeLikeThread(req, res) {
    // check if the specified post is liked by the user
    const likeIndex = res.thread.likes.indexOf(req.user._id);

    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return returnBadReq(res, 'You have not liked this thread.');
    }

    // remove user id from post's likes list
    res.thread.likes.splice(likeIndex, 1);

    try {
        await res.thread.save();
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    addLikeThread,
    removeLikeThread
}