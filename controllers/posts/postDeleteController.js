// controller functions to handle DELETE requests for posts

const Post = require('../../models/post.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');

const { getUserPostKey } = require('../../cache/posts/postCache.js');
const { deleteCachedPost } = require('../../cache/posts/postDeleteCache.js');

// to delete a post
async function deletePost(req, res) {
    const userId = req.user._id;
    const postId = req.params.postId;

    // check if the creator of the post is the requesting user
    // if creator is not the requesting user return 401 error
    if (!compareId(userId, res.post.creator_id._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // if post is in cache then update both cache and database immediately
        if (res.postFromCache) {
            await deleteCachedPost(getUserPostKey(userId), res.postIndex, postId);
        }
        // otherwise delete post from database immediately
        else {
            await Post.findByIdAndDelete(postId);
        }

        returnGoodReq(res, { message: 'Post removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deletePost
}