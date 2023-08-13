const mongoose = require("mongoose");
const Chat = require("./chat.js");
const { deleteFiles } = require("../../utils/s3/s3Delete.js");

const messageSchema = new mongoose.Schema({
  creator_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  content: {
    type: String,
    // specify content to be required only if file_link is empty
    required: function () {
      return !this.file_link;
    },
  },
  creation_time: {
    type: Date,
    immutable: true,
    default: function () {
      return Date.now();
    },
  },
  last_modified_time: {
    type: Date,
    default: function () {
      return this.creation_time;
    },
  },
  chat_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Chat",
    required: true,
    immutable: true,
  },
  file_link: {
    type: String,
    // specify file_link to be required only if content is empty
    required: function () {
      return !this.content;
    },
  },
  original_name: {
    type: String,
    // specify original_name to be required only if file_link is provided
    required: function () {
      return this.file_link;
    },
  },
  file_type: {
    type: String,
    // specify original_name to be required only if file_link is provided
    required: function () {
      return this.file_link;
    },
  },
  reply_message: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Message",
  },
});

// custom query to get details of reply_message
messageSchema.query.getReplyMessage = function () {
  return this.populate({
    path: "reply_message",
    select: "-creation_time -last_modified_time -reply_message -chat_id -__v",
  });
};

// automatically update parent chat's last_message_timestamp for new messages
messageSchema.post("save", async function (doc, next) {
  if (!doc.isNew) {
    return next();
  }

  Chat.findByIdAndUpdate(doc.chat_id, {
    last_message_timestamp: doc.creation_time,
  }).catch((error) => console.log(error));

  next();
});

// on delete automatically clean up files associated with the message if any
messageSchema.post("findOneAndDelete", function (doc, next) {
  if (!doc.file_link) {
    return next();
  }

  try {
    // delete associated files
    deleteFiles(doc.file_link);

    next();
  } catch (error) {
    console.log(error);
  }
});

module.exports = mongoose.model("Message", messageSchema);
