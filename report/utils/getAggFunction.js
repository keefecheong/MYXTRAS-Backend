const mongoose = require("mongoose");
const { PARENT_MODEL_POST } = require("../../comment/models/comment.js");
const { REPORT_STATUS_SUBMITTED } = require("../models/report.js");

// to get reports grouped by report_target
// sorted by descending number of reports for the report_target and ascending report_time of the first report
function getReportsAgg(pending) {
  const sort = pending
    ? {
        count: -1,
        report_time: 1,
      }
    : {
        review_time: 1,
      };

  return [
    // get pending/reviewed reports based on 'pending' value
    {
      $match: {
        status: pending
          ? REPORT_STATUS_SUBMITTED
          : { $ne: REPORT_STATUS_SUBMITTED },
      },
    },
    // group reports for the same target and add the relevant fields
    {
      $group: {
        _id: "$report_target",
        report_target: {
          $first: "$report_target",
        },
        count: {
          $count: {},
        },
        report_target_type: {
          $first: "$report_target_type",
        },
        report_target_owner: {
          $first: "$report_target_owner",
        },
        report_time: {
          $first: "$report_time",
        },
        meta: {
          $first: "$meta",
        },
        report_reasons: {
          $addToSet: "$report_reason",
        },
        report_other_reasons: {
          $addToSet: "$report_other_reason",
        },
        report_evidence: {
          $first: "$report_evidence",
        },
        review_time: {
          $first: "$review_time",
        },
        reviewer_id: {
          $first: "$reviewer_id",
        },
        review_reason: {
          $first: "$review_reason",
        },
        status: {
          $first: "$status",
        },
        reporter_subject: {
          $addToSet: "$reporter.subject",
        },
        reporter_id: {
          $first: "$reporter.id",
        },
      },
    },
    // sort by descending number of reports and ascending report_time
    {
      $sort: sort,
    },
    // populate creator of the reported object and the reviewer of the report
    {
      $lookup: {
        from: "users",
        localField: "report_target_owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "reviewer_id",
        foreignField: "_id",
        as: "reviewer",
      },
    },
    {
      $project: {
        report_target: 1,
        count: 1,
        report_target_type: 1,
        report_target_owner: {
          _id: "$report_target_owner",
          username: {
            $arrayElemAt: ["$owner.username", 0],
          },
        },
        report_time: 1,
        reporter: {
          subject: "$reporter_subject",
          id: "$reporter_id",
        },
        meta: 1,
        report_reasons: 1,
        report_other_reasons: 1,
        report_evidence: 1,
        review_time: 1,
        reviewer_id: {
          _id: "$reviewer_id",
          username: {
            $arrayElemAt: ["$reviewer.username", 0],
          },
        },
        review_reason: 1,
        status: 1,
      },
    },
  ];
}

// get aggregation function to get number of comments per post or thread created by the target user
function getCommentsPerParentAgg(userId) {
  return [
    {
      $match: {
        creator_id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: "$parent_id",
        count: {
          $count: {},
        },
        parent_model: {
          $first: "$parent_model",
        },
      },
    },
    {
      $lookup: {
        from: "threads",
        localField: "_id",
        foreignField: "_id",
        as: "thread",
        pipeline: [
          {
            $project: {
              _id: 0,
              parent_id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "_id",
        as: "post",
        pipeline: [
          {
            $project: {
              _id: 0,
              creator_id: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        parent_model: 1,
        key_creation_id: {
          $cond: {
            if: {
              $eq: ["$parent_model", PARENT_MODEL_POST],
            },
            then: {
              $arrayElemAt: ["$post.creator_id", 0],
            },
            else: {
              $arrayElemAt: ["$thread.parent_id", 0],
            },
          },
        },
      },
    },
  ];
}

module.exports = {
  getReportsAgg,
  getCommentsPerParentAgg,
};
