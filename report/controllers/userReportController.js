// to get reports submitted by the user

const { Report } = require('../models/report.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq');

// to get submitted reports
async function getSubmittedReports(req, res) {
    try {
        const reports = await Report.commonQuery({ 'reporter.id': req.user._id });

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getSubmittedReports
}