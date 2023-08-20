// to terminate a user

const { User, USER_STATUS_TERMINATED } = require("../../../user/models/user.js");
const Post = require("../../../post/models/post.js");
const Forum = require("../../../forum/models/forum.js");
const Thread = require("../../../thread/models/thread.js");
const {
  Comment,
  PARENT_MODEL_POST,
} = require("../../../comment/models/comment.js");
const Chat = require("../../../chat/models/chat.js");

const updateParentCommentCount = require("../../../comment/utils/updateParentCommentCount.js");
const {
  terminateCachedUser,
} = require("../../../user/cache/userTerminateCache.js");

const { getCommentsPerParentAgg } = require("../../../report/utils/getAggFunction.js");

module.exports = async function terminateUserUtil(user, adminId) {
  const targetUser = new User(user);
  targetUser.isNew = false;

  const targetUserId = targetUser._id;

  // set terminated status
  const terminatedStatus = {
    status: USER_STATUS_TERMINATED,
    performed_by: adminId,
  };

  targetUser.status = terminatedStatus;

  // clear followers and blocked_users fields
  targetUser.followers = [];
  targetUser.blocked_users = [];

  // updatedValues to update user record in cache
  const updatedValues = {
    status: terminatedStatus,
    followers: [],
    blocked_users: [],
  };

  // remove targetUser from other users' followers and blocked_users arrays
  const bulkWriteUsers = [
    User.deleteFromArrayField(true, targetUserId, true),
    User.deleteFromArrayField(false, targetUserId, true),
  ];

  // delete created posts then store the various promises
  const deletePosts = await Post.deleteByUser(targetUserId);

  const bulkWritePosts = [deletePosts.deletePostsPromise];
  const bulkWriteComments = [deletePosts.deleteCommentsPromise];

  // remove likes by the user on all posts
  bulkWritePosts.push(Post.removePostReactionByUser(targetUserId, true));

  // remove user from saved_by on all posts
  bulkWritePosts.push(Post.removePostReactionByUser(targetUserId, false));

  // remove created forums then store the various promises
  const deleteForums = await Forum.deleteByUser(targetUserId);

  const bulkWriteForums = [deleteForums.deleteForumsPromise];
  const bulkWriteThreads = [deleteForums.deleteThreadsPromise];
  bulkWriteComments.push(deleteForums.deleteCommentsPromise);

  // remove subscribe status by the user
  bulkWriteForums.push(Forum.removeSubscriber(targetUserId));

  // remove created threads then store the various promises
  const deleteThreads = await Thread.deleteAllSpecified(
    null,
    targetUserId,
    true,
  );

  bulkWriteThreads.push(deleteThreads.deleteThreadsPromise);
  bulkWriteComments.push(deleteThreads.deleteCommentsPromise);

  // remove likes and dislikes by the user on all threads
  bulkWriteThreads.push(Thread.removeThreadReactionByUser(targetUserId, true));
  bulkWriteThreads.push(Thread.removeThreadReactionByUser(targetUserId, false));

  // delete all comments created by the user
  bulkWriteComments.push(Comment.deleteAllSpecified(null, targetUserId, true));

  // update comment_count for posts/threads
  const agg = getCommentsPerParentAgg(targetUserId);
  const commentsPerParent = await Comment.aggregate(agg);
  commentsPerParent.forEach((entry) => {
    const promise = updateParentCommentCount(
      entry.parent_model,
      entry._id,
      false,
      true,
      entry.count,
    );

    if (entry.parent_model == PARENT_MODEL_POST) {
      bulkWritePosts.push(promise);
    } else {
      bulkWriteThreads.push(promise);
    }
  });

  // delete all chats enrolled and their associated messages
  const { deleteChatsPromise, cleanUpMessages } = await Chat.deleteByUser(
    targetUserId,
  );

  // execute all
  const promises = [
    terminateCachedUser(targetUserId, updatedValues, commentsPerParent),
    targetUser.save(),
    User.bulkWrite(bulkWriteUsers),
    Post.bulkWrite(bulkWritePosts),
    Forum.bulkWrite(bulkWriteForums),
    Thread.bulkWrite(bulkWriteThreads),
    Comment.bulkWrite(bulkWriteComments),
    deleteChatsPromise,
    cleanUpMessages,
  ];

  return Promise.all(promises);
};
