// controller functions to handle GET requests for posts

const Post = require("../models/post.js");
const { User } = require("../../user/models/user.js");
const { checkPostAttributesAll } = require("../utils/checkAttributes.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const { getFollowingKey } = require("../../user/cache/userCache.js");
const { getUserPostKey, getPopularPostKey } = require("../cache/postCache.js");

const compareId = require("../../utils/general/compareId.js");

// retrieve user's own posts and posts by users followed
async function getFollowingPosts(req, res) {
  try {
    const userId = req.user._id;

    // get users that the requesting user follows
    const followingUsers = await User.find(
      {
        followers: { $in: userId },
      },
      {
        _id: 1,
        username: 1,
        profile_pic_link: 1,
        blocked_users: 1,
      }
    )
      .lean()
      .cache({
        key: getFollowingKey(userId),
        populateFollowers: true,
      });

    // add user ids into an array
    var userIds = followingUsers.map((user) => user._id);
    userIds.push(userId);

    const queries = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];

      queries.push(
        Post.commonQuery(
          {
            creator_id: userId,
          },
          null,
          true,
          {
            key: getUserPostKey(userId),
          }
        )
      );
    }

    // execute all queries, merge and sort the posts in descending creation time
    var posts = await Promise.all(queries).then((results) => {
      const merged = [].concat(...results);
      return merged.sort((a, b) => {
        const creationA = new Date(a.creation_time);
        const creationB = new Date(b.creation_time);

        return creationB - creationA;
      });
    });

    posts = checkPostAttributesAll(posts, req.user._id, req.user.blocked_users);

    returnGoodReq(res, posts);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// retrieve a user's posts based on userid if provided, otherwise retrieve the requesting user's own posts
async function getUserPosts(req, res) {
  try {
    // set targetUserId to provided userId or requesting user's id otherwise
    const targetUserId = req.params.userId || req.user._id;

    var posts = await Post.commonQuery(
      {
        creator_id: targetUserId,
      },
      null,
      true,
      {
        key: getUserPostKey(targetUserId),
      }
    );

    posts = checkPostAttributesAll(posts, req.user._id, req.user.blocked_users);

    returnGoodReq(res, posts);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get popular posts for 'explore'
// based on like/comment count and does not include requesting user's posts
async function getPopularPosts(req, res) {
  try {
    // aggregation pipeline
    // calculate 'relevance' based on the number of matches between the post's tags and the user's interests
    // calculate 'activity' based on sum of likes and comments
    // sorts posts based on descending relevance and activity count
    // populate and format creator's username and profile_pic_link fields
    // removes unneeded fields before returning result
    const agg = [
      {
        $addFields: {
          relevance: {
            $size: {
              $setIntersection: ["$tags", req.user.interests],
            },
          },
          activity: {
            $add: [
              {
                $size: "$likes",
              },
              "$comment_count",
            ],
          },
        },
      },
      {
        $sort: {
          relevance: -1,
          activity: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "creator_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          "creator_id._id": {
            $arrayElemAt: ["$user._id", 0],
          },
          "creator_id.username": {
            $arrayElemAt: ["$user.username", 0],
          },
          "creator_id.profile_pic_link": {
            $arrayElemAt: ["$user.profile_pic_link", 0],
          },
          "creator_id.blocked_users": {
            $arrayElemAt: ["$user.blocked_users", 0],
          },
        },
      },
      {
        $unset: ["activity", "relevance", "__v", "user"],
      },
    ];

    const tags =
      req.user.interests.length > 0 ? req.user.interests.join("-") : "default";

    var posts = await Post.aggregate(agg).cache({
      key: getPopularPostKey(tags),
    });

    // filter posts to those created by other users and set fields
    posts = checkPostAttributesAll(
      posts.filter(
        (post) =>
          !compareId(post.creator_id._id || post.creator_id, req.user._id)
      ),
      req.user._id,
      req.user.blocked_users
    );

    returnGoodReq(res, posts);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get posts saved by the user
async function getSavedPosts(req, res) {
  try {
    var posts = await Post.commonQuery(
      {
        saved_by: { $in: [req.user._id] },
      },
      {}
    );

    posts = checkPostAttributesAll(posts, req.user._id, req.user.blocked_users);

    returnGoodReq(res, posts);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  getFollowingPosts,
  getUserPosts,
  getPopularPosts,
  getSavedPosts,
};
