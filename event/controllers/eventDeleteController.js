// controller functions to handle DELETE requests for events

const Event = require('../models/event.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/returnReq/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

// to delete a forum
async function deleteEvent(req, res) {
    const eventId = req.params.eventId;

    if (!req.user.is_admin) {
        return returnUnauthorizedReq(res);
    }

    try {
        // delete event and database
        await Event.findByIdAndDelete(eventId);

        returnGoodReq(res, { message: 'Event removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteEvent
}