const Gamification = require('../models/gamification.js');

const returnNotFoundReq = require('../../utils/returnReq/returnNotFoundReq.js');
const returnServerErrorReq = require('../../utils/returnReq/returnServerErrorReq.js');

async function getGameData(req, res, next) {
    let target = null;
    console.log('hello')
    console.log("!1111")
    try {
        const user_id = req.user._id;
        
        target = await Gamification.findOne({user_id: user_id}).lean();
        console.log(target)
        // if target is still null means the comment does not exist, return 404 error
        if (!target) {
            return returnNotFoundReq(res);
        }
    }
    catch (error) {
        return returnServerErrorReq(res);
    }

    res.comment = target;
    next();
}

module.exports = {
    getGameData
}