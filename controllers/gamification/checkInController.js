// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const missions = require('../../utils/gamification/config.json');

async function checkIn(req, res) {
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
    checkIn
}