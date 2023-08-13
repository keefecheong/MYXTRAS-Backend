// expected outcomes when a thread has been deleted

const Thread = require("../models/thread.js");

const redisClient = require("../../cache/redis.js");
const {
  getForumThreadKey,
  getThreadIdPath,
} = require("../cache/threadCache.js");

const sendMockRequest = require("../../utils/test/sendMockRequest.js");
const expectEqualValue = require("../../utils/test/expectEqualValue.js");
const expectEmpty = require("../../utils/test/expectEmpty.js");

// send request to delete thread and check that response is 200
async function deleteThread(forumId, threadId, creatorId) {
  const res = await sendMockRequest(
    `/api/threads/forum/${forumId}/thread/${threadId}`,
    creatorId,
    "delete",
  );

  expectEqualValue(res.status, 200);
}

// expect database query for the thread to be null if deleted and not null otherwise
async function verifyDBDeleteThread(threadIds, deleted) {
  const filter = Array.isArray(threadIds)
    ? { _id: { $in: threadIds } }
    : { _id: threadIds };
  expectEmpty(await Thread.find(filter).lean(), deleted);
}

// expect cache query for the thread to be null if deleted and not null otherwise
async function verifyCacheDeleteThread(forumId, threadId, deleted) {
  expectEmpty(
    await redisClient.json.get(getForumThreadKey(forumId), {
      path: getThreadIdPath(threadId),
    }),
    deleted,
  );
}

// check database to determine if the thread exists for a forum to be deleted
async function verifyDBDeleteThreadParent(forumIds, deleted) {
  const filter = Array.isArray(forumIds)
    ? { parent_id: { $in: forumIds } }
    : { parent_id: forumIds };
  expectEmpty(await Thread.find(filter).lean(), deleted);
}

// expect cache query for the thread key to be null if forum is deleted and not null otherwise
async function verifyCacheDeleteThreadParent(forumIds, deleted) {
  const threads = Array.isArray(forumIds)
    ? (
        await Promise.all(
          forumIds.map((forumId) =>
            redisClient.json.get(getForumThreadKey(forumId)),
          ),
        )
      )
        .flat()
        .filter((entry) => entry)
    : await redisClient.json.get(getForumThreadKey(forumIds));

  expectEmpty(threads, deleted);
}

module.exports = {
  deleteThread,
  verifyDBDeleteThread,
  verifyCacheDeleteThread,
  verifyDBDeleteThreadParent,
  verifyCacheDeleteThreadParent,
};
