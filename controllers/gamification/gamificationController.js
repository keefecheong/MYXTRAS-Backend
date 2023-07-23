// controller functions to handle user profile related requests

const { User } = require('../../models/user.js');

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
            if (task.title.startsWith('Like 5 threads')){
                daily_missions.push({
                    'title': task.title,
                    'gem_count': missions.missions[task.title],
                    'claimed': task.claimed,
                    'locked': task.locked
                })
            }
            else{
                daily_missions.push({
                    'title': task.title,
                    'gem_count': missions.missions[task.title],
                    'claimed': task.claimed,
                    'locked': task.locked
                });
            }
        }
        console.log(user.gems)
        returnGoodReq(res, daily_missions);
        

    }
    catch (error) {
        returnServerErrorReq(res);
    }
    
}

async function claimMissions(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        const tasks = user.daily_missions;
       

        const updatedValues = {};
        const title = req.params.title
        const targetTaskIndex = tasks.findIndex(task => task.title.substring(0, task.title.startsWith(title)));
        if (targetTaskIndex !== -1){
            tasks[targetTaskIndex].claimed = true;
        }
        const gems = missions.missions[title]
        updatedValues.daily_missions = tasks;
        updatedValues.gems = user.gems + gems

        // update cache
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        returnGoodReq(res);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}


module.exports = {
    getMissions,
    claimMissions
}