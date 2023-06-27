// middleware to get a post based on post id in request URL

const Post = require('../../models/post.js');

// find post by id
const getPost = async (req, res, next) => {
    let target;

    try {
        // populate post data to get creator's username and profile pic link
        target = await Post.findById(req.params.postId).populate({ path: 'creator_id', select: 'username profile_pic_link'});
        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified post.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.post = target;
    next();
}

module.exports = {
    getPost,
}