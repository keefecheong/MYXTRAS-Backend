// middleware to get a post based on post id in request URL

const Post = require('../../models/post.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getPostFromCache } = require('../../cache/posts/postCache.js');

// find post by id
async function getPost(req, res, next) {
    const userId = req.params.userId;
    const postId = req.params.postId;
    let target = null;
    
    try {
        // attempt to get post from cache
        const result = await getPostFromCache(userId, postId);

        const postRetrieved = result != null;

        res.postFromCache = postRetrieved;

        // if retrieval is successful then set target as retrieved post
        if (postRetrieved) {
            target = result[0];
        }
        else {
            // if post not found from cache then retrieve from database
            target = await Post.findById(postId).lean();
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