// controller functions to handle user profile related requests

const User = require('../../models/user.js');
const { setJWT } = require('../../utils/users/setJWT.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// return current user profile
// user retrieved with authMiddleware
const getUser = (req, res) => {
    res.status(200).json(req.user);
}

// register new user
const registerUser = async (req, res) => {
    // return 400 error if no data is sent
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    const { emailAddress, phoneNumber, password } = req.body;

    // check if user already exists in database
    // check for similar email
    const existingEmail = await User.findOne({ email: emailAddress });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // check for similar phone number
    const existingPhone = await User.findOne({ phone_number: phoneNumber });

    if (existingPhone) {
      return res.status(400).json({ error: 'Phone Number already exists' });
    }

    // validate phone number
    if (phoneNumber.length != 8){
        return res.status(400).json({ error: 'Inavlid phone number' });
    }

    // validate password complexity requirements
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || password.length < 8){
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
        res.status(400).json({ message: error.message });
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

    const {userName, biography, selectedInterests, gender} = req.body;

    try {
        const user = req.user;
    
        // update user details
        user.username = userName;
        user.biography = biography;
        user.interests = selectedInterests.sort();
        user.gender = gender;

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
                // else if (!(school in this.courses)) {
                //     return res.status(400).json({error: "School does not exist"});

                // } else if (!Object.values(this.courses).flat().includes(course)) {
                //     return res.status(400).json({error: "Course does not exist"});
                // }
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

module.exports = {
    getUser,
    registerUser,
    updateUser,
    setupUser
}