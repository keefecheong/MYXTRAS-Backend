const { REPORT_STATUS_SUBMITTED } = require("../../models/report");

// to get reports grouped by report_target
// sorted by descending number of reports for the report_target and ascending report_time of the first report
module.exports = function getAggFunction(pending) {
    return [
        // get pending/reviewed reports based on 'pending' value
        {
            '$match': {
                'status': pending ? REPORT_STATUS_SUBMITTED : { $ne: REPORT_STATUS_SUBMITTED }
            }
        },
        // group reports for the same target and add the relevant fields
        {
            '$group': {
                '_id': '$report_target',
                'report_target': {
                    '$first': '$report_target'
                },
                'count': {
                    '$count': {}
                },
                'report_target_type': {
                    '$first': '$report_target_type'
                },
                'report_target_owner': {
                    '$first': '$report_target_owner'
                },
                'report_time': {
                    '$first': '$report_time'
                },
                'meta': {
                    '$first': '$meta'
                },
                'report_reasons': {
                    '$addToSet': '$report_reason'
                },
                'report_evidence': {
                    '$first': '$report_evidence'
                },
                'review_time': {
                    '$first': '$review_time'
                },
                'reviewer_id': {
                    '$first': '$reviewer_id'
                },
                'status': {
                    '$first': '$status'
                },
                'reporter_subject': {
                    '$addToSet': '$reporter.subject'
                },
                'reporter_id': {
                    '$first': '$reporter.id'
                }
            }
        },
        // sort by descending number of reports and ascending report_time
        {
            '$sort': {
                'count': -1,
                'report_time': 1
            }
        },
        // populate creator of the reported object and the reviewer of the report
        {
            '$lookup': {
                'from': 'users',
                'localField': 'report_target_owner',
                'foreignField': '_id',
                'as': 'owner'
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'reviewer_id',
                'foreignField': '_id',
                'as': 'reviewer'
            }
        },
        {
            '$project': {
                'report_target': 1,
                'count': 1,
                'report_target_type': 1,
                'report_target_owner': {
                    '_id': '$report_target_owner',
                    'username': {
                        '$arrayElemAt': [
                            '$owner.username', 0
                        ]
                    }
                },
                'report_time': 1,
                'reporter': {
                    'subject': '$reporter_subject',
                    'id': '$reporter_id'
                },
                'meta': 1,
                'report_reasons': 1,
                'report_evidence': 1,
                'review_time': 1,
                'reviewer_id': {
                    '_id': '$reviewer_id',
                    'username': {
                        '$arrayElemAt': [
                            '$reviewer.username', 0
                        ]
                    }
                },
                'status': 1
            }
        }
    ]
}