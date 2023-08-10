// to check if a user has liked/disliked a thread by another user

const Thread = require('../models/thread.js');

const redisClient = require('../../cache/redis.js');
const { THREAD_FORUM_KEY_BASE, getThreadLikesPath, getThreadDislikesPath } = require('../cache/threadCache.js');

const expectEmpty = require('../../utils/test/expectEmpty.js');

// check database to determine if user has liked/disliked threads created by other users
async function verifyDBUserReactedToOtherThreads(userId, terminated, forLikes) {
    const filter = { creator_id: { $ne: userId } };
    const subFilter = { $in: [userId] };
    forLikes ? filter.likes = subFilter : filter.dislikes = subFilter;

    expectEmpty(await Thread.find(filter).lean(), terminated);
}

// check cache to determine if user has liked/disliked threads created by other users
async function verifyCacheUserReactedToOtherThreads(userId, terminated, forLikes) {
    var reactedThreads = [];

    for await (const key of redisClient.scanIterator({ MATCH: `${THREAD_FORUM_KEY_BASE}:*` })) {
        reactedThreads.push(await redisClient.json.get(key, { path: forLikes ? getThreadLikesPath(userId) : getThreadDislikesPath(userId) }));
    }

    reactedThreads = reactedThreads.flat().filter(entry => entry);

    expectEmpty(reactedThreads, terminated);
}

module.exports = {
    verifyDBUserReactedToOtherThreads,
    verifyCacheUserReactedToOtherThreads
}