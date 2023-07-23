// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const missions = require('../../utils/gamification/config.json');

const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const saveDocAsync = require('../../utils/cache/saveDocAsync.js');



async function getMissions(req, res) {
    try{
        const user = req.user;
        const daily_missions = [];
        for (const task of user.daily_missions) {
            daily_missions.push({
                'title': task.title,
                'gem_count': missions.missions[task.title],
                'claimed': task.claimed,
                'locked': task.locked
            });
            
        }
        console.log(daily_missions)
        returnGoodReq(res, daily_missions);
        

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}


module.exports = {
    getMissions
}