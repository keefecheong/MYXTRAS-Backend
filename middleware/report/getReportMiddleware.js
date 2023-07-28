// middleware to get a report

const { Report, REPORT_STATUS_SUBMITTED } = require('../../models/report.js');

const returnNotFoundReq = require('../../utils/general/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// get report by report_target
async function getReport(req, res, next, objectId) {
    let target = null;

    try {
        target = await Report.findOne({ report_target: objectId, status: REPORT_STATUS_SUBMITTED }).lean();

        // if unresolved report does not exist for given report_target then return 404
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.report = target;
    next();
}

module.exports = {
    getReport
}