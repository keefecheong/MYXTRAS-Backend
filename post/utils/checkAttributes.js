// functions to check attributes of posts to set fields before returning to frontend

const compareId = require("../../utils/general/compareId.js");

// adds fields to the post object:
// 1. check if the requesting user is the owner of the post
// 2. check if the requesting user has liked the post
// for an array of posts
function checkPostAttributesAll(posts, selfId, blockedUsers) {
  let result = [];

  posts.forEach((post) => {
    // create deep copy to modify only the given document each time
    result.push(
      checkPostAttributes(
        JSON.parse(JSON.stringify(post)),
        selfId,
        blockedUsers,
      ),
    );
  });

  return result;
}

// for one post
function checkPostAttributes(post, selfId, blockedUsers) {
  const creatorId = post.creator_id._id;

  post.isOwner = compareId(creatorId, selfId);

  // delete original names if not owner since unnecesary
  if (!post.isOwner) {
    delete post.original_names;
  }

  // check if the creator of the post or the requesting user have blocked each other
  if (
    post.creator_id?.blocked_users?.some((entry) =>
      compareId(entry.user_id, selfId),
    ) ||
    blockedUsers.some((entry) => compareId(entry.user_id, creatorId))
  ) {
    post.blocked = true;
  }

  delete post.creator_id.blocked_users;

  post.liked = post.likes.some((user_id) => compareId(user_id, selfId));
  // change likes to count to reduce data size
  post.likes = post.likes.length;

  post.saved = post.saved_by.some((user_id) => compareId(user_id, selfId));

  delete post.saved_by;

  return post;
}

module.exports = {
  checkPostAttributes,
  checkPostAttributesAll,
};
