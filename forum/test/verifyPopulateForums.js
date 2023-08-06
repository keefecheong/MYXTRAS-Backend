// to verify that forums are populated in database and cache properly

const Forum = require('../models/forum.js');

const redisClient = require('../../cache/redis.js');
const { getForumKey } = require('../cache/forumCache');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all forums specified by forumIds exist in the database
async function verifyDBPopulatedForums(forumIds) {
    const populatedForums = await Forum.find(
        { _id: { $in: forumIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedForums, forumIds);
}

// check that all forums specified by forumIds exist in cache
async function verifyCachePopulatedForums(forumIds) {
    const populatedForums = await Promise.all(
        forumIds.map(forumId => redisClient.json.get(getForumKey(forumId)))
    );

    expectEmpty(populatedForums, false);
}

module.exports = {
    verifyDBPopulatedForums,
    verifyCachePopulatedForums
}