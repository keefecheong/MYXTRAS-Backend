// controller functions to handle cookie related requests

// check if cookie is valid
// authMiddleware used to check cookie
// return 204 if user in jwt is valid (invalid cookies handled in middleware)
const verifyCookie = (req, res) => {
    if (req.user) {
        res.status(200).json(req.user);
    }
    else {
        res.status(401).end();
    }
}

// clear jwt cookie and return 204
const clearCookie = (req, res) => {
    res.clearCookie('authapi');
    res.status(204).end();
}

module.exports = {
    verifyCookie,
    clearCookie
}