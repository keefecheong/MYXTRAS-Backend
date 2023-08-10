// to check if a user has any created forums

const Forum = require('../models/forum.js');

const redisClient = require('../../cache/redis.js');
const { FORUM_SINGLE_KEY_BASE } = require('../cache/forumCache');

const expectEmpty = require('../../utils/test/expectEmpty.js');

const compareId = require('../../utils/general/compareId.js');

// check database records to determine if the user has created any forums
async function verifyDBUserHasCreatedForums(userId, terminated) {
    expectEmpty(await Forum.find({ creator_id: userId }).lean(), terminated);
}

// check cache entry to determine if the user has created any forums
async function verifyCacheUserHasCreatedForums(userId, terminated) {
    const created = [];

    for await (const key of redisClient.scanIterator({ MATCH: `${FORUM_SINGLE_KEY_BASE}:*` })) {
        if (compareId(await redisClient.json.get(key, { path: '$.creator_id' }), userId)) {
            created.push(key);
        }
    }

    expectEmpty(created, terminated);
}

module.exports = {
    verifyDBUserHasCreatedForums,
    verifyCacheUserHasCreatedForums
}