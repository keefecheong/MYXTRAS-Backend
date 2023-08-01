// to update user tasks in cache and database based on given task title

const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');
const { User } = require('../../models/user.js');

const saveDocAsync = require('../cache/saveDocAsync.js');

module.exports = async function updateUserTasks(user, taskTitle, decreaseTaskCount) {
    const targetTaskIndex = user.daily_missions.findIndex(task => task.title.startsWith(taskTitle));
    
    if (targetTaskIndex == -1) return;

    let setLockedFalse = true;

    // decrease remaining task count where appropriate
    if (decreaseTaskCount) {
        const actualTaskTitle = user.daily_missions[targetTaskIndex].title;

        const openParenthesisIndex = actualTaskTitle.indexOf('(');
        const closeParenthesisIndex = actualTaskTitle.indexOf(')');

        if (openParenthesisIndex !== -1 && closeParenthesisIndex !== -1) {
            const currentTaskCount = parseInt(actualTaskTitle.substring(openParenthesisIndex + 1, closeParenthesisIndex), 10);

            if (currentTaskCount <= 5 && currentTaskCount > 0){
                // decrease the current task count by 1
                user.daily_missions[targetTaskIndex].title = actualTaskTitle.replace(`(${currentTaskCount})`, `(${currentTaskCount - 1})`);

                if (decrementedNumber != 0) {
                    setLockedFalse = false;
                }
            }
        }
    }
    
    if (setLockedFalse) {
        user.daily_missions[targetTaskIndex].locked = false;
    }

    const updatedValues = {
        daily_missions: user.daily_missions
    };
    
    // update cache
    const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);

    // update db
    const docUser = new User(user);
    docUser.isNew = false;

    await saveDocAsync(docUser, updateCacheResult);
}