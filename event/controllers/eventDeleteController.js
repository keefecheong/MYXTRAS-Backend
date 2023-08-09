// controller functions to handle DELETE requests for events
const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnUnauthorizedReq = require('../../utils/returnReq/returnUnauthorizedReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

const deleteEventUtil = require('../utils/deleteEvent.js');

// to delete a forum
async function deleteEvent(req, res) {
    const eventId = req.params.eventID;

    if (!req.user.is_admin) {
        return returnUnauthorizedReq(res);
    }

    try {
        // delete event and database
        await deleteEventUtil(eventId);

        returnGoodReq(res, { message: 'Event removed.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    deleteEvent
}