// expected outcomes when a thread has been deleted

const Thread = require('../models/thread.js');

const redisClient = require('../../cache/redis.js');
const { getForumThreadKey, getThreadIdPath } = require('../cache/threadCache.js');

const sendMockRequest = require('../../utils/test/sendMockRequest.js');
const expectEqualValue = require('../../utils/test/expectEqualValue.js');
const expectEmpty = require('../../utils/test/expectEmpty.js');

// send request to delete thread and check that response is 200
async function deleteThread(forumId, threadId, creatorId) {
    const res = await sendMockRequest(`/api/threads/forum/${forumId}/thread/${threadId}`, creatorId, 'delete');

    expectEqualValue(res.status, 200);
}

// expect database query for the thread to be null if deleted and not null otherwise
async function verifyDBDeleteThread(threadId, deleted) {
    expectEmpty(await Thread.findById(threadId), deleted);
}

// expect cache query for the thread to be null if deleted and not null otherwise
async function verifyCacheDeleteThread(forumId, threadId, deleted) {
    expectEmpty(await redisClient.json.get(getForumThreadKey(forumId), { path: getThreadIdPath(threadId) }), deleted);
}

module.exports = {
    deleteThread,
    verifyDBDeleteThread,
    verifyCacheDeleteThread
}