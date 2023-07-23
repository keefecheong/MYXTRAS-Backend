const User = require('../../models/user.js');
const tasks = require('./config.json');
const cron = require('node-cron');

function getRandomElements(arr, n) {
    const shuffled = arr.slice();
    let i = arr.length;
    const min = i - n;
    let temp;
    let index;

    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }

    return shuffled.slice(min);
}

// Function to reset the daily missions for all users
async function resetDailyMissions() {
    try {
        const users = await User.find({});
        const missions = Object.keys(tasks.missions);

        users.forEach(async (user) => {
            // Clear existing assigned missions
            user.daily_missions = [];

            // Get 4 random missions from the available missions
            const randomMissions = getRandomElements(missions, 4);

            // Assign the daily missions to the user (update!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!)
            user.daily_missions = randomMissions;

            // Save the user with updated daily missions
            await user.save();
        });

        console.log('Daily missions reset successfully');
    } catch (error) {
        console.error('Error resetting daily missions:', error);
    }
};

const checkDateAndReset = () => {
    // Get the current date
    const currentDate = new Date();
    // Check if the date has changed
    if (currentDate.getDate() !== checkDateAndReset.lastDate) {
        // Call the resetDailyMissions function
        resetDailyMissions();
        // Update the lastDate to the current date
        checkDateAndReset.lastDate = currentDate.getDate();
    }
};

// Initialize the lastDate to the current date
checkDateAndReset.lastDate = new Date().getDate();

// Checks if new day has occured
// setInterval(checkDateAndReset, 1000 * 60 * 60); // 1 hr

cron.schedule('0 0 * * *', async () => {
    checkDateAndReset();
    await resetDailyMissions();
});