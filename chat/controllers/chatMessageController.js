// controller functions to get chat messages

const Chat = require("../models/chat.js");
const Message = require("../models/message.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

const {
  retrieveMessages,
  formatMessages,
} = require("../utils/retrieveMessages.js");
const getAggFunction = require("../utils/getAggFunction.js");

// get stored messages for the specifically requested chat
async function getChatMessages(req, res) {
  try {
    // get <count> messages associated with the requested chat
    const messages = await retrieveMessages(
      {
        chat_id: res.chat._id,
      },
      req.params.count,
      req.user._id,
    );

    returnGoodReq(res, messages);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get last 50 messages from each of the top 5 last used chats
async function getLatestMessages(req, res) {
  try {
    // get id of top 5 latest used chats (based on last_message_timestamp) that the requesting user is a member of
    const latestChats = await Chat.find({ users: req.user._id }, { _id: 1 })
      .sort({ last_message_timestamp: -1 })
      .limit(5);

    const result = {};

    // get latest 50 messages for each of the top 5 latest used chats
    for (let i = 0; i < latestChats.length; i++) {
      const messages = await retrieveMessages(
        {
          chat_id: latestChats[i]._id,
        },
        50,
        req.user._id,
      );

      // format the messages and add to result in ascending creation_time
      result[latestChats[i]._id] = messages;
    }

    returnGoodReq(res, { data: result });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get additional messages from chat
async function getPreviousMessages(req, res) {
  try {
    // decode URI encoded timestamp
    const decodedTimestamp = decodeURIComponent(req.params.oldestMessageTime);

    // get <count> more messages before the message with the creation_time of <oldestMessageTime> from the specified chat
    const messages = await retrieveMessages(
      {
        chat_id: res.chat._id,
        creation_time: {
          $lt: new Date(decodedTimestamp),
        },
      },
      req.params.count,
      req.user._id,
    );

    returnGoodReq(res, messages);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

// get messages for admin panel reports
async function getReportMessages(req, res) {
  const agg = getAggFunction(req.params.messageId);

  try {
    var messages = await Message.aggregate(agg);
    messages = formatMessages(messages[0].messages, req.params.userId);

    returnGoodReq(res, messages);
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  getChatMessages,
  getLatestMessages,
  getPreviousMessages,
  getReportMessages,
};
