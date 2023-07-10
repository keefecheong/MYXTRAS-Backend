// controller functions to handle follow/unfollow requests

const User = require('../../models/user.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const { getIdIndex } = require('../../utils/cache/cacheIndexUtils.js');
const { getFollowingKey } = require('../../cache/users/userCache.js');
const { cachedUserAddFollower, cachedUserRemoveFollower } = require('../../cache/users/userFollowCache.js');

// to follow the user
async function followUser(req, res) {
    // check if the requesting user is following the specified user
    const following = res.user.followers.some(follower_id => compareId(follower_id, req.user._id));

    // if the requesting user has not followed the requested user, continue to follow the user
    // otherwise return 400 error
    if (following) {
        return returnBadReq(res, 'You have already followed this user.');
    }

    // update followers list
    const user = new User(res.user);
    user.isNew = false;

    user.followers.push(req.user._id);

    const followerDetails = {
        _id: req.user._id,
        username: req.user.username,
        profile_pic_link: req.user.profile_pic_link
    }

    try {
        await cachedUserAddFollower(user, followerDetails);
        
        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to unfollow the user
async function unfollowUser(req, res) {
    // check if the requesting user is following the requested user
    const followerIndex = res.user.followers.findIndex(follower_id => compareId(follower_id, req.user._id));

    // if the requesting user has followed the requested user, continue to unfollow the user
    // otherwise return 400 error
    if (followerIndex == -1) {
        return returnBadReq(res, 'You have not followed this user.');
    }

    // remove requesting user from requested user's followers list
    const user = new User(res.user);
    user.isNew = false;
    
    user.followers.splice(followerIndex, 1);

    let followingIndex = null;

    try {
        try {
            followingIndex = await getIdIndex(getFollowingKey(req.user._id), res.user._id);
        }
        catch (error) {
            // if error is not produced because the requesting user's following cache entry does not exist then throw an error
            if (error.message != "ERR Path '$' does not exist") {
                throw new Error();
            }
        }

        await cachedUserRemoveFollower(user, req.user._id, followerIndex, followingIndex);

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