// to update user tasks in cache and database based on given task title

const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const saveDocAsync = require('../cache/saveDocAsync.js');

module.exports = async function updateUserTasks(user, taskTitle) {
    const targetTaskIndex = user.daily_missions.findIndex(task => task.title === taskTitle);
    
    if (targetTaskIndex !== -1){
        user.daily_missions[targetTaskIndex].locked = false;

        const updatedValues = {
            daily_missions: user.daily_missions
        };
        
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);
    }
}