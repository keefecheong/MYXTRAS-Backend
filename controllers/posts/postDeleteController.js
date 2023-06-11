// controller functions to handle DELETE requests for posts

const Post = require('../../models/post.js');
const Comment = require('../../models/comment.js');
const { deleteImages } = require('../../utils/posts/firebaseStorageDelete.js');

const deletePost = async (req, res) => {
    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (req.user._id.toString() != res.post.creator_id._id.toString()) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        // delete associated images
        deleteImages(res.post.content_links);

        // delete associated comments
        for (let i = 0; i < res.post.comments.length; i++) {
            Comment.findByIdAndDelete(res.post.comments[i]);
        }

        // delete post
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