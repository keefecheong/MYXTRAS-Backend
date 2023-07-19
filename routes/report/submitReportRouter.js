// to submit reports

const express = require('express');
const submitReportRouter = express.Router();

// get middleware
const { getPost } = require('../../middleware/posts/getPostMiddleware.js');
const { getForum } = require('../../middleware/forums/getForumMiddleware.js');
const { getThread } = require('../../middleware/threads/getThreadMiddleware.js');
const { getComment } = require('../../middleware/comments/getCommentMiddleware.js');
const { getUser } = require('../../middleware/users/getRequestedUserMiddleware.js');
const { getMessage } = require('../../middleware/messages/getMessageMiddleware.js');
const { multerConfig, multerErrorHandler } = require('../../middleware/posts/multerMiddleware.js');

// get controller functions
const { createReport } = require('../../controllers/report/submitReportController.js');

const { PARENT_MODEL_POST, PARENT_MODEL_THREAD } = require('../../models/comment.js');

const { 
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_FORUM,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_POST_COMMENT,
    REPORT_TARGET_TYPE_THREAD_COMMENT,
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_MESSAGE
} = require('../../models/report.js');

// report post
submitReportRouter.post(
    '/user/:userId/post/:postId',
    getPost,
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_POST, req.params.postId)
);

// report forum
submitReportRouter.post(
    '/forum/:forumID', 
    getForum, 
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_FORUM, req.params.forumID)
);

// report thread
submitReportRouter.post(
    '/forum/:forumID/thread/:threadID', 
    getThread, 
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_THREAD, req.params.threadID)
);

// report comment
submitReportRouter.post(
    '/user/:userId/post/:postId/comment/:commentId', 
    getPost,
    (req, res, next) => getComment(req, res, next, PARENT_MODEL_POST),
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_POST_COMMENT, req.params.commentId)
);

submitReportRouter.post(
    '/forum/:forumID/thread/:threadID/comment/:commentId', 
    getThread, 
    (req, res, next) => getComment(req, res, next, PARENT_MODEL_THREAD),
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_THREAD_COMMENT, req.params.commentId)
);

// report user
submitReportRouter.post(
    '/user/:userId', 
    getUser, 
    multerConfig.single('reportEvidence'),
    multerErrorHandler,
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_USER, req.params.userId)
);

// report message
submitReportRouter.post(
    '/message/:messageId', 
    getMessage, 
    (req, res) => createReport(req, res, REPORT_TARGET_TYPE_MESSAGE, req.params.messageId)
);

module.exports = submitReportRouter;