// expected outcomes when a forum has been deleted

const Forum = require('../models/forum.js');

const redisClient = require('../../cache/redis.js');
const { getForumKey, getCreatedForumKey, getForumIdPath } = require('../cache/forumCache.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const expectEqualValue = require('../../utils/test/expectEqualValue.js');
const expectEmpty = require('../../utils/test/expectEmpty.js');

// send request to delete forum and check that response is 200
async function deleteForum(forumId, creatorId) {
    const res = await sendMockRequest(`/api/forums/${forumId}`, creatorId, 'delete');

    expectEqualValue(res.status, 200);
}

// expect database query for the forum to be null if deleted and not null otherwise
async function verifyDBDeleteForum(forumId, deleted) {
    expectEmpty(await Forum.findById(forumId), deleted);
}

// expect cache query for the forum to be null if deleted and not null otherwise
// expect cache query for the forum in the user's created forums to be null if deleted and not null otherwise
async function verifyCacheDeleteForum(forumId, creatorId, deleted) {
    expectEmpty(await redisClient.json.get(getForumKey(forumId)), deleted);
    expectEmpty(await redisClient.json.get(getCreatedForumKey(creatorId), { path: getForumIdPath(forumId) }), deleted);
}

module.exports = {
    deleteForum,
    verifyDBDeleteForum,
    verifyCacheDeleteForum
}