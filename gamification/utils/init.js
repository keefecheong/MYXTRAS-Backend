const { User } = require("../../user/models/user.js");
const tasks = require("./config.json");
const cron = require("node-cron");

const { updateCachedUser } = require("../../user/cache/userUpdateCache.js");

const saveDocAsync = require("../../utils/general/saveDocAsync.js");

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

    await Promise.all(users.map(async (targetUser) => {
      const user = new User(targetUser);
      user.isNew = false;

      // Clear existing assigned missions
      user.daily_missions = [];

      // Get 4 random missions from the available missions
      const daily_tasks = getRandomElements(missions, 4);

      const dailyMissions = daily_tasks.map((item) => {
        return { title: item, claimed: false, locked: true };
      });

      const allClaimed = { claimed: false, locked: true };

      const updatedValues = {
        daily_missions: dailyMissions,
        all_claimed: allClaimed,
      };

      // update cache
      const updateCachedResult = await updateCachedUser(
        updatedValues,
        user._id,
        true,
      );

      // update database asynchronously if cache is updated successfully and synchronously otherwise
      await saveDocAsync(user, updateCachedResult);
    }));

    console.log("Daily missions reset successfully");
  } catch (error) {
    console.error("Error resetting daily missions:", error);
  }
}

cron.schedule("0 0 * * *", async () => {
  await resetDailyMissions();
});
