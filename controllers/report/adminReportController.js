// to get all reports

const { Report, REPORT_STATUS_SUBMITTED } = require('../../models/report.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to get all pending reports
async function getPendingReports(req, res) {
    try {
        const reports = await Report.find({ status: REPORT_STATUS_SUBMITTED }).lean();

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to get all reviewed reports
async function getReviewedReports(req, res) {
    try {
        const reports = await Report.find({ status: { $ne: REPORT_STATUS_SUBMITTED } }).lean();

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getPendingReports,
    getReviewedReports
}