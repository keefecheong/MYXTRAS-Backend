// controller functions to handle user profile related requests

const { User } = require('../../user/models/user.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const missions = require('../utils/config.json');

const { updateCachedUser } = require('../../user/cache/userUpdateCache.js');

const saveDocAsync = require('../../utils/general/saveDocAsync.js');

async function selectPet(req, res) {
    try{
        const user = new User(req.user);
        user.isNew = false;
        
        const updatedValues = {};
        const pet = req.params.pet;
        storedPet = user.pets
        storedPet.chosen_pet = pet
        updatedValues.pets = storedPet;

        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        returnGoodReq(res);        
    }
    catch(error){
        returnServerErrorReq(res);
    }
    
}



module.exports = {
    selectPet
}