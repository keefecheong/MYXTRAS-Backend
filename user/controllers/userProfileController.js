// controller functions to handle user profile related requests

const { User } = require('../models/user.js');
const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

const { getUserKey } = require('../cache/userCache.js');

// return current user profile
// user retrieved with authMiddleware
function getUser(req, res) {
    delete req.user.blocked_users;

    returnGoodReq(res, req.user);
}

// get Requested user
async function getRequestedUser(req, res) {
    try {
        const requestingUser = req.user;
        let targetUserId = req.params.userId == 'self' ? requestingUser._id : req.params.userId;
    
        const user = await User
            .findById(targetUserId)
            .getFollowers()
            .lean()
            .cache({
                key: getUserKey(targetUserId),
                populateFollowers: true
            });
    
        const isFollowing = user.followers.some(follower => compareId(follower._id, requestingUser._id));

        const viewSelf = requestingUser._id == targetUserId;
        const blockedByUser = !viewSelf && user.blocked_users.some(entry => compareId(entry.user_id, requestingUser._id));
        const blockingUser = !viewSelf && requestingUser.blocked_users.some(entry => compareId(entry.user_id, user._id));

        delete user.blocked_users;
    
        // return information about requesting user to update follower list on frontend immediately
        const self = {
            _id: requestingUser._id,
            username: requestingUser.username,
            profile_pic_link: requestingUser.profile_pic_link
        }
    
        returnGoodReq(res, { user, isFollowing, blockedByUser, blockingUser, self });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get all users
async function getAllUsers(req, res) {
    try {
        const users = await User
            .find()
            .populate({
                path: 'status.performed_by warnings.reviewer_id',
                select: 'username'
            })
            .lean();

        users.forEach(user => {
            if (compareId(user._id, req.user._id)) {
                user.isSelf = true;
            }
        });

        returnGoodReq(res, users);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getUser,
    getRequestedUser,
    getAllUsers
}