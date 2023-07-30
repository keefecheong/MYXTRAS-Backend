// to create a report

const {
    Report,
    REPORT_TARGET_TYPE_USER,
    REPORT_TARGET_TYPE_POST,
    REPORT_TARGET_TYPE_POST_COMMENT,
    REPORT_TARGET_TYPE_THREAD,
    REPORT_TARGET_TYPE_THREAD_COMMENT,
    REPORT_TARGET_TYPE_MESSAGE,
    REPORT_TARGET_TYPE_COMMENT,
    REPORTER_SUBJECT_AI,
    REPORTER_SUBJECT_USER
} = require('../../models/report.js');

const { uploadImages, UPLOAD_TYPE_REPORT } = require('../firebase/firebaseStorageUpload.js');
const getJoinedReasons = require('../admin/moderation/getJoinedReasons.js');

// to create a report with the given arguments
async function createReport(
    reportTarget,
    reportTargetType,
    reportTargetOwner,
    reportReason,
    meta,
    reporterId,
    reportUserImage
) {
    // initialize report fields
    const report = new Report({
        report_target: reportTarget,
        report_target_type: reportTargetType,
        report_target_owner: reportTargetOwner,
        report_reason: reportReason,
        // set reporter subject to ai if reporterId is not provided
        reporter: {
            subject: reporterId ? REPORTER_SUBJECT_USER : REPORTER_SUBJECT_AI
        }
    });

    if (reporterId) {
        report.reporter.id = reporterId
    }

    // set additional information based on report target type
    switch (reportTargetType) {
        case REPORT_TARGET_TYPE_USER:
            // if reporting user and image is provided then upload the image and save link
            if (reportUserImage) {
                // upload image and store the link in report_evidence of the new report
                const imageLinks = [];
                const uploadSuccessful = await uploadImages([reportUserImage], imageLinks, report._id, UPLOAD_TYPE_REPORT);

                // if failed to upload image then throw error
                if (!uploadSuccessful) {
                    throw new Error('Failed to upload image');
                }

                report.report_evidence = imageLinks[0];
            }

            break;

        case REPORT_TARGET_TYPE_POST:
            report.meta.creator_id = meta.creatorId;

            break;
        
        case REPORT_TARGET_TYPE_POST_COMMENT:
            report.meta.creator_id = meta.creatorId;
            report.meta.post_id = meta.postId;
            report.meta.comment_parent_type = REPORT_TARGET_TYPE_POST;

            report.report_target_type = REPORT_TARGET_TYPE_COMMENT;

            break;

        case REPORT_TARGET_TYPE_THREAD:
            report.meta.forum_id = meta.forumId;

            break;

        case REPORT_TARGET_TYPE_THREAD_COMMENT:
            report.meta.forum_id = meta.forumId;
            report.meta.thread_id = meta.threadId;
            report.meta.comment_parent_type = REPORT_TARGET_TYPE_THREAD;

            report.report_target_type = REPORT_TARGET_TYPE_COMMENT;

            break;

        case REPORT_TARGET_TYPE_MESSAGE:
            report.meta.chat_id = meta.chatId;

            break;

        default:
            break;
    }

    return report;
}

// to create a report automatically after executing moderation functions if inappropriate content is detected
function createReportAfterModeration(moderationPromises, reportTarget, reportTargetType, reportTargetOwner, meta) {
    // use promise.all if more than 1 promise and run promise alone otherwise
    const promise = moderationPromises.isArray() ? 
        (moderationPromises.length > 1 ? Promise.all(moderationPromises) : moderationPromises[0]) :
        moderationPromises;
    
    promise.then(results => {
        if (results.some(result => result?.length > 0)) {
            const reportReason = getJoinedReasons(results);
            
            createReport(reportTarget, reportTargetType, reportTargetOwner, reportReason, meta).then(report => report.save());
        }
    });
}

module.exports = {
    createReport,
    createReportAfterModeration
}