// controller functions to handle user profile updating related requests

const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

const returnNoContentReq = require('../../utils/general/returnNoContentReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// update user info
// user retrieved from authMiddleware
async function updateUser(req, res) {
    // return 400 error if no data is sent
    if (!req.body) {
        return returnBadReq(res, 'Invalid request body');
    }

    const {userName, biography, selectedInterests, gender} = JSON.parse(req.body.userObject);

    try {
        const user = req.user;
    
        // update user details
        user.username = userName;
        user.biography = biography;
        user.interests = selectedInterests.sort();
        user.gender = gender;
        var profile_pic_link = [];

        if (userName.length > 25){
            return returnBadReq(res, 'Username is too long');
        }

        if (biography.length > 100){
            return returnBadReq(res, 'Biography is too long');
        }

        if (req.files[0] != undefined){
            const uploadSuccessful = await uploadImages(req.files, profile_pic_link, user._id, 'user');
            
            if (!uploadSuccessful) {
                return returnServerErrorReq(res);
            }

            // if upload successful then delete old picture and update profile_pic_link
            deleteFiles([user.profile_pic_link]);

            user.profile_pic_link = profile_pic_link[0];
        }

        await user.save();
        
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
        const user = req.user;
        // TO DO (add validation for course in courses)
        // ||!(Object.values(this.courses).flat().includes(selectedCourse)
        //|| !(selectedSchool in this.selectedCourse)

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

        try {
            // update user info
            user.real_name = realName;
            user.username = userName;
            user.biography = biography;
            user.school = selectedSchool;
            user.course = selectedCourse;
            user.interests = selectedInterests.sort();
            user.is_profile_setup = true;

            await user.save();
        }
        catch (error) {
            if (error.code === 11000) {
                // Duplicate username error
                return returnBadReq(res, 'Username already exists');
            }
            else {
                // Other error
                return returnServerErrorReq(res);
            }
        }

        returnNoContentReq(res);
    }
    catch (error) {
        return returnServerErrorReq(res);
    }
}

module.exports = {
    updateUser,
    setupUser
}