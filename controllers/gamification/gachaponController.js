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
        const pets = req.user.pets;

        const data = {gems: gems, pets: pets}
        returnGoodReq(res, data);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}
async function rollGacha(req, res) {
    const user = new User(req.user);
    user.isNew = false;
    const rolledPets = [];
    const updatedValues = {};
    updatedValues.pets = user.pets;
    const numOfRolls = req.params.numOfRolls;
    // deduct gems from user
    if (user.gems < numOfRolls*160){
        res.status(500).json({ message: 'Not enough gems' })
        return;
        
    } else {
        user.gems -= numOfRolls*160;
        updatedValues.gems = user.gems;
    }
    
    // Set the probabilities for each rarity
    const ultraRareProbability = 0.05; // 5%
    const rareProbability = 0.1; // 10%
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
            
            
            // Check if pet exists in user inventory
            const exists = user.pets.some((pet) => {
                return (
                  pet.name === chosenPet.name
                );
              });

            if (!exists) {
                //Create a new copy of chosenPet to remove it from memory ref
                const newChosenPet = { ...chosenPet, new: true };
                newChosenPet.new = true
                rolledPets.push(newChosenPet)
                updatedValues.pets.push(chosenPet)
            } else {
                const newChosenPet = { ...chosenPet, new: true };
                newChosenPet.new = false
                rolledPets.push(newChosenPet)
            }
        }
        // update cache
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        returnGoodReq(res, rolledPets);

    }
    catch (error) {
        returnServerErrorReq(res);
    }
}


module.exports = {
    getGemsAndPets,
    rollGacha
}