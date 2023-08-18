// controller functions for GET requests for forums

const Forum = require("../models/forum.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");
const compareId = require("../../utils/general/compareId.js");

const {
  getCreatedForumKey,
  getSubscribedForumKey,
  FORUM_RECOMMENDED_KEY_BASE,
  FORUM_CATEGORIZED_KEY_BASE,
} = require("../cache/forumCache.js");

// verify if forum_id is already in use
async function verifyForumID(req, res) {
  const existingForum = await Forum.findOne(
    { forum_id: req.body.forum_id },
    { _id: 1 },
  ).lean();

  if (existingForum) {
    returnBadReq(res, "ForumID already exists");
  } else {
    returnGoodReq(res);
  }
}

// get forum by _id
async function getOneForum(req, res) {
  // set fields
  res.forum.isCreator = compareId(res.forum.creator_id._id, req.user._id);
  res.forum.isSubscribed = res.forum.subscribers.some((subscriber_id) =>
    compareId(subscriber_id, req.user._id),
  );
  res.forum.subscribers = res.forum.subscribers.length;

  returnGoodReq(res, res.forum);
}

// get created forums
async function getCreated(req, res) {
  try {
    const userId = req.user._id;

    const forums = await Forum.commonQuery(
      {
        creator_id: userId,
      },
      true,
      {
        key: getCreatedForumKey(userId),
      },
    );

    returnGoodReq(res, forums);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get subscribed forums
async function getSubscribed(req, res) {
  try {
    const userId = req.user._id;

    const subbed_forums = await Forum.commonQuery(
      {
        subscribers: { $in: [userId] },
      },
      true,
      {
        key: getSubscribedForumKey(userId),
      },
    );

    returnGoodReq(res, subbed_forums);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get 6 recommended forums based on number of subscribers
async function getRecommended(req, res) {
  const recommendedForums = await Forum.aggregate([
    {
      $project: {
        forum_name: 1,
        forum_id: 1,
        forum_pic_link: 1,
        subscribers_count: { $size: "$subscribers" },
      },
    },
    {
      $sort: {
        subscribers_count: -1,
      },
    },
    {
      $limit: 6,
    },
  ]).cache({
    key: FORUM_RECOMMENDED_KEY_BASE,
  });

  returnGoodReq(res, recommendedForums);
}

// get categorized forums
async function getCategorized(req, res) {
  const agg = [
    {
      $unwind: "$tags", // Unwind the tags array
    },
    {
      $addFields: {
        subscribers_count: { $size: "$subscribers" }, // add a new field which counts the number of subscribers
      },
    },
    {
      $sort: { subscribers_count: -1 }, // sort by subscribers_count in descending order
    },
    {
      $group: {
        _id: "$tags", // Group by each unique tag
        forums: {
          $push: {
            _id: "$$ROOT._id",
            forum_name: "$$ROOT.forum_name",
            tags: "$$ROOT.tags",
            banner_link: "$$ROOT.banner_link",
            forum_pic_link: "$$ROOT.forum_pic_link",
          },
        }, // Collect the forums with the same tag into an array
      },
    },
    {
      $project: {
        _id: 1,
        forums: { $slice: ["$forums", 6] }, // Limit the forums array to 6 elements
      },
    },
    {
      $sort: { _id: 1 }, // sort interests by alphabet
    },
  ];

  const sortedForums = await Forum.aggregate(agg).cache({
    key: FORUM_CATEGORIZED_KEY_BASE,
  });

  returnGoodReq(res, sortedForums);
}

module.exports = {
  verifyForumID,
  getOneForum,
  getCreated,
  getSubscribed,
  getRecommended,
  getCategorized,
};
