// controller functions to handle user profile related requests
const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');
const { User } = require('../../models/user.js');

const missions = require('../../utils/gamification/config.json');
const rewards = [50, 100, 100, 100, 150, 200, 500];

async function getCheckIn(req, res) {
    try{
        const user = req.user;
        
        const last_checkin_date = user.last_checkin_date;

        const current_date = new Date()
        let checkin_count = user.checkin_count;
        let claimed = user.claimed;


        const differenceInMilliseconds = Math.abs(current_date - last_checkin_date);
        const millisecondsInTwoDays = 2 * 24 * 60 * 60 * 1000;

        // If last check in surpasses a day, reset counter
        if (differenceInMilliseconds >= millisecondsInTwoDays && !user.clamied) {
            checkin_count = 1; // reset checkIn count

        // If its a new day, add to counter and reset claimed
        } else if (differenceInMilliseconds >= millisecondsInTwoDays/2) {
            if (user.claimed){
                claimed = false
                checkin_count = user.checkin_count + 1;
            }
        }
        
        User.findById(user._id).then(user => {
            user.checkin_count = checkin_count;
            user.claimed = claimed;
            user.save();
        });

        const data = {checkin_count: checkin_count, claimed: claimed}
        
        returnGoodReq(res, data);

    }
    catch (error) {
        returnServerErrorReq(res, );
    }
}
async function checkIn(req, res) {
    try{
        const user = req.user;
        
        const current_date = new Date();
        const checkin_count = user.checkin_count;
        let reset = false;
        

        if (checkin_count == 7) {
            reset = true
        }

        User.findById(user._id).then(user => {
            if (true) {
                user.checkin_count = 1;
            }
            user.gems += rewards[checkin_count - 1];
            user.last_checkin_date = current_date;
            user.claimed = true;
            user.save();
        });

        returnGoodReq(res);

    }
    catch (error) {
        console.log(error)
        returnServerErrorReq(res);
    }
}


module.exports = {
    getCheckIn,
    checkIn
}