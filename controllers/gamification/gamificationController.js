// controller functions to handle user profile related requests

const { User } = require('../../models/user.js');
const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const checkBlocked = require('../../utils/users/checkBlocked.js');

const { getUserKey } = require('../../cache/users/userCache.js');

const missions = require('../../utils/gamification/config.json');

async function getMissions(req, res) {
    try{
        const user = req.user;
        const daily_missions = [];
        for (const task of user.daily_missions) {
            daily_missions.push({
                'title': task,
                'gem_count': missions.missions[task]
              });
        }
        // console.log(user.daily_missions)

        returnGoodReq(res, daily_missions);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}


module.exports = {
    getMissions
}