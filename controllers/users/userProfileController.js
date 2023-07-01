// controller functions to handle user profile related requests

const User = require('../../models/user.js');
const { uploadImages } = require('../../utils/general/firebaseStorageUpload.js');
const { deleteFiles } = require('../../utils/general/firebaseStorageDelete.js');

// return current user profile
// user retrieved with authMiddleware
const getUser = (req, res) => {
    res.status(200).json(req.user);
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
        if (userName.length > 25){
            return res.status(400).json({error: 'Username is too long'})
        }
        if (biography.length > 100){
            return res.status(400).json({error: 'Biography is too long'})
        }
        if (req.files[0] != undefined){
            const uploadSuccessful = await uploadImages(req.files, profile_pic_link, user._id, 'user');
            user.profile_pic_link = profile_pic_link[0];
            
            if (!uploadSuccessful) {
                await User.findByIdAndDelete(user._id);
                return res.status(500).json({ message: 'Failed to upload images, please try again later.' });
            }
            await user.save();
        }
        
        res.status(204).end();
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update user' });
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
                res.status(400).json({ error: 'Username already exists' })
            }
            else {
                // Other error
                res.status(500).json({ error: error.message });
            }
        }

        res.status(204).end();

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
}

// temp - for creating chats
// get all users except current requesting user
const getAllUsers = async (req, res) => {
    // only getting username and id
    const users = await User.find({ _id: { $ne: req.user._id } }).select('username _id profile_pic_link').lean();
    res.status(200).json(users);
}

// get Requested user
const getRequestedUser = async (req, res) => {
    let targetUserId = req.params.userId == 'self' ? req.user._id : req.params.userId;

    const user = await User
        .findById(targetUserId)
        .populate({
            path: 'followers',
            select: 'username profile_pic_link'
        })
        .lean();

    const isFollowing = user.followers.some(follower => follower._id.equals(req.user._id));

    // return information about requesting user to update follower list on frontend immediately
    const self = {
        _id: req.user._id,
        username: req.user.username,
        profile_pic_link: req.user.profile_pic_link
    }

    res.status(200).json({ user, isFollowing, self });
}

// follow user
const followUser = async (req, res) => {
    if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }

    const { following } = req.body;

    try {
        const user = req.user;
        user.following = following;
;
        await user.save();

        const otherUser = await User.findById(req.params.userId);
        if (otherUser.followers.includes(req.user._id)){
            const index = otherUser.followers.indexOf(req.user._id);
            if (index > -1) { 
                otherUser.followers.splice(index, 1); 
            }
        }
        else{
            otherUser.followers.push(req.user);
        }      

        await otherUser.save();

        res.status(204).end();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
}

module.exports = {
    getUser,
    updateUser,
    setupUser,
    getAllUsers,
    getRequestedUser
}