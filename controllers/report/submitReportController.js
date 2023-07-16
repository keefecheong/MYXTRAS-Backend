// to create a report

const mongoose = require('mongoose');

const {
    Report,
    REPORT_TARGET_TYPES,
    REPORT_TARGET_TYPE_USER,
    REPORT_REASONS,
    REPORT_MESSAGE_SUBMITTED
} = require('../../models/report.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { uploadImages, UPLOAD_IMAGE_TYPE_REPORT } = require('../../utils/general/firebaseStorageUpload.js');

// to create a report
async function createReport(req, res, type, objectId) {
    // return 400 error if provided type is not a valid type
    if (!REPORT_TARGET_TYPES.includes(type)) {
        return returnBadReq(res, 'Invalid report type.');
    }

    // return 400 error if report reason is not provided in body or it is not a valid reason
    if (!req.body?.reason || !REPORT_REASONS.includes(req.body.reason)) {
        return returnBadReq(res, 'Invalid request body.');
    }

    const report = new Report({
        report_target: objectId,
        report_target_type: type,
        report_reason: req.body.reason,
        reporter_id: req.user._id
    });

    try {
        // if reporting user and images are provided then upload the images and save links
        if (type == REPORT_TARGET_TYPE_USER && req.files.length > 0) {
            const reportId = new mongoose.Types.ObjectId();
            report._id = reportId;

            // upload images and store the links in report_evidence of the new report
            const uploadSuccessful = await uploadImages(req.files, report.report_evidence, reportId, UPLOAD_IMAGE_TYPE_REPORT);

            // if failed to upload images then return 500 error
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }
        }

        await report.save();

        returnGoodReq(res, { message: REPORT_MESSAGE_SUBMITTED });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createReport
}