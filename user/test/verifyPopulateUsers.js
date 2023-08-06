// to verify that users are populated in database and cache

const { User } = require('../models/user.js');

const redisClient = require('../../cache/redis.js');
const { getUserKey } = require('../cache/userCache');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// to verify that all users specified in userIds are added to the database
async function verifyDBPopulatedUsers(userIds) {
    const populatedUsers = await User.find(
        { _id: { $in: userIds } }, 
        { _id: 1 }
    ).lean();
    
    expectEqualLengthResults(populatedUsers, userIds);
}

// to verify that all users specified in userIds have been added to the cache
async function verifyCachePopulatedUsers(userIds) {
    const populatedUsers = await Promise.all(
        userIds.map(
            userId => redisClient.json.get(getUserKey(userId))
        )
    );

    expectEmpty(populatedUsers, false);
}

module.exports = {
    verifyDBPopulatedUsers,
    verifyCachePopulatedUsers
}