// controller functions for creation and update of threads

const Thread = require("../models/thread.js");

const {
  uploadImages,
  UPLOAD_TYPE_THREAD,
} = require("../../utils/s3/s3Upload.js");
const { deleteFiles } = require("../../utils/s3/s3Delete.js");

const returnCreatedReq = require("../../utils/returnReq/returnCreatedReq.js");
const returnNoContentReq = require("../../utils/returnReq/returnNoContentReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnUnauthorizedReq = require("../../utils/returnReq/returnUnauthorizedReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");
const compareId = require("../../utils/general/compareId.js");

const {
  cacheNewThread,
  updateCachedThread,
} = require("../cache/threadUpdateCache.js");
const saveDocAsync = require("../../utils/general/saveDocAsync.js");

const updateUserTasks = require("../../gamification/utils/updateUserTasks.js");

const moderateText = require("../../admin/utils/moderation/moderateText.js");
const moderateImage = require("../../admin/utils/moderation/moderateImage.js");
const {
  createReportAfterModeration,
} = require("../../report/utils/createReport.js");
const { REPORT_TARGET_TYPE_THREAD } = require("../../report/models/report.js");

// create new thread
async function createThread(req, res) {
  // check if request body is empty
  // if request body is empty return 400 error, otherwise continue to create thread
  if (!req.body) {
    return returnBadReq(res, "Invalid request body");
  }

  try {
    const threadObject = JSON.parse(req.body.threadObject);

    const { title, content, tags } = threadObject;

    const forumId = req.params.forumId;

    const creator = req.user;
    const creatorId = req.user._id;

    // create new thread
    const newThread = new Thread({
      parent_id: forumId,
      creator_id: creatorId,
      title: title,
      content: content,
      tags: tags,
    });

    // save images if provided
    if (req.files.length > 0) {
      const newImageLinks = [];

      const threadPicUploadSuccessful = await uploadImages(
        req.files,
        newImageLinks,
        newThread._id,
        UPLOAD_TYPE_THREAD,
      );

      // if upload not successful then delete the new thread
      if (!threadPicUploadSuccessful) {
        return returnServerErrorReq(res);
      }

      newThread.content_link = newImageLinks[0];
    }

    const userDetails = {
      _id: creatorId,
      username: creator.username,
      profile_pic_link: creator.profile_pic_link,
    };

    const forumDetails = {
      _id: forumId,
      forum_name: res.forum.forum_name,
      forum_id: res.forum.forum_id,
      forum_pic_link: res.forum.forum_pic_link,
    };

    // moderate text and images
    const moderationPromises = [
      moderateImage(newThread.content_link),
      moderateText(title + " " + content),
    ];

    createReportAfterModeration(
      moderationPromises,
      newThread._id,
      REPORT_TARGET_TYPE_THREAD,
      creatorId,
      { forumId },
    );

    // update cache if key exists
    const updateCacheResult = await cacheNewThread(
      newThread,
      userDetails,
      forumDetails,
    );

    // update database asynchronously if cache is updated successfully and synchronously otherwise
    await saveDocAsync(newThread, updateCacheResult);

    // update user tasks
    updateUserTasks(creator, "Start a new thread discussion");

    returnCreatedReq(res);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// update thread
async function updateThread(req, res) {
  // check if request body is empty
  // if request body is empty return 400 error, otherwise continue to update thread
  if (!req.body) {
    return returnBadReq(res, "Invalid request body");
  }

  // check if images are provided if 'pictureUnchanged' is not set to 'true'
  // if provided, continue to update thread
  // otherwise return 400 error
  if (req.files.length <= 0 && req.body.pictureUnchanged != "true") {
    return returnBadReq(res, "No changes detected.");
  }

  // check if the creator of the thread is the requesting user
  // if creator is not the requesting user then return 401 error
  if (!compareId(req.user._id, res.thread.creator_id._id)) {
    return returnUnauthorizedReq(res);
  }

  try {
    const { title, content, tags } = JSON.parse(req.body.threadObject);

    // convert thread to mongoose document to perform operations
    const thread = new Thread(res.thread);
    thread.isNew = false;

    const creatorId = thread.creator_id._id;
    const forumId = thread.parent_id._id;
    const threadId = thread._id;

    const updatedValues = {};

    // update fields and add to updatedValues if changed
    if (title != thread.title) {
      thread.title = title;
      updatedValues.title = title;
    }

    if (content != thread.content) {
      thread.content = content;
      updatedValues.content = content;
    }

    if (tags != thread.tags) {
      thread.tags = tags;
      updatedValues.tags = tags;
    }

    // save image if changed
    if (req.body.pictureUnchanged != "true") {
      const newImageLinks = [];

      const threadPicUploadSuccessful = await uploadImages(
        req.files,
        newImageLinks,
        threadId,
        UPLOAD_TYPE_THREAD,
      );

      // if upload not successful then return 500 error
      if (!threadPicUploadSuccessful) {
        return returnServerErrorReq(res);
      }

      // otherwise delete old image and set new image link
      deleteFiles(thread.content_link);

      thread.content_link = newImageLinks[0];
      updatedValues.content_link = newImageLinks[0];
    }

    // moderate text and images if changed
    const moderationPromises = [
      moderateImage(updatedValues?.content_link),
      moderateText(`${updatedValues?.title} ${updatedValues?.content}`),
    ];

    createReportAfterModeration(
      moderationPromises,
      threadId,
      REPORT_TARGET_TYPE_THREAD,
      creatorId,
      { forumId },
    );

    // update cache entry if thread is in cache
    const updateCacheResult = await updateCachedThread(
      updatedValues,
      forumId,
      threadId,
      res.threadFromCache,
    );

    // update database asynchronously if cache is updated successfully and synchronously otherwise
    await saveDocAsync(thread, updateCacheResult);

    returnNoContentReq(res, { message: "Thread updated." });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  createThread,
  updateThread,
};
