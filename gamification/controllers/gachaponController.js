// controller functions to handle user profile related requests
const { User } = require('../../user/models/user.js');

const returnGoodReq = require('../../utils/returnReq/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');
const saveDocAsync = require('../../utils/general/saveDocAsync.js');

const petsArray = require('../utils/pets.json');

const { updateCachedUser } = require('../../user/cache/userUpdateCache.js');

async function getGemsAndPets(req, res) {
    try{
        const gems = req.user.gems;
        const pets = req.user.pets.inventory;
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
    updatedValues.pets = {};
    updatedValues.pets.inventory = user.pets.inventory;

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
            const exists = user.pets.inventory.some((pet) => {
                return (
                  pet.name === chosenPet.name
                );
              });

            if (!exists) {
                //Create a new copy of chosenPet to remove it from memory ref
                const newChosenPet = { ...chosenPet, new: true };
                newChosenPet.new = true

                // To display in the gachapon popup
                rolledPets.push(newChosenPet)

                // Saving the non-duplicated pet in user inventory
                updatedValues.pets.inventory.push(chosenPet)
            } else {
                const newChosenPet = { ...chosenPet, new: true };
                newChosenPet.new = false

                // Refunding half the amount of gems for each duplicate pet
                updatedValues.gems += 80
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

async function enablePets(req, res) {
    const user = new User(req.user);
    user.isNew = false;
    const updatedValues = {};
    try{
        user.pets.enabled = !user.pets.enabled;
        updatedValues.pets = user.pets;

        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);
        await saveDocAsync(user, updateCacheResult);

        returnGoodReq(res);
    }
    catch (error){
        returnServerErrorReq(res);
    }

}



module.exports = {
    getGemsAndPets,
    rollGacha,
    enablePets
}