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

    try {
        // check if a report by the same user exists for the same target object and return 400 error if so
        const reportExists = await Report.findOne({ report_target: objectId, reporter_id: req.user._id });
        if (reportExists) {
            return returnBadReq(res, 'You have already submitted a report.')
        }

        const report = new Report({
            report_target: objectId,
            report_target_type: type,
            report_reason: req.body.reason,
            reporter_id: req.user._id
        });

        // if reporting user and image is provided then upload the image and save link
        if (type == REPORT_TARGET_TYPE_USER && req.file) {
            const reportId = new mongoose.Types.ObjectId();
            report._id = reportId;

            // upload image and store the link in report_evidence of the new report
            const imageLinks = [];
            const uploadSuccessful = await uploadImages([req.file], imageLinks, reportId, UPLOAD_IMAGE_TYPE_REPORT);

            // if failed to upload image then return 500 error
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }

            report.report_evidence = imageLinks[0];
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