// to verify if a user has comments on certain threads/posts

const Post = require("../../post/models/post.js");
const { Comment } = require("../models/comment.js");

const redisClient = require("../../cache/redis.js");
const {
  getPostCommentKey,
  getCommentByUserPath,
} = require("../cache/commentCache.js");
const expectEmpty = require("../../utils/test/expectEmpty.js");

// check database/cache records to determine if the user has commented on posts created by a user
async function verifyCommentedOnUserPost(
  commentOwnerId,
  postOwnerId,
  blocked,
  forDatabase,
) {
  const postIds = (await Post.find({ creator_id: postOwnerId }).lean()).map(
    (post) => post._id,
  );
  const comments = forDatabase
    ? await Comment.find({
        creator_id: commentOwnerId,
        parent_id: { $in: postIds },
      }).lean()
    : (
        await Promise.all(
          postIds.map((postId) =>
            redisClient.json.get(getPostCommentKey(postId), {
              path: getCommentByUserPath(commentOwnerId),
            }),
          ),
        )
      ).flat();

  expectEmpty(comments, blocked);
}

// check database to determine if the user has created any comments
async function verifyDBUserHasCreatedComments(userId, terminated) {
  expectEmpty(await Comment.find({ creator_id: userId }).lean(), terminated);
}

// check cache to determine if the user has created any comments
async function verifyCacheUserHasCreatedComments(userId, terminated) {
  const comments = [];

  for await (const key of redisClient.scanIterator({ MATCH: "comment:*" })) {
    comments.push(
      ...(await redisClient.json.get(key, {
        path: getCommentByUserPath(userId),
      })),
    );
  }

  expectEmpty(comments, terminated);
}

module.exports = {
  verifyCommentedOnUserPost,
  verifyDBUserHasCreatedComments,
  verifyCacheUserHasCreatedComments,
};
