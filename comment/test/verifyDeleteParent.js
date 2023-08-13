// to verify that comments under a certain deleted parent no longer exist in both database and cache

const { Comment, PARENT_MODEL_POST } = require("../models/comment.js");

const redisClient = require("../../cache/redis.js");
const {
  getPostCommentKey,
  getThreadCommentKey,
} = require("../cache/commentCache.js");

const expectEmpty = require("../../utils/test/expectEmpty.js");

// expect database query results to be null if parent is deleted and not null otherwise
async function verifyDBDeleteCommentParent(parentIds, deleted) {
  const filter = Array.isArray(parentIds)
    ? { parent_id: { $in: parentIds } }
    : { parent_id: parentIds };
  expectEmpty(await Comment.find(filter).lean(), deleted);
}

// expect cache entries to be null if parent is deleted and not null otherwise
async function verifyCacheDeleteCommentParent(parentIds, parentModel, deleted) {
  let result;
  if (Array.isArray(parentIds)) {
    result = await Promise.all(
      parentIds.map((parentId) =>
        redisClient.json.get(getCommentKey(parentId, parentModel)),
      ),
    );
  } else {
    result = await redisClient.json.get(getCommentKey(parentIds, parentModel));
  }

  expectEmpty(result, deleted);
}

module.exports = {
  verifyDBDeleteCommentParent,
  verifyCacheDeleteCommentParent,
};

// to generate comment cache key
function getCommentKey(parentId, parentModel) {
  return parentModel == PARENT_MODEL_POST
    ? getPostCommentKey(parentId)
    : getThreadCommentKey(parentId);
}
