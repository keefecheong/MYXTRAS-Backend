// to verify that reports are populated in database correctly

const { Report } = require('../models/report.js');

const expectEqualLengthResults = require('../../utils/test/expectEqualLengthResults.js');

// to check that all reports specified by reportIds are in the database
async function verifyDBPopulatedReports(reportIds) {
    const populatedReports = await Report.find(
        { _id: { $in: reportIds } },
        { _id: 1 }
    ).lean();

    expectEqualLengthResults(populatedReports, reportIds);
}

module.exports = {
    verifyDBPopulatedReports
}