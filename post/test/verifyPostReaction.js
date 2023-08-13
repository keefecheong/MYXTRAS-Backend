// to verify like status by users on posts

const Post = require("../models/post.js");

const redisClient = require("../../cache/redis.js");
const {
  POST_USER_KEY_BASE,
  getUserPostKey,
  getPostLikesPath,
  getPostSavesPath,
} = require("../cache/postCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");

const compareId = require("../../utils/general/compareId.js");

// check database records to determine if user1 has liked/saved the posts created by user2
async function verifyDBUserReactedToUserPosts(
  reactingUserId,
  postOwnerId,
  blocked,
  forLikes,
) {
  const posts = await Post.find({ creator_id: postOwnerId }).lean();
  var reacted = forLikes
    ? posts.map((post) =>
        post.likes.some((likeId) => compareId(likeId, reactingUserId)),
      )
    : posts.map((post) =>
        post.saved_by.some((saveId) => compareId(saveId, reactingUserId)),
      );

  reacted = reacted.filter((entry) => entry);

  expectEmpty(reacted, blocked);
}

// check cache entry to determine if user1 has liked/saved the posts created by user2
async function verifyCacheUserReactedToUserPosts(
  reactingUserId,
  postOwnerId,
  blocked,
  forLikes,
) {
  const path = forLikes
    ? getPostLikesPath(reactingUserId)
    : getPostSavesPath(reactingUserId);
  const reacted = await redisClient.json.get(getUserPostKey(postOwnerId), {
    path,
  });

  expectEmpty(reacted, blocked);
}

// check database records to determine if a user has liked/saved any posts created by any other users
async function verifyDBUserReactedToOtherPosts(userId, terminated, forLikes) {
  const filter = {
    creator_id: { $ne: userId },
  };

  const reactionFilter = { $in: [userId] };

  forLikes
    ? (filter.likes = reactionFilter)
    : (filter.saved_by = reactionFilter);

  expectEmpty(await Post.find(filter).lean(), terminated);
}

// check cache entry to determine if a user has liked/saved any posts created by any other users
async function verifyCacheUserReactedToOtherPosts(
  userId,
  terminated,
  forLikes,
) {
  var reacted = [];
  const path = forLikes ? getPostLikesPath(userId) : getPostSavesPath(userId);

  for await (const key of redisClient.scanIterator({
    MATCH: `${POST_USER_KEY_BASE}:*`,
  })) {
    reacted.push(...(await redisClient.json.get(key, { path })));
  }

  reacted = reacted.filter((entry) => entry);

  expectEmpty(reacted, terminated);
}

module.exports = {
  verifyDBUserReactedToUserPosts,
  verifyCacheUserReactedToUserPosts,
  verifyDBUserReactedToOtherPosts,
  verifyCacheUserReactedToOtherPosts,
};
