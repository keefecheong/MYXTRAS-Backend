// controller functions to handle GET requests for threads

const Thread = require('../../models/thread.js');

const getForumQuery = require('../../utils/forums/getForumQuery.js');
const { getCreatedForumKey, getSubscribedForumKey } = require('../../cache/forums/forumCache.js');

const { getThreadQuery, getAggFunction } = require('../../utils/threads/getThreadQuery.js');
const { checkThreadAttributesAll } = require('../../utils/threads/checkAttributes.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const { getForumThreadKey, getPopularThreadKey } = require('../../cache/threads/threadCache.js');

// get threads associated with a forum
async function getForumThreads(req, res) {
    try {
        const forumId = req.params.forumID;

        var threads = await getThreadQuery({
            parent_id: forumId
        }, null, true, {
            key: getForumThreadKey(forumId)
        });

        threads = checkThreadAttributesAll(threads, req.user._id);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

// get popular threads
async function getPopularThreads(req, res) {
    try {
        const agg = getAggFunction(req.user.interests, 6);

        const tags = req.user.interests.length > 0 ? req.user.interests.join('-') : 'default';

        var threads = await Thread.aggregate(agg).cache({
            key: getPopularThreadKey(tags),
            // set path to get max 6 threads from cache
            path: '$[0:6]',
            type: 'popular'
        });

        threads = checkThreadAttributesAll(threads, req.user._id);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

// get threads for explore page
async function getExploreThreads(req, res) {
    try {
        const agg = getAggFunction(req.user.interests, 50);

        const tags = req.user.interests.length > 0 ? req.user.interests.join('-') : 'default';

        var threads = await Thread.aggregate(agg).cache({
            key: getPopularThreadKey(tags),
            type: 'explore'
        });

        threads = checkThreadAttributesAll(threads, req.user._id);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// get recent threads
async function getRecentThreads(req, res) {
    try {
        const userId = req.user._id;

        // reuse getForumQuery to craft queries for getting forums created by the requesting user or subscribed by the requesting user with cache
        const createdForumQuery = getForumQuery({
            creator_id: userId
        }, true, {
            key: getCreatedForumKey(userId)
        });
        
        const subscribedForumQuery = getForumQuery({
            subscribers: { $in: [userId] }
        }, true, {
            key: getSubscribedForumKey(userId)
        });
        
        // get id of forums created by the requesting user or subscribed by the requesting user
        const forumIds = await Promise.all([
            createdForumQuery,
            subscribedForumQuery
        ]).then(results => {
            const merged = [].concat(...results);
            return merged.map(forum => forum._id);
        });

        const queries = [];

        for (let i = 0; i < forumIds.length; i++) {
            const forumId = forumIds[i];

            queries.push(getThreadQuery({
                parent_id: forumId
            }, null, true, {
                key: getForumThreadKey(forumId)
            }));
        }

        // execute all queries, merge and sort the threads in descending creation_time
        var threads = await Promise.all(queries).then(results => {
            const merged = [].concat(...results);
            return merged.sort((a, b) => {
                const creationA = new Date(a.creation_time);
                const creationB = new Date(b.creation_time);

                return creationB - creationA;
            });
        });

        threads = checkThreadAttributesAll(threads, userId);

        returnGoodReq(res, threads);
    }
    catch (error) {
        returnServerErrorReq(res);    
    }
}

module.exports = {
    getForumThreads,
    getPopularThreads,
    getExploreThreads,
    getRecentThreads
}