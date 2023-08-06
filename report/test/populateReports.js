// to populate reports
// generates report for the first object of each type (created by all other users available)

const {
    Report,
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_FORUM,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE,
    REPORT_REASON_SPAM,
    REPORTER_SUBJECT_USER
} = require('../models/report.js');

const compareId = require('../../utils/general/compareId.js');

// to populate reports for users
async function populateUserReports(userIds) {
    const targetUser = userIds[0];

    return await submitReport(
        targetUser,
        targetUser,
        REPORT_TARGET_TYPE_USER,
        userIds.slice(1)
    );
}

// to populate reports for posts
async function populatePostReports(posts, userIds) {
    const targetPost = posts[0];
    const targetPostCreatorId = targetPost.creator_id;

    return await submitReport(
        targetPost._id,
        targetPostCreatorId,
        REPORT_TARGET_TYPE_POST,
        filterReporterIds(userIds, targetPostCreatorId),
        {
            creator_id: targetPostCreatorId
        }
    );
}

// to populate reports for post comments
async function populatePostCommentReports(posts, comments, userIds) {
    const targetComment = comments[0];
    const targetCommentCreatorId = targetComment.creator_id;
    const targetCommentParentId = targetComment.parent_id;
    
    return await submitReport(
        targetComment._id,
        targetCommentCreatorId,
        REPORT_TARGET_TYPE_COMMENT,
        filterReporterIds(userIds, targetCommentCreatorId),
        {
            creator_id: posts.find(post => compareId(post._id, targetCommentParentId)).creator_id,
            post_id: targetCommentParentId,
            comment_parent_type: REPORT_TARGET_TYPE_POST
        }
    );
}

// to populate reports for forums
async function populateForumReports(forums, userIds) {
    const targetForum = forums[0];
    const targetForumCreatorId = targetForum.creator_id;

    return await submitReport(
        targetForum._id,
        targetForumCreatorId,
        REPORT_TARGET_TYPE_FORUM,
        filterReporterIds(userIds, targetForumCreatorId)
    );
}

// to populate reports for threads
async function populateThreadReports(threads, userIds) {
    const targetThread = threads[0];
    const targetThreadCreatorId = targetThread.creator_id;

    return await submitReport(
        targetThread._id,
        targetThreadCreatorId,
        REPORT_TARGET_TYPE_THREAD,
        filterReporterIds(userIds, targetThreadCreatorId),
        {
            forum_id: targetThread.parent_id
        }
    );
}

// to populate reports for thread comments
async function populateThreadCommentReports(threads, comments, userIds) {
    const targetComment = comments[0];
    const targetCommentCreatorId = targetComment.creator_id;
    const targetCommentParentId = targetComment.parent_id;

    return await submitReport(
        targetComment._id,
        targetCommentCreatorId,
        REPORT_TARGET_TYPE_COMMENT,
        filterReporterIds(userIds, targetCommentCreatorId),
        {
            forum_id: threads.find(thread => compareId(thread._id, targetCommentParentId)),
            thread_id: targetCommentParentId,
            comment_parent_type: REPORT_TARGET_TYPE_THREAD
        }
    );
}

// to populate reports for messages
async function populateMessageReports(messages, chats) {
    const targetMessage = messages[0];
    const targetMessageCreatorId = targetMessage.creator_id;
    
    return await submitReport(
        targetMessage._id,
        targetMessageCreatorId,
        REPORT_TARGET_TYPE_MESSAGE,
        chats.users.filter(userId => !compareId(userId, targetMessageCreatorId)),
        {
            chat_id: targetMessage.chat_id
        }
    );
}

module.exports = {
    populateUserReports,
    populatePostReports,
    populatePostCommentReports,
    populateForumReports,
    populateThreadReports,
    populateThreadCommentReports,
    populateMessageReports
}

// to filter out user ids to pass as reporterIds
function filterReporterIds(userIds, ownerId) {
    return userIds.filter(userId => !compareId(userId, ownerId));
}

// to generate and save reports to database then return formatted reports
async function submitReport(targetId, ownerId, targetType, reporterIds, meta) {
    const reports = reporterIds.map(reporterId => {
        const report = new Report({
            report_target: targetId,
            report_target_owner: ownerId,
            report_target_type: targetType,
            report_reason: REPORT_REASON_SPAM,
            reporter: {
                subject: REPORTER_SUBJECT_USER,
                id: reporterId
            }
        });

        if (meta) {
            report.meta = meta;
        }

        return report;
    });

    await Report.insertMany(reports);

    return reports.map(report => {
        return {
            _id: report._id,
            report_target: targetId,
            report_target_owner: ownerId,
            report_target_type: targetType,
            meta: report.meta
        }
    });
}