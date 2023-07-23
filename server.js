// use dotenv for .env variables
require('dotenv').config();

const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// configure cors
const cors = require('cors');
const corsOptions = {
    origin: process.env.FRONTEND_SERVER_URL,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PATCH'],
    credentials: true,
};

app.use(cors(corsOptions));

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

// make connection with mongodb
const mongoose = require('mongoose');
const { User } = require('./models/user.js');
const { updateCachedUser } = require('./cache/users/userUpdateCache.js');
const saveDocAsync = require('./utils/cache/saveDocAsync.js');

mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to database.'));

const tasks = require('./utils/gamification/config.json');
const cron = require('node-cron');
 
  // Function to reset the daily missions for all users
  async function resetDailyMissions() {
    try {
      const users = await User.find({});
      const missions = Object.keys(tasks.missions);

      users.forEach(async (targetUser) => {
        // Clear existing assigned missions
        const user = new User(targetUser);
        user.isNew = false;
        const updatedValues = {};

        user.daily_missions = [];
  
        // Get 4 random missions from the available missions
        const daily_tasks = getRandomElements(missions, 4)

        const dailyMissions = daily_tasks.map((item) => {
          return {'title': item, 'claimed': false, 'locked': true}
        })
  
        // Assign the daily missions to the user (update!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!)
        updatedValues.daily_missions = dailyMissions;
  
        // update cache
        const updateCachedResult = await updateCachedUser(updatedValues, user._id, true);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(user, updateCachedResult);
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



// initialize cache
require('./cache/init.js');

// initialize Firebase (for storing files/images)
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID
}

initializeApp(firebaseConfig);

// mount routes
const mountRoutes = require('./routes/mountRoutes.js');
mountRoutes(app);

// start server
const server = app.listen(process.env.PORT, () => console.log(`Listening on Port ${process.env.PORT}...`));

// initialize socket
const { initSocket } = require('./sockets/init.js');
initSocket(server, corsOptions);