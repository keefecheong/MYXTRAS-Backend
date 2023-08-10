// to submit a report

const {
    Report,
    REPORT_TARGET_TYPES,
    REPORT_TARGET_TYPE_POST_COMMENT,
    REPORT_TARGET_TYPE_THREAD_COMMENT,
    REPORT_REASONS,
    REPORT_MESSAGE_SUBMITTED,
    REPORT_STATUS_SUBMITTED,
    REPORT_REASON_OTHER
} = require('../models/report.js');

const { createReport } = require('../utils/createReport.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnBadReq = require('../../utils/returnReq/returnBadReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

// to submit a report
async function submitReport(req, res, type, objectId, reportTargetOwner) {
    const validReportTypes = [REPORT_TARGET_TYPE_POST_COMMENT, REPORT_TARGET_TYPE_THREAD_COMMENT].concat(REPORT_TARGET_TYPES);

    // return 400 error if provided type is not a valid type
    if (!validReportTypes.includes(type)) {
        return returnBadReq(res, 'Invalid report type.');
    }

    // return 400 error if report reason is not provided in body or it is not a valid reason
    if (!REPORT_REASONS.includes(req.body?.reason)) {
        return returnBadReq(res, 'Invalid request body.');
    }
    // return 400 if report reason is Other but no other reason/description is provided
    else if (req.body.reason == REPORT_REASON_OTHER && !req.body.otherReason) {
        return returnBadReq(res, 'Description is required.');
    }

    try {
        // check if a pending report by the same user exists for the same target object and return 400 error if so
        const reportExists = await Report.findOne({
            report_target: objectId,
            reporter_id: req.user._id,
            status: REPORT_STATUS_SUBMITTED
        });

        if (reportExists) {
            return returnBadReq(res, 'You have already submitted a report.');
        }

        // create and save report
        await createReport(
            objectId,
            type,
            reportTargetOwner,
            req.body.reason,
            req.body.otherReason,
            {
                creatorId: req.params.userId,
                postId: req.params.postId,
                forumId: req.params.forumId,
                threadId: req.params.threadId,
                chatId: res.message?.chat_id,
            },
            req.user._id,
            req.file
        ).then(report => report.save());

        returnGoodReq(res, { message: REPORT_MESSAGE_SUBMITTED });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    submitReport
}