// controller functions to handle user profile related requests

const User = require('../../models/user.js');
const { setJWT } = require('../../utils/users/setJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

// return current user profile
// user retrieved with authMiddleware
const getUser = (req, res) => {
    res.status(200).json(req.user);
}
const verifyEmail = async (req, res) => {
    const email = req.body.email
    const existingEmail = await User.findOne({ email: email });

    if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    else {
        return res.status(200).end()
    }
}
const verifyPhoneNum = async (req, res) => {
    const phoneNumber = req.body.phoneNumber
    const existingPhone = await User.findOne({ phone_number: phoneNumber });

    if (existingPhone) {
        return res.status(400).json({ error: 'Phone Number already exists' });
    }
    else {
        return res.status(200).end()
    }
}
// register new user
const registerUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    const { emailAddress, phoneNumber, password } = req.body;

    // validate phone number
    if (phoneNumber.length != 8){
        // TO DO: ADD FIREBASE AUTH 
        return res.status(400).json({ error: 'Inavlid phone number' });
    }

    // validate password complexity requirements
    if (passwordRequirements(password) in ['very-weak', 'weak']){
        return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    try {
        const newUser = new User({
            username: 'user' + crypto.randomBytes(4).toString("hex"),
            email: emailAddress,
            phone_number: phoneNumber,
            password: await bcrypt.hash(password, 10),
        });

        // Save user into database
        await newUser.save();
        
        // sign jwt and return as cookie
        setJWT(newUser._id, res);
        
        return res.status(200).end();

    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phone_number) {
          // Duplicate phone number error
          res.status(400).json({ error: 'Phone number already exists' });
        } else if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            // Duplicate email error
            res.status(400).json({ error: 'Email already exists' });
        } 
        else {
          // Other error
          res.status(400).json({ error: error.message });
        }
      }
}

// update user info
// user retrieved from authMiddleware
const updateUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
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

        await user.save();
        if (username.length > 25){
            return res.status(400).json({error: 'Username is too long'})
        }
        if (biography.length > 100){
            return res.status(400).json({error: 'Biography is too long'})
        }
        const uploadSuccessful = await uploadImages(req.files, profile_pic_link, user._id, 'user');
        user.profile_pic_link = profile_pic_link[0];
        if (!uploadSuccessful) {
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
        }
        await user.save();

        res.status(204).end();
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to update user' });
    }
}

// initial user info setup
// user retrieved from authMiddleware
const setupUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
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
            return res.status(400).json({error: 'Real name is too long'})
        }
        if (userName.length > 25){
            return res.status(400).json({error: 'Username is too long'})
        }
        if (biography.length > 100){
            return res.status(400).json({error: 'Biography is too long'})
        }
        if (
            detailsList.some(item => item === "") ||
            /^[0-9]+$/.test(realName) ||
            realName.length > 32 ||
            userName.length > 16 
            ) {
                if (detailsList.some(item => item === "")) {
                    return res.status(400).json({error: "Please enter all fields"});

                } else if (/^[0-9]+$/.test(realName)) {
                    return res.status(400).json({error: "No integers in your real name"});

                } else if (realName.length > 32) {
                    return res.status(400).json({error: "Real name must not be more than 32 characters long"});

                } else if (userName.length > 16) {
                    return res.status(400).json({error: "Username must not be more than 16 characters long"});

                } 
            }

        // update user info
        user.real_name = realName;
        user.username = userName;
        user.biography = biography;
        user.school = selectedSchool;
        user.course = selectedCourse;
        user.interests = selectedInterests.sort();
        user.is_profile_setup = true;

        await user.save();

        res.status(204).end();
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Failed to update user' });
    }
}

// temp - for creating chats
// get all users except current requesting user
const getAllUsers = async (req, res) => {
    // only getting username and id
    const users = await User.find({ _id: { $ne: req.user._id } }).select('username _id profile_pic_link');
    res.status(200).json(users);
}

module.exports = {
    getUser,
    registerUser,
    updateUser,
    setupUser,
    getAllUsers,
    verifyEmail,
    verifyPhoneNum
}

function passwordRequirements(password) {
    const consecutiveLimit = 3;
    if (password.length < 4 || isPasswordSingleType(password)) {
        return 'very-weak';
    }
    this.passwordStrength = 0;

    if (/[A-Z]/.test(password)) {
        this.passwordStrength++;
    }

    if (/\d/.test(password)) {
        this.passwordStrength++;
    }
    if (password.length > 14) {
        this.passwordStrength++;
    }
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        this.passwordStrength++;
    }
    // checks for 3 consecutive characters
    for (let i = 0; i < password.length - consecutiveLimit + 1; i++) {
        let isConsecutive = true;
        for (let j = i + 1; j < i + consecutiveLimit; j++) {
        if (password[j] !== password[i]) {
            isConsecutive = false;
            break;
        }
        }
        if (isConsecutive) {
            if (this.passwordStrength === 0){
                break;
            }
            this.passwordStrength--;
        }
    }
    if (this.passwordStrength === 0) {
        return 'very-weak';
    } else if (this.passwordStrength === 1) {
        return 'weak';
    } else if (this.passwordStrength === 2 || this.passwordStrength === 3) {
        return 'strong';
    } else {
        return 'very-strong';
    }
}
function isPasswordSingleType(password) {
    const lowercaseRegex = /^[a-z]+$/;
    const uppercaseRegex = /^[A-Z]+$/;
    const symbolRegex = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
    const numberRegex = /^[0-9]+$/;
    if (
        lowercaseRegex.test(password) ||
        uppercaseRegex.test(password) ||
        symbolRegex.test(password) ||
        numberRegex.test(password)
    ) {
        return true;
    }

    return false;
}