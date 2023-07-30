// controller functions to handle actions for comments under posts

const { User } = require('../../models/user.js');
const { Comment, PARENT_MODEL_POST } = require('../../models/comment.js');
const { REPORT_TARGET_TYPE_POST_COMMENT } = require('../../models/report.js');

const { checkCommentAttributesAll } = require('../../utils/comments/checkAttributes.js');
const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnUnauthorizedReq = require('../../utils/general/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const checkBlocked = require('../../utils/users/checkBlocked.js');

const { getUserPostKey } = require('../../cache/posts/postCache.js');
const { getPostCommentKey } = require('../../cache/comments/commentCache.js');
const { cacheNewComment } = require('../../cache/comments/commentUpdateCache.js');
const deleteCommentUtil = require('../../utils/comments/deleteComment.js');

const updateUserTasks = require('../../utils/gamification/updateUserTasks.js');

const moderateText = require('../../utils/admin/moderation/moderateText.js');
const { createReportAfterModeration } = require('../../utils/report/createReport.js');

// retrieve all comments for a post
async function getComments(req, res) {
    try {
        const post = res.post;
        const userId = req.user._id;

        // check if either the creator or requesting user has blocked each other
        const blocked = checkBlocked(post.creator_id._id, post.creator_id.blocked_users, userId, req.user.blocked_users);
    
        if (blocked) {
            return returnBadReq(res, 'Could not comment under this post.');
        }

        const postComments = await Comment.commonQuery({
            parent_id: post._id
        }, null, true, {
            key: getPostCommentKey(post._id)
        });

        const comments = checkCommentAttributesAll(postComments, userId);

        returnGoodReq(res, comments);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// create a comment and update the post's comments field
async function postComment(req, res) {
    const post = res.post;
    const postCreatorId = post.creator_id._id;
    const postId = post._id;

    var creator = req.user;
    const creatorId = creator._id;

    // check if comments are enabled on the requested post
    // if enabled, continue to create comment
    // otherwise return 400 error
    if (!post.comments_enabled) {
        return returnBadReq(res, 'Comments are disabled for this post.');
    }

    // check if content is provided in the body
    // if provided, continue to create comment
    // otherwise return 400 error
    if (!req.body.content) {
        return returnBadReq(res, 'Comment content is required.');
    }

    creator = new User(creator);
    creator.isNew = false;

    // create new comment
    const comment = new Comment({
        creator_id: creatorId,
        content: req.body.content,
        creation_time: Date.now(),
        parent_id: postId,
        parent_model: PARENT_MODEL_POST
    });

    try {
        const userDetails = {
            _id: creatorId,
            username: creator.username,
            profile_pic_link: creator.profile_pic_link
        }

        const jsonComment = comment.toObject();
        jsonComment.creator_id = userDetails;
    
        delete jsonComment.parent_id;
        delete jsonComment.parent_model;

        // moderate comment content
        createReportAfterModeration(moderateText(comment.content), comment._id, REPORT_TARGET_TYPE_POST_COMMENT, creatorId, { creatorId: postCreatorId, postId });

        // store new comment in cache if key exists or update database otherwise
        const updateCacheResult = await cacheNewComment(true, jsonComment, res.postFromCache, getUserPostKey(postCreatorId), postId);

        await saveDocAsync(comment, updateCacheResult);

        jsonComment.isOwner = true;

        // update user tasks
        await updateUserTasks(creator, 'Create a comment');

        returnGoodReq(res, { message: 'Comment created.', comment: jsonComment });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete a comment and update the post's comments field
async function deleteComment(req, res) {
    // check if the comment is posted by the requesting user
    // if creator is not the requesting user return 401 error
    if (!compareId(res.comment.creator_id._id, req.user._id)) {
        return returnUnauthorizedReq(res);
    }

    try {
        // delete comment from cache and database
        await deleteCommentUtil(true, req.params.commentId, res.commentFromCache, res.postFromCache, getUserPostKey(res.post.creator_id._id), res.post._id);

        returnGoodReq(res, { message: 'Comment removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getComments,
    postComment,
    deleteComment
}