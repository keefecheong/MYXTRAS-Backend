// controller functions to handle actions for likes under posts

// to add a like under the requested post
const postLike = async (req, res) => {
    // check if the specified post is liked by the user
    const likeExists = res.post.likes.find(creator_id => creator_id == req.user._id);
    
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return res.status(400).json({ message: 'You have already liked this post.' });
    }

    // update post's likes list
    res.post.likes.push(req.user._id);

    try {
        await res.post.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// to remove a like under the requested post
const deleteLike = async (req, res) => {
    // check if the specified post is liked by the user
    const likeIndex = res.post.likes.indexOf(req.user._id);
    
    // if the user has liked the post, continue to remove the like
    // otherwise, return 400 error
    if (likeIndex == -1) {
        return res.status(400).json({ message: 'You have not liked this post.' });
    }

    // remove user id from post's likes list
    res.post.likes.splice(likeIndex, 1);

    try {
        await res.post.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    postLike,
    deleteLike
}