// controller functions to add/remove a post to/from saved_posts

// to save a post
async function savePost(req, res) {
    // check if the specified post is saved by the user
    const saveExists = req.user.saved_posts.find(postId => postId == req.params.postId);

    if (saveExists) {
        return res.status(400).json({ message: 'You have already saved this post.' });
    }

    // update user's saved_posts list
    req.user.saved_posts.push(req.params.postId);

    try {
        await req.user.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// to remove a saved post
async function removeSavedPost(req, res) {
    // check if the specified post is saved by the user
    const saveIndex = req.user.saved_posts.indexOf(req.params.postId);

    // if the user has saved the post, continue to remove the post
    // otherwise return 400 error
    if (saveIndex == -1) {
        return res.status(400).json({ message: 'You have not saved this post' });
    }

    // remove post id from the user's saved_posts list
    req.user.saved_posts.splice(saveIndex, 1);

    try {
        await req.user.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    savePost,
    removeSavedPost
}