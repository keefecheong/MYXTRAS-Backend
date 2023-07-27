// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { User } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

const missions = require('../../utils/gamification/config.json');
const rewards = [50, 100, 100, 100, 150, 200, 500];

async function getCheckInData(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        const last_checkin_date = user.last_checkin_date;
        
        const current_date = new Date()
        // Set time to midnight
        current_date.setHours(0, 0, 0, 0); 

        const updatedValues = {};

        const differenceInMilliseconds = Math.abs(current_date - last_checkin_date);
        const millisecondsInOneDay = 24 * 60 * 60 * 1000;

        // If last check in surpasses a day or last day of the week, reset counter
        if (differenceInMilliseconds >= millisecondsInOneDay && !user.claimed || user.checkin_count == 7) {
           
            updatedValues.claimed = false;
            updatedValues.checkin_count = 1; // reset checkIn count
        
        // If its a new day, add to counter and reset claimed
        } else if (current_date > last_checkin_date && user.claimed) {
            updatedValues.claimed = false;
            user.checkin_count = user.checkin_count + 1;
            updatedValues.checkin_count = user.checkin_count;
        }

        // update cache with newly saved user
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        const data = {checkin_count: user.checkin_count, claimed: user.claimed}
        returnGoodReq(res, data);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}
async function checkIn(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        
        const current_date = Date.now()
        const checkin_count = user.checkin_count;
        const updatedValues = {};

        updatedValues.gems = user.gems + rewards[checkin_count - 1];
        updatedValues.last_checkin_date = current_date;
        updatedValues.claimed = true;
        user.claimed = true;
        user.gems = updatedValues.gems;

        // update cache
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);
        console.log(user)

        returnGoodReq(res);

    }
    catch (error) {
        console.log(error)
        returnServerErrorReq(res);
    }
}


module.exports = {
    getCheckInData,
    checkIn
}