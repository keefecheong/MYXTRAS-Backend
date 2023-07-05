// controller functions to subscribe/unsubscribe from forums

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// subscribe to forum
async function subscribeToForum(req, res) {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribed = res.forum.subscribers.find(creator_id => creator_id.equals(req.user._id));

        if (subscribed) {
            return returnBadReq(res, 'You have already subscribed to this forum.');
        }

        // update forum subscriber list
        res.forum.subscribers.push(req.user._id);

        await res.forum.save();
        returnCreatedReq(res);
    } catch (error) {
        returnServerErrorReq(res);
    }
}

// unsubscribe from forum
async function unsubscribeFromForum(req, res) {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribedIndex = res.forum.subscribers.findIndex(creator_id => creator_id.equals(req.user._id));

        // if the user has not subscribed to the forum return 400 error
        if (subscribedIndex == -1) {
            return returnBadReq(res, 'You have not subscribed to this forum yet.');
        }

        // remove user id from the forum subscriber list
        res.forum.subscribers.splice(subscribedIndex, 1);

        await res.forum.save();
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    subscribeToForum,
    unsubscribeFromForum
}