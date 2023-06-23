// controller functions to handle DELETE requests for posts

const Post = require('../../models/post.js');

const deletePost = async (req, res) => {
    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.post.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json({ message: 'Post removed.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    deletePost
}