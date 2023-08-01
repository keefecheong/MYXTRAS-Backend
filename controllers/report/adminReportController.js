// to get all reports

const { Report } = require('../../models/report.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const getAggFunction = require('../../utils/report/getAggFunction.js');

// to get all pending reports
async function getPendingReports(req, res) {
    try {
        const reports = await Report.aggregate(getAggFunction(true));

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to get all reviewed reports
async function getReviewedReports(req, res) {
    try {
        const reports = await Report.aggregate(getAggFunction(false));

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to get reports submitted by a user
async function getReportsByUser(req, res) {
    try {
        const reports = await Report.commonQuery({ 'reporter.id': req.params.userId });

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get reports submitted against a user's content
async function getReportForUser(req, res) {
    try {
        const reports = await Report.commonQuery({ report_target_owner: req.params.userId });

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getPendingReports,
    getReviewedReports,
    getReportsByUser,
    getReportForUser
}