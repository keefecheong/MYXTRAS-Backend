// middleware to get a post based on post id in request URL

const Post = require('../../models/post.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// find post by id
async function getPost(req, res, next) {
    let target;
    
    try {
        // populate post data to get creator's username and profile pic link
        target = await Post.findById(req.params.postId).getCreator();

        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.post = target;
    next();
}

module.exports = {
    getPost,
}