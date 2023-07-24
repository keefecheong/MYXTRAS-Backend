// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { User } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');
const saveDocAsync = require('../../utils/cache/saveDocAsync.js');


async function getGemsAndPets(req, res) {
    try{
        const gems = req.user.gems;
        returnGoodReq(res, gems);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}
async function rollGacha(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        
        const current_date = Date.now()
        const checkin_count = user.checkin_count;
        const updatedValues = {};

        updatedValues.gems = user.gems + rewards[checkin_count - 1];
        updatedValues.last_checkin_date = current_date;
        updatedValues.claimed = true;

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
    getGemsAndPets,
    rollGacha
}