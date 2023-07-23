// controller functions to handle follow/unfollow requests

const { User } = require('../../models/user.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');
const checkBlocked = require('../../utils/users/checkBlocked.js');

const { cachedUserAddFollower, cachedUserRemoveFollower } = require('../../cache/users/userFollowCache.js');

// to follow the user
async function followUser(req, res) {
    const self = new User(req.user);
    self.isNew = false;
    var targetUser = res.user;
    const tasks = self.daily_missions;

    // if either user has blocked the other user then prevent following
    const blocked = checkBlocked(self._id, self.blocked_users, targetUser._id, targetUser.blocked_users);

    if (blocked) {
        return returnBadReq(res, 'Could not follow this user.');
    }

    // check if the requesting user is following the specified user
    const following = targetUser.followers.some(follower_id => compareId(follower_id, self._id));

    // if the requesting user has not followed the requested user, continue to follow the user
    // otherwise return 400 error
    if (following) {
        return returnBadReq(res, 'You have already followed this user.');
    }

    // update followers list
    targetUser = new User(targetUser);
    targetUser.isNew = false;

    targetUser.followers.push(self._id);

    // if (tasks.includes('Follow a new user')){
    //     console.log(1)
    // }

    const updatedValues = {};
    const targetTaskTitle = 'Follow a new user';

    const targetTaskIndex = tasks.findIndex(task => task.title === targetTaskTitle);
    if (targetTaskIndex !== -1){
        tasks[targetTaskIndex].locked = false;
        updatedValues.daily_missions = tasks;
    }

    const followerDetails = {
        _id: self._id,
        username: self.username,
        profile_pic_link: self.profile_pic_link
    }

    try {
        // update cache
        const updateCacheResult = await cachedUserAddFollower(targetUser._id, followerDetails);
        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(targetUser, updateCacheResult);

        const updateCacheResult2 = await updateCachedUser(updatedValues, self._id, true);
        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(self, updateCacheResult2);

        returnCreatedReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to unfollow the user
async function unfollowUser(req, res) {
    const selfId = req.user._id;
    var targetUser = res.user;

    // check if the requesting user is following the requested user
    const followerIndex = targetUser.followers.findIndex(follower_id => compareId(follower_id, selfId));

    // if the requesting user has followed the requested user, continue to unfollow the user
    // otherwise return 400 error
    if (followerIndex == -1) {
        return returnBadReq(res, 'You have not followed this user.');
    }

    // remove requesting user from requested user's followers list
    targetUser = new User(targetUser);
    targetUser.isNew = false;
    
    targetUser.followers.splice(followerIndex, 1);

    try {
        // update cache
        const updateCacheResult = await cachedUserRemoveFollower(targetUser._id, selfId, true);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(targetUser, updateCacheResult);

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