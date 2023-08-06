// to update user tasks in cache and database based on given task title

const { User } = require('../../user/models/user.js');
const { updateCachedUser } = require('../../user/cache/userUpdateCache.js');

const saveDocAsync = require('../../utils/general/saveDocAsync.js');

module.exports = async function updateUserTasks(user, taskTitle, decreaseTaskCount) {
    const targetTaskIndex = user.daily_missions.findIndex(task => task.title.startsWith(taskTitle));
    if (targetTaskIndex == -1) return;

    let setLockedFalse = true;
   
    // decrease remaining task count where appropriate
    if (taskTitle = 'Like 5 threads') {
        const actualTaskTitle = user.daily_missions[targetTaskIndex].title;
        const openParenthesisIndex = actualTaskTitle.indexOf('(');
        const closeParenthesisIndex = actualTaskTitle.indexOf(')');

        if (openParenthesisIndex !== -1 && closeParenthesisIndex !== -1) {
            const currentTaskCount = parseInt(actualTaskTitle.substring(openParenthesisIndex + 1, closeParenthesisIndex), 10);
            if (currentTaskCount <= 5 && currentTaskCount > 0){
                // decrease the current task count by 1
                user.daily_missions[targetTaskIndex].title = actualTaskTitle.replace(`(${currentTaskCount})`, `(${currentTaskCount - 1})`);
                console.log(user.daily_missions[targetTaskIndex].title);
                if (currentTaskCount == 0) {
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