// to get reports submitted by the user

const { Report } = require('../../models/report.js');

const returnGoodReq = require('../../utils/general/returnGoodReq');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq');

// to get submitted reports
async function getSubmittedReports(req, res) {
    try {
        const reports = await Report.find({ reporter_id: req.user._id }).lean();

        returnGoodReq(res, reports);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    getSubmittedReports
}