// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const petsArray = require('../../utils/gamification/pets.json');
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
    const numOfRolls = req.params.numOfRolls
    // Set the probabilities for each rarity
    const ultraRareProbability = 0.05; // 5%
    const rareProbability = 0.1; // 10%
    const rolledPets = [];
    const savedPets = [];
    try{
        for (let i = 1; i <= numOfRolls; i++){
            const random = Math.random();
        
            // Determine the rarity of the pet
            let rarity;
            if (random < ultraRareProbability) {
                rarity = 'ultra rare';
            } else if (random < ultraRareProbability + rareProbability) {
                rarity = 'rare';
            } else {
                rarity = 'common';
            }

            // Get all the pets with the same rarity
            const availablePets = petsArray.filter((pet) => pet.rarity === rarity);

            // Randomly choose a pet from the available ones
            const randomPetIndex = Math.floor(Math.random() * availablePets.length);
            const chosenPet = availablePets[randomPetIndex];
            rolledPets.push(chosenPet)

            for (pet in req.user.pets) {
                if (pet.name = chosenPet.name) {

                }
            }
        }
        

        // const user = new User(req.user);
        // user.isNew = false;
        
        // const current_date = Date.now()
        // const checkin_count = user.checkin_count;
        // const updatedValues = {};

        // updatedValues.gems = user.gems + rewards[checkin_count - 1];
        // updatedValues.last_checkin_date = current_date;
        // updatedValues.claimed = true;

        // // update cache
        // const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        // await saveDocAsync(user, updateCacheResult);

        returnGoodReq(res);

    }
    catch (error) {
        console.log(error)
        returnServerErrorReq(res);
    }
}


module.exports = {
    getGemsAndPets,
    rollGacha
}