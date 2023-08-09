// to delete a event
const Event = require('../models/event.js');

module.exports = async function deleteEventUtil(eventId) {
    // delete event database
    return Event.findByIdAndDelete(eventId);
}