// controller functions to handle DELETE requests for posts

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnUnauthorizedReq = require("../../utils/returnReq/returnUnauthorizedReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");
const compareId = require("../../utils/general/compareId.js");

const deletePostUtil = require("../utils/deletePost.js");

// to delete a post
async function deletePost(req, res) {
  const userId = req.user._id;
  const postId = req.params.postId;

  // check if the creator of the post is the requesting user
  // if creator is not the requesting user return 401 error
  if (!compareId(userId, res.post.creator_id._id || res.post.creator_id)) {
    return returnUnauthorizedReq(res);
  }

  try {
    // delete post from cache and database
    await deletePostUtil(userId, postId, res.postFromCache);

    returnGoodReq(res, { message: "Post removed." });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  deletePost,
};
