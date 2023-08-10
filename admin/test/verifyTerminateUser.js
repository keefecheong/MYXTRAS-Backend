// expected outcomes upon terminating a user

const { User, USER_STATUS_TERMINATED } = require('../../user/models/user.js');

const redisClient = require('../../cache/redis.js');
const { getUserKey } = require('../../user/cache/userCache.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const expectEqualValue = require('../../utils/test/expectEqualValue.js');

// to send request to terminate user and check that the response is 200
async function terminateUser(terminatedUserId, adminId) {
    const res = await sendMockRequest(`/api/admin/accounts/terminate/${terminatedUserId}`, adminId, 'post');

    expectEqualValue(res.status, 200);
}

// check database record to determine if user's status is terminated
async function verifyDBUserTerminated(userId, terminated) {
    expectEqualValue((await User.findById(userId).lean()).status?.status, terminated ? USER_STATUS_TERMINATED : undefined);
}

// check cache entry to determine if user's status is terminated
async function verifyCacheUserTerminated(userId, terminated) {
    expectEqualValue(await redisClient.json.get(getUserKey(userId), { path: '$.status.status'}), terminated ? USER_STATUS_TERMINATED : null);
}

module.exports = {
    terminateUser,
    verifyDBUserTerminated,
    verifyCacheUserTerminated
}