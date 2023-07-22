// to terminate a user

const mongoose = require('mongoose');
const { User, USER_STATUS_TERMINATED } = require('../../models/user.js');
const Post = require('../../models/post.js');
const Forum = require('../../models/forum.js');
const Thread = require('../../models/thread.js');
const { Comment, PARENT_MODEL_POST } = require('../../models/comment.js');
const Chat = require('../../models/chat.js');
const updateParentCommentCount = require('../comments/updateParentCommentCount.js');
const { terminateCachedUser } = require('../../cache/users/userTerminateCache.js');

module.exports = async function terminateUser(user) {
    const targetUser = new User(user);
    targetUser.isNew = false;

    const targetUserId = targetUser._id;

    // set terminated status
    const terminatedStatus = {
        status: USER_STATUS_TERMINATED
    };

    targetUser.status = terminatedStatus;

    // clear followers and blocked_users fields
    targetUser.followers = [];
    targetUser.blocked_users = [];

    // updatedValues to update user record in cache
    const updatedValues = {
        status: terminatedStatus,
        followers: [],
        blocked_users: []
    }

    // remove targetUser from other users' followers and blocked_users arrays
    const bulkWriteUsers = [
        User.deleteFromArrayField(true, targetUserId, true),
        User.deleteFromArrayField(false, targetUserId, true)
    ];

    // delete created posts then store the various promises
    const deletePosts = await Post.deleteByUser(targetUserId);

    const bulkWritePosts = [deletePosts.deletePostsPromise];
    bulkWriteUsers.push(...(deletePosts.updateUserPromises));
    const bulkWriteComments = [deletePosts.updateCommentPromise];

    // remove likes by the user on all posts
    bulkWritePosts.push(Post.removePostReactionByUser(targetUserId, true));

    // remove user from saved_by on all posts
    bulkWritePosts.push(Post.removePostReactionByUser(targetUserId, false));

    // remove created forums then store the various promises
    const deleteForums = await Forum.deleteByUser(targetUserId);

    const bulkWriteForums = [deleteForums.deleteForumsPromise];
    const bulkWriteThreads = [deleteForums.deleteThreadsPromise];
    bulkWriteComments.push(deleteForums.updateCommentPromise);

    // remove subscribe status by the user
    bulkWriteForums.push(Forum.removeSubscriber(targetUserId));

    // remove created threads then store the various promises
    const deleteThreads = await Thread.deleteAllSpecified(null, targetUserId, true);

    bulkWriteThreads.push(deleteThreads.deleteThreadsPromise);
    bulkWriteComments.push(deleteThreads.updateCommentPromise);

    // remove likes and dislikes by the user on all threads
    bulkWriteThreads.push(Thread.removeThreadReactionByUser(targetUserId, true));
    bulkWriteThreads.push(Thread.removeThreadReactionByUser(targetUserId, false));

    // delete all comments created by the user
    bulkWriteComments.push(Comment.deleteAllSpecified(null, targetUserId, true));

    // update comment_count for posts/threads
    const agg = getAggFunction(targetUserId);
    const commentsPerParent = await Comment.aggregate(agg);
    commentsPerParent.forEach(entry => {
        const promise = updateParentCommentCount(entry.parent_model, entry._id, false, true, entry.count);
        
        if (entry.parent_model == PARENT_MODEL_POST) {
            bulkWritePosts.push(promise);
        }
        else {
            bulkWriteThreads.push(promise);
        }
    });

    // delete all chats enrolled and their associated messages
    const { deleteChatsPromise, cleanUpMessages } = await Chat.deleteByUser(targetUserId);

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
        cleanUpMessages
    ];

    return Promise.all(promises);
}

// get aggregation function to get number of comments per post or thread created by the target user
function getAggFunction(userId) {
    return [
        {
            '$match': {
                'creator_id': new mongoose.Types.ObjectId(userId)
            }
        },
        {
            '$group': {
                '_id': '$parent_id', 
                'count': {
                    '$count': {}
                }, 
                'parent_model': {
                    '$first': '$parent_model'
                }
            }
        },
        {
            '$lookup': {
                'from': 'threads',
                'localField': '_id',
                'foreignField': '_id',
                'as': 'thread',
                'pipeline': [
                    {
                        '$project': {
                            '_id': 0,
                            'parent_id': 1
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'posts',
                'localField': '_id',
                'foreignField': '_id',
                'as': 'post',
                'pipeline': [
                    {
                        '$project': {
                            '_id': 0,
                            'creator_id': 1
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                '_id': 1,
                'count': 1,
                'parent_model': 1,
                'key_creation_id': {
                    '$cond': {
                        'if': {
                            '$eq': [ '$parent_model', PARENT_MODEL_POST ]
                        },
                        'then': {
                            '$arrayElemAt': [ '$post.creator_id', 0 ]
                        },
                        'else': {
                            '$arrayElemAt': ['$thread.parent_id', 0 ]
                        }
                    }
                }
            }
        }
    ];
}