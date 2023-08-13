// middleware to get a comment

const { Comment, PARENT_MODEL_POST } = require("../models/comment.js");

const returnNotFoundReq = require("../../utils/returnReq/returnNotFoundReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const {
  getOneCommentFromCache,
  getPostCommentKey,
  getThreadCommentKey,
} = require("../cache/commentCache.js");

async function getComment(req, res, next, type) {
  const forPost = type == PARENT_MODEL_POST;

  let target = null;

  try {
    const commentId = req.params.commentId;
    const parentId = forPost ? res.post._id : res.thread._id;

    const key = forPost
      ? getPostCommentKey(parentId)
      : getThreadCommentKey(parentId);

    // attempt to get comment from cache
    const result = await getOneCommentFromCache(key, commentId);

    const commentRetrieved = result != null;

    res.commentFromCache = commentRetrieved;

    // if retrieval is successful then set target as retrieved comment
    if (commentRetrieved) {
      target = result[0];
    } else {
      // if comment is not found from cache then retrieve from database
      target = await Comment.findOne({
        _id: commentId,
        parent_id: parentId,
      }).lean();
    }

    // if target is still null means the comment does not exist, return 404 error
    if (!target) {
      return returnNotFoundReq(res);
    }
  } catch (error) {
    return returnServerErrorReq(res);
  }

  res.comment = target;
  next();
}

module.exports = {
  getComment,
};
