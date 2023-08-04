// functions used in blocking a user

const mongoose = require('mongoose');

const { User } = require('../models/user.js');
const Post = require('../../post/models/post.js');
const { Comment, PARENT_MODEL_POST } = require('../../comment/models/comment.js');

const compareId = require('../../utils/general/compareId.js');
const { cachedUserAddBlocked } = require('../cache/userBlockCache.js');
const updateParentCommentCount = require('../../comment/utils/updateParentCommentCount.js');

// handle blocking process for one user
async function handleBlockPerUser(self, targetUserId, isBlocker) {
    const user = new User(self);
    user.isNew = false;

    const blockEntry = {
        user_id: targetUserId,
        block_time: Date.now()
    };

    // if self is the blocker then add blocked_users entry
    if (isBlocker) {
        user.blocked_users.push(blockEntry);
    }

    // remove other user from followers list
    const followerIndex = user.followers.findIndex(user_id => compareId(user_id, targetUserId));

    if (followerIndex != -1) {
        user.followers.splice(followerIndex, 1);
    }

    // remove likes by self on the other user's posts
    const removePostLikes = Post.removePostReactionByUser(user._id, true, targetUserId);

    // remove save on other user's posts
    const removeSave = Post.removePostReactionByUser(user._id, false, targetUserId);

    // get list of posts created by self where there are comments by the target user
    // also get number of comments by that user for each post
    const agg = getAggFunction(self._id, targetUserId);
    const commentsPerPost = await Post.aggregate(agg);
    const postIds = commentsPerPost.map(entry => entry._id);

    // delete comments by the target user under posts by created by self
    const deleteComments = Comment.deleteAllSpecified(postIds, targetUserId, true);

    const bulkUpdatePost = [removePostLikes, removeSave];

    // update each post's comment_count for consistency after deleting
    commentsPerPost.forEach(entry => {
        bulkUpdatePost.push(updateParentCommentCount(PARENT_MODEL_POST, entry._id, false, true, entry.comment_count));
    });

    // update cache
    const cachePromises = await cachedUserAddBlocked(self._id, isBlocker, blockEntry, commentsPerPost, followerIndex);

    return { user, deleteComments, bulkUpdatePost, cachePromises }
}

// to get aggregation function to get 1. post ids for posts created by the given user, 2. number of comments posted by the other user under each post
function getAggFunction(selfId, targetUserId) {
    // get list of post id by self, where there are comments by the target user, and the number of comments by that user
    return [
        {
            '$match': {
                'comment_count': {
                    '$gt': 0
                },
                'creator_id': new mongoose.Types.ObjectId(selfId)
            }
        },
        {
            '$project': {
                '_id': 1
            }
        },
        {
            '$lookup': {
                'from': 'comments',
                'localField': '_id',
                'foreignField': 'parent_id',
                'as': 'comments',
                'pipeline': [
                    {
                        '$match': {
                            'creator_id': new mongoose.Types.ObjectId(targetUserId)
                        }
                    },
                    {
                        '$project': {
                            '_id': 1
                        }
                    }
                ]
            }
        },
        {
            '$project': {
                '_id': 1,
                'comment_count': {
                    '$size': [
                        '$comments'
                    ]
                }
            }
        }
    ];
}

module.exports = {
    handleBlockPerUser
}