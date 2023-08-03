// controller functions to handle user profile updating related requests

const { User, DEFAULT_PROFILE_PIC_LINK } = require('../../models/user.js');

const { uploadImages, UPLOAD_TYPE_USER } = require('../../utils/s3/s3Upload.js');
const { deleteFiles } = require('../../utils/s3/s3Delete.js');

const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

const schools = require('../../utils/users/schools.json');
const tasks = require('../../utils/gamification/config.json');


const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const saveDocAsync = require('../../utils/cache/saveDocAsync.js');

// update user info
// user retrieved from authMiddleware
async function updateUser(req, res) {
    // return 400 error if no data is sent
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    const { userName, biography, selectedInterests, gender } = JSON.parse(req.body.userObject);

    if (userName.length > 25){
        return returnBadReq(res, 'Username is too long');
    }

    if (biography.length > 100){
        return returnBadReq(res, 'Biography is too long');
    }

    try {
        const user = new User(req.user);
        user.isNew = false;

        const updatedValues = {};
    
        // update user details
        if (user.username != userName) {
            user.username = userName;
            updatedValues.username = userName;
        }
        
        if (user.biography != biography) {
            user.biography = biography;
            updatedValues.biography = biography;
        }

        const interests = selectedInterests.sort();
        
        if (user.interests != interests) {
            user.interests = interests;
            updatedValues.interests = interests;
        }
        
        if (user.gender != gender) {
            user.gender = gender;
            updatedValues.gender = gender;
        }

        if (req.files[0] != undefined){
            var profile_pic_link = [];
            const uploadSuccessful = await uploadImages(req.files, profile_pic_link, user._id, UPLOAD_TYPE_USER);
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }

            // if upload successful then delete old picture and update profile_pic_link
            if (user.profile_pic_link != DEFAULT_PROFILE_PIC_LINK){
                deleteFiles(user.profile_pic_link);
            }   
            user.profile_pic_link = profile_pic_link[0];
            updatedValues.profile_pic_link = profile_pic_link[0];
        }

        // update cache
        const updateCacheResult = await updateCachedUser(updatedValues, user._id, true);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(user, updateCacheResult);
        
        returnNoContentReq(res);
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// initial user info setup
// user retrieved from authMiddleware
async function setupUser(req, res) {
    // return 400 error if no data is sent
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    const { realName, userName, biography, selectedSchool, selectedCourse, selectedInterests} = req.body;

    var detailsList = [realName, userName, selectedSchool, selectedCourse]
    
    try {
        const user = new User(req.user);
        user.isNew = false;

        // validate details
        if (realName.length > 32){
            return returnBadReq(res, 'Real name is too long');
        }

        if (userName.length > 25){
            return returnBadReq(res, 'Username is too long');
        }
        
        if (biography.length > 100){
            return returnBadReq(res, 'Biography is too long');
        }
        
        if (detailsList.some(item => item === "")) {
            return returnBadReq(res, 'Please enter all fields');
        }
        
        if (/^[0-9]+$/.test(realName)) {
            return returnBadReq(res, 'No integers are allowed in your real name');
        }
        
        if (realName.length > 32) {
            return returnBadReq(res, 'Real name must not be more than 32 characters long');
        }
        
        if (userName.length > 16) {
            return returnBadReq(res, 'Username must not be more than 16 characters long');
        }

        if (!Object.keys(schools).includes(selectedSchool)) {
            return returnBadReq(res, 'Invalid school');
        }
        
        if (!Object.keys(schools[selectedSchool]["courses"]).includes(selectedCourse)) {
            return returnBadReq(res, 'Invalid course');
        }

        // update user info
        const school = schools[selectedSchool]["short"];
        const course = schools[selectedSchool]["courses"][selectedCourse];
        const interests = selectedInterests.sort();

        user.username = userName;
        user.real_name = realName;
        user.biography = biography;
        user.school = school;
        user.course = course;
        user.interests = interests;
        user.is_profile_setup = true;
        const missions = Object.keys(tasks.missions);
        const daily_tasks = getRandomElements(missions, 4)
        const dailyMissions = daily_tasks.map((item) => {
            return {'title': item, 'claimed': false, 'locked': true}
        })

        const updatedValues = {
            username: userName,
            real_name: realName,
            biography,
            school,
            course,
            interests,
            is_profile_setup: true,
            daily_missions: dailyMissions
        }

        // update cache
        const updateCachedResult = await updateCachedUser(updatedValues, user._id, true);

        // update database asynchronously if cache is updated successfully and synchronously otherwise
        await saveDocAsync(user, updateCachedResult);

        returnNoContentReq(res);
    }
    catch (error) {
        if (error.code === 11000) {
            // Duplicate username error
            returnBadReq(res, 'Username already exists');
        }
        else {
            // Other error
            returnServerErrorReq(res);
        }
    }
};

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

module.exports = {
    updateUser,
    setupUser
}