// to verify that threads are populated in database and cache properly

const Thread = require('../models/thread.js');

const redisClient = require('../../cache/redis.js');
const { getForumThreadKey } = require('../cache/threadCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');
const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// check that all threads specified by threadIds exist in the database
async function verifyDBPopulatedThreads(threadIds) {
    const populatedThreads = await Thread.find(
        { _id: { $in: threadIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedThreads, threadIds);
}

// check that all forums specified by forumIds have a corresponding thread entry in the cache
async function verifyCachePopulatedThreads(forumIds) {
    const populatedThreads = await Promise.all(
        forumIds.map(forumId => redisClient.json.get(getForumThreadKey(forumId)))
    );

    expectEmpty(populatedThreads, false);
}

module.exports = {
    verifyDBPopulatedThreads,
    verifyCachePopulatedThreads
}