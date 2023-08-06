// controller functions to handle user profile related requests

const { User } = require('../../user/models/user.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const missions = require('../utils/config.json');

const { updateCachedUser } = require('../../user/cache/userUpdateCache.js');

const saveDocAsync = require('../../utils/general/saveDocAsync.js');

async function getMissions(req, res) {
    try{
        const user = req.user;
        const daily_missions = [];
        const allClaimed = {'claimed': false, 'locked': true};
        if (user.allClaimed){
            allClaimed = user.allClaimed;
        }
        for (const task of user.daily_missions) {            
            if (task.title.startsWith('Like 5 threads')){
                daily_missions.push({
                    'title': task.title,
                    'gem_count': missions.missions['Like 5 threads (5)'],
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
        
        returnGoodReq(res, {daily_missions, allClaimed});
        

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
        const allClaimed = user.allClaimed;
       
        let gems = 0;
        const updatedValues = {};
        const title = req.params.title
        if (title == 'allClaim'){
            gems = 500
            allClaimed.claimed = true;
            allClaimed.locked = false;
            updatedValues.allClaimed = allClaimed;
        }
        else{
            const targetTaskIndex = tasks.findIndex(task => task.title.substring(0, task.title.startsWith(title)));
            if (targetTaskIndex !== -1){
                tasks[targetTaskIndex].claimed = true;
            }
            if (title.startsWith("Like 5 threads")){
                gems = missions.missions["Like 5 threads (5)"]
            }
            else{
                gems = missions.missions[title];
            }
            updatedValues.daily_missions = tasks;

        }
        
        updatedValues.gems = user.gems + gems;


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