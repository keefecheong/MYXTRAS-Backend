// expected outcomes upon blocking a user

const { User } = require("../models/user.js");

const redisClient = require("../../cache/redis.js");
const {
  USER_SINGLE_KEY_BASE,
  getUserKey,
  getBlockedPath,
} = require("../cache/userCache.js");

const { expect } = require("chai");
const sendMockRequest = require("../../utils/test/sendMockRequest.js");
const expectEqualValue = require("../../utils/test/expectEqualValue.js");
const expectEmpty = require("../../utils/test/expectEmpty.js");

const compareId = require("../../utils/general/compareId.js");

// to send request to block user and check that the response is 200
async function blockUser(blockerId, blockedId) {
  const res = await sendMockRequest(
    `/api/users/${blockedId}/block`,
    blockerId,
    "post",
  );

  expectEqualValue(res.status, 200);
}

// expect database record of blocking user's blocked_users to not contain the blocked user's id before blocking and vice-versa
async function verifyDBBlockUser(blockerId, blockedId, blocked) {
  const blockedEntryExists = (
    await User.findById(blockerId).lean()
  ).blocked_users.some((entry) => compareId(entry.user_id, blockedId));

  expect(blockedEntryExists).to.be.equal(blocked);
}

// expect cache entry of blocking user's blocked_users to not contain the blocked user's id before blocking and vice-versa
async function verifyCacheBlockUser(blockerId, blockedId, blocked) {
  expectEmpty(
    await redisClient.json.get(getUserKey(blockerId), {
      path: getBlockedPath(blockedId),
    }),
    !blocked,
  );
}

// check database record to determine if a user is blocking any user
async function verifyDBUserIsBlockingAny(userId, terminated) {
  expectEmpty((await User.findById(userId).lean()).blocked_users, terminated);
}

// check cache entry to determine if a user is blocking any user
async function verifyCacheUserIsBlockingAny(userId, terminated) {
  expectEmpty(
    (
      await redisClient.json.get(getUserKey(userId), {
        path: "$.blocked_users",
      })
    ).flat(),
    terminated,
  );
}

// check database record to determine if a user is blocked by any user
async function verifyDBUserIsBlockedByAny(userId, terminated) {
  expectEmpty(
    await User.find({ "blocked_users.user_id": { $in: [userId] } }),
    terminated,
  );
}

// check cache entry to determine if a user is blocked by any user
async function verifyCacheUserIsBlockedByAny(userId, terminated) {
  const blockedBy = [];

  for await (const key of redisClient.scanIterator({
    MATCH: `${USER_SINGLE_KEY_BASE}:*`,
  })) {
    const user = await redisClient.json.get(key);

    if (user.blocked_users.some((entry) => compareId(entry.user_id, userId))) {
      blockedBy.push(key);
    }
  }

  expectEmpty(blockedBy, terminated);
}

module.exports = {
  blockUser,
  verifyDBBlockUser,
  verifyCacheBlockUser,
  verifyDBUserIsBlockingAny,
  verifyCacheUserIsBlockingAny,
  verifyDBUserIsBlockedByAny,
  verifyCacheUserIsBlockedByAny,
};
