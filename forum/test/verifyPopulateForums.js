// to verify that forums are populated in database and cache properly

const Forum = require('../models/forum.js');

const redisClient = require('../../cache/redis.js');
const { getForumKey } = require('../cache/forumCache');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all forums specified by forumIds exist in the database
function verifyDBPopulatedForums(forumIds) {
    return {
        title: 'should add forums to database',
        callback: async () => expectEqualLengthResults(await Forum.find(
            { _id: { $in: forumIds } },
            { _id: 1 }
        ).lean(), forumIds),
        params: [forumIds]
    };
}

// check that all forums specified by forumIds exist in cache
function verifyCachePopulatedForums(forumIds) {
    return {
        title: 'should populate forums in cache',
        callback: async () => expectEmpty(await Promise.all(
            forumIds.map(
                forumId => redisClient.json.get(getForumKey(forumId))
            )
        ), false),
        params: [forumIds]
    };
}

module.exports = {
    verifyDBPopulatedForums,
    verifyCachePopulatedForums
}