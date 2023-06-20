// controller functions to handle DELETE requests for posts

const Post = require('../../models/post.js');
const Comment = require('../../models/comment.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

const deletePost = async (req, res) => {
    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.post.creator_id._id)) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        // delete associated images
        deleteFiles(res.post.content_links);

        // delete associated comments
        Comment.deleteMany({ post_id: res.post._id }).catch(error => console.log(error));

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