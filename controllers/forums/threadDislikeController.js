// controller functions for adding/removing dislike for threads

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// add dislike to thread
async function addDislikeThread(req, res) {
    const dislikeExists = res.thread.dislikes.includes(req.user._id);

    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (dislikeExists) {
        return returnBadReq(res, 'You have already disliked this thread.');
    }

    // update post's likes list
    res.thread.dislikes.push(req.user._id);

    try {
        await res.thread.save();
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// remove dislike from thread
async function removeDislikeThread(req, res) {
    // check if the specified post is liked by the user
    const dislikeIndex = res.thread.dislikes.indexOf(req.user._id);

    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (dislikeIndex == -1) {
        return returnBadReq(res, 'You have not disliked this thread.');
    }

    // remove user id from post's likes list
    res.thread.dislikes.splice(dislikeIndex, 1);

    try {
        await res.thread.save();
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    addDislikeThread,
    removeDislikeThread
}