// to test if deleting a thread deletes associated child comments successfully

const { PARENT_MODEL_THREAD } = require("../../comment/models/comment.js");

const exitAfterTest = require("../../utils/test/exitAfterTest.js");
const generateContextFromTests = require("../../utils/test/generateContextFromTests.js");
const generateTestTitle = require("../../utils/test/generateTestTitle.js");
const generatePlaceholderBlock = require("../../utils/test/generatePlaceholderBlock.js");
const {
  VERIFY_POPULATED_DATA_USERS,
  VERIFY_POPULATED_DATA_FORUMS,
  VERIFY_POPULATED_DATA_THREADS,
  VERIFY_POPULATED_DATA_THREAD_COMMENTS,
  verifyPopulatedData,
} = require("../../utils/test/verifyPopulatedData.js");

const addUsersToDB = require("../../user/test/populateUsers.js");
const addForumsToDB = require("../../forum/test/populateForums.js");

const {
  deleteThread,
  verifyDBDeleteThread,
  verifyCacheDeleteThread,
} = require("./verifyDeleteThread.js");
const {
  verifyDBDeleteCommentParent,
  verifyCacheDeleteCommentParent,
} = require("../../comment/test/verifyDeleteParent.js");

const userCount = 1;
const forumCount = 1;
const threadCount = 1;
const commentCount = 5;
let deletedThreadParentId, deletedThreadId, deletedThreadCreatorId;

let mainSuite =
  describe("DELETE /api/threads/forum/:forumId/thread/:threadId", () => {
    before(async () => {
      // populate users, forums, thread, and comments
      const userIds = (await addUsersToDB(userCount)).map((user) => user._id);

      const addForumsResult = await addForumsToDB(
        forumCount,
        userIds,
        threadCount,
        commentCount,
      ).catch((error) => console.error(error));

      const forumIds = addForumsResult.forumData.map((forum) => forum._id);
      const threads = addForumsResult.threadData;
      const threadIds = threads.map((thread) => thread._id);
      const threadCommentIds = addForumsResult.threadComments.map(
        (comment) => comment._id,
      );

      // verify populated data
      mainSuite.suites.push(
        verifyPopulatedData(
          [
            VERIFY_POPULATED_DATA_USERS,
            VERIFY_POPULATED_DATA_FORUMS,
            VERIFY_POPULATED_DATA_THREADS,
            VERIFY_POPULATED_DATA_THREAD_COMMENTS,
          ],
          {
            userIds,
            forumIds,
            threadIds,
            threadCommentIds,
          },
        ),
      );

      // generate and dynamically add test to verify data before and after deletion of thread
      deletedThreadParentId = threads[0].parent_id;
      deletedThreadId = threads[0]._id;
      deletedThreadCreatorId = threads[0].creator_id;

      mainSuite.suites.push(generateDeleteThreadTestContext(false));
      mainSuite.suites.push(generateDeleteThreadTestContext(true));
    });

    // clean up and exit
    after(exitAfterTest);

    generatePlaceholderBlock();
  });

// generate contexts for thread deletion tests
function generateDeleteThreadTestContext(deleted) {
  return generateContextFromTests(
    deleted,
    "deleting",
    generateDeleteThreadTests(deleted),
  );
}

// generate tests for thread deletion
function generateDeleteThreadTests(deleted) {
  // test cases
  // before deleting:
  //      thread should be present in database and cache
  //      comments should be present in database and cache
  // after deleting:
  //      thread should not be present in database nor cache
  //      comments should not be present in database nor cache
  const tests = [
    // check if thread exists in database and cache
    {
      title: generateTestTitle(deleted, "thread", true),
      callback: verifyDBDeleteThread,
      params: [deletedThreadId, deleted],
    },
    {
      title: generateTestTitle(deleted, "thread", false),
      callback: verifyCacheDeleteThread,
      params: [deletedThreadParentId, deletedThreadId, deleted],
    },
    // check if comments exist in database and cache
    {
      title: generateTestTitle(deleted, "comments", true),
      callback: verifyDBDeleteCommentParent,
      params: [deletedThreadId, deleted],
    },
    {
      title: generateTestTitle(deleted, "comments", false),
      callback: verifyCacheDeleteCommentParent,
      params: [deletedThreadId, PARENT_MODEL_THREAD, deleted],
    },
  ];

  // if to delete then add test to send delete request
  if (deleted) {
    tests.unshift({
      title: "should return 200",
      callback: deleteThread,
      params: [deletedThreadParentId, deletedThreadId, deletedThreadCreatorId],
    });
  }

  return tests;
}
