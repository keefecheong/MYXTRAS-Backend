// to verify that users are populated in database and cache

const { User } = require("../models/user.js");

const redisClient = require("../../cache/redis.js");
const { getUserKey } = require("../cache/userCache");

const expectEmpty = require("../../utils/test/expectEmpty.js");
const expectEqualLengthResults = require("../../utils/test/expectEqualLengthResults.js");

// to verify that all users specified in userIds are added to the database
function verifyDBPopulatedUsers(userIds) {
  return {
    title: "should add users to database",
    callback: async () =>
      expectEqualLengthResults(
        await User.find({ _id: { $in: userIds } }, { _id: 1 }).lean(),
        userIds,
      ),
    params: [userIds],
  };
}

// to verify that all users specified in userIds have been added to the cache
function verifyCachePopulatedUsers(userIds) {
  return {
    title: "should populate users in cache",
    callback: async () =>
      expectEmpty(
        await Promise.all(
          userIds.map((userId) => redisClient.json.get(getUserKey(userId))),
        ),
        false,
      ),
    params: [userIds],
  };
}

module.exports = {
  verifyDBPopulatedUsers,
  verifyCachePopulatedUsers,
};
