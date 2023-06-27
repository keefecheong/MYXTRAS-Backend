// controller functions to handle follow/unfollow requests

// to follow the user
async function followUser(req, res) {
    // check if the requesting user is following the specified user
    const following = res.user.followers.includes(req.user._id);

    // if the requesting user has not followed the requested user, continue to follow the user
    // otherwise return 400 error
    if (following) {
        return res.status(400).json({ message: 'You have already followed this user.' });
    }

    // update followers list
    res.user.followers.push(req.user._id);

    try {
        await res.user.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// to unfollow the user
async function unfollowUser(req, res) {
    // check if the requesting user is following the requested user
    const followingIndex = res.user.followers.indexOf(req.user._id);

    // if the requesting user has followed the requested user, continue to unfollow the user
    // otherwise return 400 error
    if (followingIndex == -1) {
        return res.status(400).json({ message: 'You have not followed this user.' });
    }

    // remove requesting user from requested user's followers list
    res.user.followers.splice(followingIndex, 1);

    try {
        await res.user.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    followUser,
    unfollowUser
}