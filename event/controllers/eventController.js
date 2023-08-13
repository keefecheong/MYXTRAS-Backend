// controller functions to get events

const Event = require("../models/event.js");
const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

// get all enrolled chats of the requesting user
async function getAllEvents(req, res) {
  try {
    const events = await Event.find().sort({ event_date: -1 }).lean();

    returnGoodReq(res, { events: events });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  getAllEvents,
};
