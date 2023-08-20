// controller functions to resolve reports

const {
  Report,
  REPORT_REASONS,
  REPORT_REASON_OTHER,
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
  REPORT_TARGET_TYPE_USER,
} = require("../models/report.js");

const {
  USER_STATUS_SUSPENDED,
  USER_STATUSES,
} = require("../../user/models/user.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const { getUserPostKey } = require("../../post/cache/postCache.js");
const { getForumThreadKey } = require("../../thread/cache/threadCache.js");

const warnUser = require("../utils/warnUser.js");
const suspendUserUtil = require("../utils/suspendUserUtil.js");
const terminateUserUtil = require("../utils/terminateUserUtil.js");

const deletePostUtil = require("../../post/utils/deletePost.js");
const deleteForumUtil = require("../../forum/utils/deleteForum.js");
const deleteThreadUtil = require("../../thread/utils/deleteThread.js");
const deleteCommentUtil = require("../../comment/utils/deleteComment.js");
const deleteMessageUtil = require("../../chat/utils/deleteMessage.js");

// no further action required (invalid report)
async function reportFailed(req, res) {
  try {
    const adminId = req.user._id;
    const now = Date.now();

    // update all reports for the specified objectId that have not been reviewed
    // set status as failed
    await Report.resolveReport(
      req.params.objectId,
      REPORT_STATUS_FAILED,
      adminId,
      now,
    );

    const responseBody = {
      message: "Report resolved successfully.",
      resolveDetails: {
        reviewerId: adminId,
        reviewerUsername: req.user.username,
        status: REPORT_STATUS_FAILED,
        reviewTime: now,
      },
    };

    returnGoodReq(res, responseBody);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// delete associated object
async function reportSuccess(req, res, type, reportTargetId, userAction) {
  try {
    const adminId = req.user._id;

    // return 400 error if provided reason is invalid
    if (!REPORT_REASONS.includes(req.body?.reason)) {
      return returnBadReq(res, "Invalid report reason");
    }
    // return 400 if reason is 'Other' but no supporting description/reason was provided
    else if (req.body.reason == REPORT_REASON_OTHER && !req.body?.otherReason) {
      return returnBadReq(res, "Description is required.");
    }

    const validTypes = [
      REPORT_TARGET_TYPE_POST_COMMENT,
      REPORT_TARGET_TYPE_THREAD_COMMENT,
    ].concat(REPORT_TARGET_TYPES);

    // return 400 error if type is invalid
    if (!validTypes.includes(type)) {
      return returnBadReq(res, "Invalid report type.");
    }

    // return 400 error if userAction is provided but invalid
    if (userAction && !USER_STATUSES.includes(userAction)) {
      return returnBadReq(res, "Invalid action.");
    }
    // return 400 error if userAction is to suspend user but duration is invalid
    else if (userAction && userAction == USER_STATUS_SUSPENDED) {
      if (req.body?.duration == null || isNaN(req.body.duration)) {
        return returnBadReq(res, "Invalid suspend duration.");
      }
    }

    const now = Date.now();
    const reviewReason =
      req.body.reason == REPORT_REASON_OTHER
        ? req.body.otherReason
        : req.body.reason;

    // create warning to add to user's warnings list
    const warning = {
      object_id: reportTargetId,
      object_type:
        (type == REPORT_TARGET_TYPE_POST_COMMENT ||
        type == REPORT_TARGET_TYPE_THREAD_COMMENT)
          ? REPORT_TARGET_TYPE_COMMENT
          : type,
      reason: reviewReason,
      review_time: now,
      reviewer_id: adminId,
    };

    // as default always issue warning to user and resolve report
    const promises = [
      Report.resolveReport(
        reportTargetId,
        REPORT_STATUS_SUCCESS,
        adminId,
        now,
        reviewReason,
      ),
    ];

    // resolve report and perform necessary action
    // set warning fields
    switch (type) {
      // suspend or terminate user based on userAction
      case REPORT_TARGET_TYPE_USER:
        if (userAction == USER_STATUS_SUSPENDED) {
          const endTime = now + parseInt(req.body.duration);
          promises.push(suspendUserUtil(true, res.user, adminId, endTime));
        } else {
          promises.push(terminateUserUtil(res.user, adminId));
        }

        break;

      // delete post
      case REPORT_TARGET_TYPE_POST:
        promises.push(
          deletePostUtil(
            req.params.userId,
            req.params.postId,
            res.postFromCache,
          ),
        );

        warning.file_name = res.post.original_names[0];
        warning.content = res.post.caption;
        warning.object_creation_time = res.post.creation_time;

        break;

      // delete forum
      case REPORT_TARGET_TYPE_FORUM:
        promises.push(deleteForumUtil(req.params.forumId, req.params.userId));

        warning.content = res.forum.forumId;
        warning.object_creation_time = res.forum.creation_time;

        break;

      // delete thread
      case REPORT_TARGET_TYPE_THREAD:
        promises.push(
          deleteThreadUtil(
            req.params.forumId,
            req.params.threadId,
            res.threadFromCache,
          ),
        );

        warning.content = res.thread.title;
        warning.object_creation_time = res.thread.creation_time;

        break;

      // delete comment
      case REPORT_TARGET_TYPE_POST_COMMENT:
        promises.push(
          deleteCommentUtil(
            true,
            req.params.commentId,
            res.commentFromCache,
            res.postFromCache,
            getUserPostKey(req.params.userId),
            req.params.postId,
          ),
        );

        warning.content = res.comment.content;
        warning.object_creation_time = res.comment.creation_time;

        break;

      // delete comment
      case REPORT_TARGET_TYPE_THREAD_COMMENT:
        promises.push(
          deleteCommentUtil(
            false,
            req.params.commentId,
            res.commentFromCache,
            res.threadFromCache,
            getForumThreadKey(req.params.forumId),
            req.params.threadId,
          ),
        );

        warning.content = res.comment.content;
        warning.object_creation_time = res.comment.creation_time;

        break;

      // delete message
      case REPORT_TARGET_TYPE_MESSAGE:
        promises.push(deleteMessageUtil(req.params.messageId));

        warning.content = res.message.content;
        warning.object_creation_time = res.message.creation_time;

        const originalName = res.message.original_name;
        if (originalName) {
          warning.file_name = originalName;
        }

        break;

      default:
        break;
    }

    // only add warning if report is for content
    if (type != REPORT_TARGET_TYPE_USER) {
      promises.push(warnUser(res.report.report_target_owner, warning));
    }

    await Promise.all(promises);

    const responseBody = {
      message: "Report resolved successfully.",
      resolveDetails: {
        reviewerId: adminId,
        reviewerUsername: req.user.username,
        status: REPORT_STATUS_SUCCESS,
        reviewReason,
        reviewTime: now,
      },
    };

    returnGoodReq(res, responseBody);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  reportFailed,
  reportSuccess,
};
