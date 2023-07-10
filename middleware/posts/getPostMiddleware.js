// middleware to get a post based on post id in request URL

const Post = require('../../models/post.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getUserPostKey, getPostFromCache } = require('../../cache/posts/postCache.js');

// find post by id
async function getPost(req, res, next) {
    const userId = req.user._id;
    const postId = req.params.postId;
    let target = null;
    
    try {
        // attempt to get post from cache
        const result = await getPostFromCache(getUserPostKey(userId), postId);

        // if retrieval is successful then set target as retrieved post
        if (result.success) {
            target = result.post;

            // set postFromCache to indicate the post is retrieved from cache
            res.postFromCache = true;
            res.postIndex = result.postIndex;
        }
        else {
            // if error is not produced because post is not found in cache return 500 error
            if (result.error != "ERR Path '$' does not exist") {
                return returnServerErrorReq(res);
            }

            // if post not found from cache then retrieve from database
            target = await Post.findById(postId).lean();

            // set postFromCache to indicate the post is not retrieved from cache
            res.postFromCache = false;
        }
        
        // if target still null means post does not exist, return 404 error
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
    getPost
}