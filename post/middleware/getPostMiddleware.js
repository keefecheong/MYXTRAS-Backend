// middleware to get a post based on post id in request URL

const Post = require("../models/post.js");

const returnNotFoundReq = require("../../utils/returnReq/returnNotFoundReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const { getOnePostFromCache } = require("../cache/postCache.js");

// find post by id
async function getPost(req, res, next) {
  const userId = req.params.userId;
  const postId = req.params.postId;
  let target = null;

  try {
    // attempt to get post from cache
    const result = await getOnePostFromCache(userId, postId);

    const postRetrieved = result != null;

    res.postFromCache = postRetrieved;

    // if retrieval is successful then set target as retrieved post
    if (postRetrieved) {
      target = result[0];
    } else {
      // if post not found from cache then retrieve from database
      target = await Post.findOne({ _id: postId, creator_id: userId })
        .getCreator()
        .lean();
    }

    // if target still null means post does not exist, return 404 error
    if (!target) {
      return returnNotFoundReq(res);
    }
  } catch (error) {
    return returnServerErrorReq(res);
  }

  res.post = target;
  next();
}

module.exports = {
  getPost,
};
