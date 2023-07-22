// controller functions to resolve reports

const { 
    Report,
    REPORT_REASONS,
    REPORT_STATUS_FAILED,
    REPORT_STATUS_SUCCESS,
    REPORT_TARGET_TYPES,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_FORUM,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE,
    REPORT_TARGET_TYPE_POST_COMMENT,
    REPORT_TARGET_TYPE_THREAD_COMMENT,
    REPORT_TARGET_TYPE_USER
} = require('../../models/report.js');

const { USER_STATUS_SUSPENDED, USER_STATUSES } = require('../../models/user.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getUserPostKey } = require('../../cache/posts/postCache.js');
const { getForumThreadKey } = require('../../cache/threads/threadCache.js');

const warnUser = require('../../utils/report/warnUser.js');
const suspendUser = require('../../utils/report/suspendUser.js');
const terminateUser = require('../../utils/report/terminateUser.js');

const deletePostUtil = require('../../utils/posts/deletePost.js');
const deleteForumUtil = require('../../utils/forums/deleteForum.js');
const deleteThreadUtil = require('../../utils/threads/deleteThread.js');
const deleteCommentUtil = require('../../utils/comments/deleteComment.js');
const deleteMessageUtil = require('../../utils/chats/deleteMessage.js');

// no further action required (invalid report)
async function reportFailed(req, res) {
    try {
        // update all reports for the specified objectId that have not been reviewed
        // set status as failed
        await Report.resolveReport(req.params.objectId, REPORT_STATUS_FAILED, req.user._id, Date.now());

        returnGoodReq(res, { message: 'Report reviewed successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// delete associated object
async function reportSuccess(req, res, type, reportTargetId, userAction) {
    try {
        // return 400 error if provided reason is invalid
        if (!REPORT_REASONS.includes(req.body?.reason)) {
            return returnBadReq(res, 'Invalid report reason');
        }

        const validTypes = [REPORT_TARGET_TYPE_POST_COMMENT, REPORT_TARGET_TYPE_THREAD_COMMENT].concat(REPORT_TARGET_TYPES);

        // return 400 error if type is invalid
        if (!validTypes.includes(type)) {
            return returnBadReq(res, 'Invalid report type.');
        }

        // return 400 error if userAction is provided but invalid
        if (userAction && !USER_STATUSES.includes(userAction)) {
            return returnBadReq(res, 'Invalid action.');
        }
        // return 400 error if userAction is to suspend user but duration is invalid
        else if (userAction && userAction == USER_STATUS_SUSPENDED) {
            if (!req.body?.duration || isNaN(req.body.duration)) {
                return returnBadReq(res, 'Invalid suspend duration.');
            }
        }

        const now = Date.now();

        // create warning to add to user's warnings list
        const warning = {
            object_id: reportTargetId,
            object_type: (type == REPORT_TARGET_TYPE_POST_COMMENT || type == REPORT_TARGET_TYPE_THREAD_COMMENT) ? REPORT_TARGET_TYPE_COMMENT : type,
            reason: req.body.reason,
            review_time: now
        }

        // as default always issue warning to user and resolve report
        const promises = [
            Report.resolveReport(reportTargetId, REPORT_STATUS_SUCCESS, req.user._id, now)
        ];

        let creatorId;

        // resolve report and perform necessary action
        // also get the creator of the reported object
        switch (type) {
            // suspend or terminate user based on userAction
            case REPORT_TARGET_TYPE_USER:
                if (userAction == USER_STATUS_SUSPENDED) {
                    const endTime = now + parseInt(req.body.duration);
                    promises.push(suspendUser(true, res.user, endTime));
                }
                else {
                    promises.push(terminateUser(res.user));
                }

                creatorId = req.params.userId;

                break;

            // delete post
            case REPORT_TARGET_TYPE_POST:
                promises.push(deletePostUtil(req.params.userId, req.params.postId, res.postFromCache));
                creatorId = res.post.creator_id._id;

                warning.content_link = res.post.content_links[0];

                break;

            // delete forum
            case REPORT_TARGET_TYPE_FORUM:
                promises.push(deleteForumUtil(req.params.forumID, req.params.userId));
                creatorId = res.forum.creator_id._id;

                break;

            // delete thread
            case REPORT_TARGET_TYPE_THREAD:
                promises.push(deleteThreadUtil(req.params.forumID, req.params.threadID, res.threadFromCache));
                creatorId = res.thread.creator_id._id;

                break;

            // delete comment
            case REPORT_TARGET_TYPE_POST_COMMENT:
                promises.push(deleteCommentUtil(true, req.params.commentId, res.commentFromCache, res.postFromCache, getUserPostKey(req.params.userId), req.params.postId));
                creatorId = res.comment.creator_id._id;

                break;

            // delete comment
            case REPORT_TARGET_TYPE_THREAD_COMMENT:
                promises.push(deleteCommentUtil(false, req.params.commentId, res.commentFromCache, res.threadFromCache, getForumThreadKey(req.params.forumID), req.params.threadID));
                creatorId = res.comment.creator_id._id;

                break;

            // delete message
            case REPORT_TARGET_TYPE_MESSAGE:
                promises.push(deleteMessageUtil(req.params.messageId));
                creatorId = res.message.creator_id;

                break;

            default:
                break;
        }

        promises.push(warnUser(creatorId, warning));

        await Promise.all(promises);

        returnGoodReq(res, { message: 'Report resolved successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    reportFailed,
    reportSuccess
}