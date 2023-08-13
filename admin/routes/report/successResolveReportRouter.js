// to handle deleting objects (report successful)

const express = require("express");
const successResolveReportRouter = express.Router({ mergeParams: true });

// get middleware
const {
  getUser,
} = require("../../../user/middleware/getRequestedUserMiddleware.js");
const { getPost } = require("../../../post/middleware/getPostMiddleware.js");
const { getForum } = require("../../../forum/middleware/getForumMiddleware.js");
const {
  getThread,
} = require("../../../thread/middleware/getThreadMiddleware.js");
const {
  getComment,
} = require("../../../comment/middleware/getCommentMiddleware.js");
const {
  getMessage,
} = require("../../../chat/middleware/getMessageMiddleware.js");
const {
  getReport,
} = require("../../../report/middleware/getReportMiddleware.js");

// get controller functions
const {
  reportSuccess,
} = require("../../../report/controllers/resolveReportController.js");

const {
  REPORT_TARGET_TYPE_USER,
  REPORT_TARGET_TYPE_POST,
  REPORT_TARGET_TYPE_FORUM,
  REPORT_TARGET_TYPE_THREAD,
  REPORT_TARGET_TYPE_MESSAGE,
  REPORT_TARGET_TYPE_POST_COMMENT,
  REPORT_TARGET_TYPE_THREAD_COMMENT,
} = require("../../../report/models/report.js");

const {
  USER_STATUS_SUSPENDED,
  USER_STATUS_TERMINATED,
} = require("../../../user/models/user.js");

const {
  PARENT_MODEL_POST,
  PARENT_MODEL_THREAD,
} = require("../../../comment/models/comment.js");

// suspend user
successResolveReportRouter.patch(
  "/user/:userId/suspend",
  getUser,
  (req, res, next) => getReport(req, res, next, req.params.userId),
  (req, res) =>
    reportSuccess(
      req,
      res,
      REPORT_TARGET_TYPE_USER,
      req.params.userId,
      USER_STATUS_SUSPENDED,
    ),
);

// terminate user
successResolveReportRouter.patch(
  "/user/:userId/terminate",
  getUser,
  (req, res, next) => getReport(req, res, next, req.params.userId),
  (req, res) =>
    reportSuccess(
      req,
      res,
      REPORT_TARGET_TYPE_USER,
      req.params.userId,
      USER_STATUS_TERMINATED,
    ),
);

// delete post
successResolveReportRouter.patch(
  "/user/:userId/post/:postId",
  getUser,
  getPost,
  (req, res, next) => getReport(req, res, next, req.params.postId),
  (req, res) =>
    reportSuccess(req, res, REPORT_TARGET_TYPE_POST, req.params.postId),
);

// delete forum
successResolveReportRouter.patch(
  "/forum/:forumId",
  getForum,
  (req, res, next) => getReport(req, res, next, req.params.forumId),
  (req, res) =>
    reportSuccess(req, res, REPORT_TARGET_TYPE_FORUM, req.params.forumId),
);

// delete thread
successResolveReportRouter.patch(
  "/forum/:forumId/thread/:threadId",
  getThread,
  (req, res, next) => getReport(req, res, next, req.params.threadId),
  (req, res) =>
    reportSuccess(req, res, REPORT_TARGET_TYPE_THREAD, req.params.threadId),
);

// delete comment
successResolveReportRouter.patch(
  "/user/:userId/post/:postId/comment/:commentId",
  getUser,
  getPost,
  (req, res, next) => getComment(req, res, next, PARENT_MODEL_POST),
  (req, res, next) => getReport(req, res, next, req.params.commentId),
  (req, res) =>
    reportSuccess(
      req,
      res,
      REPORT_TARGET_TYPE_POST_COMMENT,
      req.params.commentId,
    ),
);

successResolveReportRouter.patch(
  "/forum/:forumId/thread/:threadId/comment/:commentId",
  getThread,
  (req, res, next) => getComment(req, res, next, PARENT_MODEL_THREAD),
  (req, res, next) => getReport(req, res, next, req.params.commentId),
  (req, res) =>
    reportSuccess(
      req,
      res,
      REPORT_TARGET_TYPE_THREAD_COMMENT,
      req.params.commentId,
    ),
);

// delete message
successResolveReportRouter.patch(
  "/message/:messageId",
  getMessage,
  (req, res, next) => getReport(req, res, next, req.params.messageId),
  (req, res) =>
    reportSuccess(req, res, REPORT_TARGET_TYPE_MESSAGE, req.params.messageId),
);

module.exports = successResolveReportRouter;
