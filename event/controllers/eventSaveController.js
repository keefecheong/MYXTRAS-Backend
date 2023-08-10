// controller functions for creation and update of event

const Event = require('../models/event.js');

const { uploadImages, UPLOAD_TYPE_EVENT } = require('../../utils/s3/s3Upload.js');
const { deleteFiles } = require('../../utils/s3/s3Delete.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnBadReq = require('../../utils/returnReq/returnBadReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

// create a new event
async function createEvent(req, res) {
    // check if images and text fields are provided in the body
    // if provided, continue to create post
    // otherwise return 400 error
    if (req.files.length <= 0) {
        return returnBadReq(res, 'Event banner are required');
    }

    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    try {
        const creatorId = req.user._id;
        const { event_name, event_desc, event_date, event_location, event_color } = JSON.parse(req.body.eventObject);

        const newEvent = new Event({
            user_id: creatorId,
            event_name: event_name,
            event_desc: event_desc,
            event_date: event_date,
            event_location: event_location,
            event_color: event_color
        });

        // upload images
        const imageLinks = [];
        const eventBannerUploadSuccessful = await uploadImages(req.files, imageLinks, newEvent._id, UPLOAD_TYPE_EVENT);

        // if unsuccessful return internal server error
        if (!eventBannerUploadSuccessful) {
            return returnServerErrorReq(res);
        }

        // add image links to new event
        newEvent.banner_link = imageLinks[0];

        // save new event to database
        await newEvent.save();

        returnGoodReq(res, newEvent)
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// update an existing event
async function updateEvent(req, res) {
    // check if text fields are provided in the body
    // if provided, continue to create event
    // otherwise return 400 error
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    // check if images are provided if 'bannerUnchanged' are not set to 'true'
    // if provided, continue to update event
    // otherwise return 400 error
    if (req.files.length <= 0 && req.body.bannerUnchanged != 'true') {
        return returnBadReq(res, 'Event banner is required.');
    }

    try {
        // update fields
        const { event_name, event_desc, event_date, event_location, event_color } = JSON.parse(req.body.eventObject);

        // convert forum to mongoose document to perform operations
        const event = new Event(res.event);
        event.isNew = false;

        // update fields and add to updatedValues if changed
        if (event_name != event.event_name) {
            event.event_name = event_name;
        }
        
        if (event_desc != event.event_desc) {
            event.event_desc = event_desc;
        }
        
        if (event_date != event.event_date) {
            event.event_date = event_date;
        }

        if (event_location != event.event_location) {
            event.event_location = event_location;
        }

        if (event_color != event.event_color) {
            event.event_color = event_color;
        }

        const newImageLinks = [];

        // upload new event banner if exists
        if (req.body.bannerUnchanged != 'true') {
            const uploadSuccessful = await uploadImages([req.files[index]], newImageLinks, event._id, UPLOAD_TYPE_EVENT);
    
            // if failed to upload images then send error message
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }
    
            // otherwise delete old picture and update banner_link
            deleteFiles(event.banner_link);
    
            event.banner_link = newImageLinks[0];
        }

        // save updated event to database
        await event.save();

        returnGoodReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    createEvent,
    updateEvent
}