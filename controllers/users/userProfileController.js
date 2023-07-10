// controller functions to handle user profile related requests

const User = require('../../models/user.js');
const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getUserKey } = require('../../cache/users/userCache.js');

// return current user profile
// user retrieved with authMiddleware
function getUser(req, res) {
    returnGoodReq(res, req.user);
}

// get Requested user
async function getRequestedUser(req, res) {
    try {
        let targetUserId = req.params.userId == 'self' ? req.user._id : req.params.userId;
    
        const user = await User
            .findById(targetUserId)
            .getFollowers()
            .lean()
            .cache({
                key: getUserKey(targetUserId),
                populateFollowers: true
            });
    
        const isFollowing = user.followers.some(follower => compareId(follower._id, req.user._id));
    
        // return information about requesting user to update follower list on frontend immediately
        const self = {
            _id: req.user._id,
            username: req.user.username,
            profile_pic_link: req.user.profile_pic_link
        }
    
        returnGoodReq(res, { user, isFollowing, self });
    }
    catch (error) {
        console.log(error)
        returnServerErrorReq(res);
    }
}

module.exports = {
    getUser,
    getRequestedUser
}