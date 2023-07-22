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
        const options = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          };
          
        const formattedDate = last_checkin_date.toLocaleString("en-GB", options);
        console.log(formattedDate);
        
        const current_date = new Date()
        current_date.setHours(0, 0, 0, 0); // Set time to midnight
        
        let checkin_count = user.checkin_count;
        let claimed = user.claimed;

        const updatedValues = {};

        const differenceInMilliseconds = Math.abs(current_date - last_checkin_date);
        const millisecondsInOneDay = 24 * 60 * 60 * 1000;
        console.log(current_date > last_checkin_date)
        // If last check in surpasses a day, reset counter
        if (differenceInMilliseconds >= millisecondsInOneDay && !user.claimed) {
            claimed = false;
            updatedValues.claimed = claimed;

            checkin_count = 1;
            updatedValues.checkin_count = checkin_count; // reset checkIn count
        
        // If its a new day, add to counter and reset claimed
        } else if (current_date > last_checkin_date && user.claimed) {
            claimed = false;
            updatedValues.claimed = claimed;
            
            checkin_count = user.checkin_count + 1;
            updatedValues.checkin_count = checkin_count;
        }
        
        // update cache with newly saved user
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        const data = {checkin_count: checkin_count, claimed: claimed}
        returnGoodReq(res, data);

    }
    catch (error) {
        console.log(error)
        returnServerErrorReq(res, );
    }
}
async function checkIn(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        
        const current_date = Date.now()
        const checkin_count = user.checkin_count;
        const updatedValues = {};

        if (checkin_count == 7) {
            updatedValues.checkin_count = 1;
        }

        updatedValues.gems = user.gems + rewards[checkin_count - 1];
        updatedValues.last_checkin_date = current_date;
        updatedValues.claimed = true;

        // update cache
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

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