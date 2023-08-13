const mongoose = require("mongoose");
const Message = require("./message.js");
const { deleteFiles } = require("../../utils/s3/s3Delete.js");

const chatSchema = new mongoose.Schema({
  users: {
    type: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
      },
    ],
    required: true,
  },
  last_message_timestamp: {
    type: Date,
    default: function () {
      return Date.now();
    },
  },
});

// custom query to get details of the other user
chatSchema.query.getUser = function (userId) {
  return this.populate({
    path: "users",
    select: "username profile_pic_link blocked_users.user_id",
    match: { _id: { $ne: userId } },
  });
};

// to delete all chats enrolled by a user
chatSchema.statics.deleteByUser = async function (userId) {
  const filter = { users: { $in: [userId] } };

  const chats = await this.find(filter, { _id: 1 });

  // delete chats enrolled by the user
  const deleteChatsPromise = this.deleteMany(filter);

  // clean up message data
  const cleanUpMessages = this.cleanUpOnDeleteChat(
    chats.map((chat) => chat._id),
  );

  return { deleteChatsPromise, cleanUpMessages };
};

// to clean up all messages and associated files
chatSchema.statics.cleanUpOnDeleteChat = async function (chatIds) {
  const messageWithFiles = await Message.find(
    {
      chat_id: { $in: chatIds },
      file_link: { $exists: true },
    },
    { file_link: 1 },
  );

  // delete files from messages in the chats to delete
  deleteFiles(messageWithFiles.map((message) => message.file_link));

  // delete messages in the chats to delete
  return Message.deleteMany({ chat_id: { $in: chatIds } });
};

module.exports = mongoose.model("Chat", chatSchema);
