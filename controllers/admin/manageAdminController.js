// controller functions to promote/demote users to/from admins

const { User } = require('../../models/user.js');
const { updateCachedUser } = require('../../cache/users/userUpdateCache.js');

const compareId = require('../../utils/general/compareId.js');

const returnGoodReq = require('../../utils/general/returnGoodReq.js');
const returnBadReq = require('../../utils/general/returnBadReq.js');
const returnServerErrorReq = require('../../utils/general/returnServerErrorReq.js');

// to promote a user to admin
async function promoteAdmin(req, res) {
    const promotorId = req.user._id;
    var user = res.user;

    // ensure the requesting and requested users are different
    if (compareId(promotorId, user._id)) {
        return returnBadReq(res, 'Cannot promote yourself to admin.');
    }

    // check if user is already an admin
    if (user.is_admin) {
        return returnBadReq(res, 'User is already an admin.');
    }

    if (user.status?.status) {
        return returnBadReq(res, 'Cannot promote user while suspended or terminated');
    }

    try {
        // update user
        user = new User(user);
        user.isNew = false;
    
        user.is_admin = true;
        user.admin_updated_by = promotorId;
        
        const updatedValues = {
            is_admin: true,
            admin_updated_by: promotorId
        }
    
        // update cache and db together
        await Promise.all([updateCachedUser(updatedValues, user._id, true), user.save()]);
        
        returnGoodReq(res, { message: 'User promoted successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

// to demote an admin to a user
async function demoteAdmin(req, res) {
    const demoterId = req.user._id;
    var user = res.user;

    // ensure the requesting and requested users are different
    if (compareId(demoterId, user._id)) {
        return returnBadReq(res, 'Cannot demote yourself.');
    }

    // check if user is already an admin
    if (!user.is_admin) {
        return returnBadReq(res, 'User is not an admin.');
    }

    try {
        // update user
        user = new User(user);
        user.isNew = false;

        user.is_admin = false;
        user.admin_updated_by = demoterId;

        const updatedValues = {
            is_admin: false,
            admin_updated_by: demoterId
        }

        // update cache and db together
        await Promise.all([updateCachedUser(updatedValues, user._id, true), user.save()]);

        returnGoodReq(res, { message: 'Admin demoted successfully.' });
    }
    catch (error) {
        returnServerErrorReq(res);
    }
}

module.exports = {
    promoteAdmin,
    demoteAdmin
}