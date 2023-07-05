// controller functions to handle DELETE requests for posts

const Post = require('../../models/post.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

async function deletePost(req, res) {
    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!req.user._id.equals(res.post.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        await Post.findByIdAndDelete(req.params.postId);
        returnGoodReq(res, { message: 'Post removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deletePost
}