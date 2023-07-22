const { REPORT_STATUS_SUBMITTED } = require("../../models/report")

// to get reports grouped by report_target
// sorted by descending number of reports for the report_target and ascending report_time of the first report
module.exports = function getAggFunction() {
    return [
        {
            '$match': {
                'status': REPORT_STATUS_SUBMITTED
            }
        },
        {
            '$group': {
                '_id': '$report_target',
                'count': {
                    '$count': {}
                },
                'report_target_type': {
                    '$first': '$report_target_type'
                },
                'first_report_time': {
                    '$first': '$report_time'
                },
                'meta': {
                    '$first': '$meta'
                },
                'report_reasons': {
                    '$addToSet': '$report_reason'
                }
            }
        },
        {
            '$sort': {
                'count': -1,
                'first_report_time': 1
            }
        }
    ]
}