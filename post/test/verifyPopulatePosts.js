// to verify that posts are populated in database and cache properly

const Post = require("../models/post.js");

const redisClient = require("../../cache/redis.js");
const { getUserPostKey } = require("../cache/postCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");
const expectEqualLengthResults = require("../../utils/test/expectEqualLengthResults.js");

// check that all posts specified by postIds exist in the database
function verifyDBPopulatedPosts(postIds) {
  return {
    title: "should add posts to database",
    callback: async () =>
      expectEqualLengthResults(
        await Post.find({ _id: { $in: postIds } }, { _id: 1 }).lean(),
        postIds,
      ),
    params: [postIds],
  };
}

// check that posts by all users specified by creatorIds exist in the cache
function verifyCachePopulatedPosts(creatorIds) {
  return {
    title: "should populate posts in cache",
    callback: async () =>
      expectEmpty(
        await Promise.all(
          creatorIds.map((creatorId) =>
            redisClient.json.get(getUserPostKey(creatorId)),
          ),
        ),
        false,
      ),
    params: [creatorIds],
  };
}

module.exports = {
  verifyDBPopulatedPosts,
  verifyCachePopulatedPosts,
};
