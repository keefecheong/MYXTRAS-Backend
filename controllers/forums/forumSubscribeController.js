// controller functions to subscribe/unsubscribe from forums

const Forum = require('../../models/forum.js');

const returnCreatedReq = require('../../utils/general/returnCreatedReq.js');
const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const compareId = require('../../utils/general/compareId.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const { cachedForumAddSubscriber, cachedForumRemoveSubscriber } = require('../../cache/forums/forumSubscribeCache.js');

// subscribe to forum
async function subscribeToForum(req, res) {
    try {
        const userId = req.user._id;

        // check if the requesting user has subscribed to the forum already
        const subscribed = res.forum.subscribers.find(creator_id => compareId(creator_id, userId));

        if (subscribed) {
            return returnBadReq(res, 'You have already subscribed to this forum.');
        }

        // convert forum to mongoose document to perform operations
        const forum = new Forum(res.forum);
        forum.isNew = false;

        // update forum subscriber list
        forum.subscribers.push(userId);
        
        // update cached forum
        const updateCacheResult = await cachedForumAddSubscriber(forum._id, userId);

        // save forum asynchronously if cache is updated successfully, and synchronously otherwise
        await saveDocAsync(forum, updateCacheResult);

        returnCreatedReq(res);
    } catch (error) {
        returnServerErrorReq(res);
    }
}

// unsubscribe from forum
async function unsubscribeFromForum(req, res) {
    try {
        const userId = req.user._id;

        // check if the requesting user has subscribed to the forum already
        const subscriberIndex = res.forum.subscribers.findIndex(creator_id => compareId(creator_id, userId));

        // if the user has not subscribed to the forum return 400 error
        if (subscriberIndex == -1) {
            return returnBadReq(res, 'You have not subscribed to this forum yet.');
        }

        // convert forum to mongoose document to perform operations
        const forum = new Forum(res.forum);
        forum.isNew = false;

        // remove user id from the forum subscriber list
        forum.subscribers.splice(subscriberIndex, 1);

        // update cached forum
        const updateCacheResult = await cachedForumRemoveSubscriber(forum._id, userId, true);

        // save forum asynchronously if cache is updated successfully, and synchronously otherwise
        await saveDocAsync(forum, updateCacheResult);
        
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