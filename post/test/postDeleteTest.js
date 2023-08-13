// to test if deleting a post deletes associated child comments successfully

const { PARENT_MODEL_POST } = require("../../comment/models/comment.js");

const exitAfterTest = require("../../utils/test/exitAfterTest.js");
const generateContextFromTests = require("../../utils/test/generateContextFromTests.js");
const generateTestTitle = require("../../utils/test/generateTestTitle.js");
const generatePlaceholderBlock = require("../../utils/test/generatePlaceholderBlock.js");
const {
  VERIFY_POPULATED_DATA_USERS,
  VERIFY_POPULATED_DATA_POSTS,
  VERIFY_POPULATED_DATA_POST_COMMENTS,
  verifyPopulatedData,
} = require("../../utils/test/verifyPopulatedData.js");

const addUsersToDB = require("../../user/test/populateUsers.js");
const addPostsToDB = require("./populatePosts.js");

const {
  deletePost,
  verifyDBDeletePost,
  verifyCacheDeletePost,
} = require("./verifyDeletePost.js");
const {
  verifyDBDeleteCommentParent,
  verifyCacheDeleteCommentParent,
} = require("../../comment/test/verifyDeleteParent.js");

const userCount = 1;
const postCount = 1;
const commentCount = 5;
let deletedPostId, deletedPostCreatorId;

let mainSuite = describe("DELETE /api/posts/user/:userId/post:postId", () => {
  before(async () => {
    // populate users, posts, and comments
    const userIds = (await addUsersToDB(userCount)).map((user) => user._id);

    const addPostsResult = await addPostsToDB(postCount, userIds, commentCount);

    const posts = addPostsResult.postData;
    const postIds = posts.map((post) => post._id);
    const postCommentIds = addPostsResult.postComments.map(
      (comment) => comment._id,
    );

    // verify populated data
    mainSuite.suites.push(
      verifyPopulatedData(
        [
          VERIFY_POPULATED_DATA_USERS,
          VERIFY_POPULATED_DATA_POSTS,
          VERIFY_POPULATED_DATA_POST_COMMENTS,
        ],
        {
          userIds,
          postIds,
          postCommentIds,
        },
      ),
    );

    // generate and dynamically add tests to verify data before and after deletion of post
    deletedPostId = posts[0]._id;
    deletedPostCreatorId = posts[0].creator_id;

    mainSuite.suites.push(generateDeletePostTestContext(false));
    mainSuite.suites.push(generateDeletePostTestContext(true));
  });

  // clean up and exit
  after(exitAfterTest);

  generatePlaceholderBlock();
});

// generate context for post deletion tests
function generateDeletePostTestContext(deleted) {
  return generateContextFromTests(
    deleted,
    "deleting",
    generateDeletePostTests(deleted),
  );
}

// generate tests for post deletion
function generateDeletePostTests(deleted) {
  // test cases
  // before deleting:
  //      post should be present in database and cache
  //      comments should be present in database (if post has comments) and cache
  // after deleting:
  //      post should not be present in both database and cache
  //      comments should not be present in both database and cache
  const tests = [
    // check if post exists in database and cache
    {
      title: generateTestTitle(deleted, "post", true),
      callback: verifyDBDeletePost,
      params: [deletedPostId, deleted],
    },
    {
      title: generateTestTitle(deleted, "post", false),
      callback: verifyCacheDeletePost,
      params: [deletedPostCreatorId, deletedPostId, deleted],
    },
    // check if associated comments exist in database and cache
    {
      title: generateTestTitle(deleted, "comments", true),
      callback: verifyDBDeleteCommentParent,
      params: [deletedPostId, deleted],
    },
    {
      title: generateTestTitle(deleted, "comments", false),
      callback: verifyCacheDeleteCommentParent,
      params: [deletedPostId, PARENT_MODEL_POST, deleted],
    },
  ];

  // if to delete then add test to send delete request
  if (deleted) {
    tests.unshift({
      title: "should return 200",
      callback: deletePost,
      params: [deletedPostCreatorId, deletedPostId],
    });
  }

  return tests;
}
