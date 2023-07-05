// controller functions to handle follow/unfollow requests

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to follow the user
async function followUser(req, res) {
    // check if the requesting user is following the specified user
    const following = res.user.followers.includes(req.user._id);

    // if the requesting user has not followed the requested user, continue to follow the user
    // otherwise return 400 error
    if (following) {
        return returnBadReq(res, 'You have already followed this user.');
    }

    // update followers list
    res.user.followers.push(req.user._id);

    try {
        await res.user.save();
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to unfollow the user
async function unfollowUser(req, res) {
    // check if the requesting user is following the requested user
    const followingIndex = res.user.followers.indexOf(req.user._id);

    // if the requesting user has followed the requested user, continue to unfollow the user
    // otherwise return 400 error
    if (followingIndex == -1) {
        return returnBadReq(res, 'You have not followed this user.');
    }

    // remove requesting user from requested user's followers list
    res.user.followers.splice(followingIndex, 1);

    try {
        await res.user.save();
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    followUser,
    unfollowUser
}