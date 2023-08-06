const request = require('supertest');

const server = require('../../server.js');
const { JWT_COOKIE_KEY, generateJWT } = require('../../user/utils/setJWT.js');

// send request using given method to given url with cookie for given user id
module.exports = function sendMockRequest(url, userId, method, body) {
    let chainRequest = request(server);

    // chain options based on parameters
    switch (method) {
        case 'get':
            chainRequest = chainRequest.get(url);
            
            break;
        
        case 'post':
            chainRequest = chainRequest.post(url);

            if (body) {
                chainRequest = chainRequest.send(body).set('Content-Type', 'application/json');
            }

            break;

        case 'delete':
            chainRequest = chainRequest.delete(url);

            break;

        case 'patch':
            chainRequest = chainRequest.patch(url).send(body).set('Content-Type', 'application/json');

            break;

        default:
            break;
    }

    // attach cookie
    return chainRequest.set('Cookie', `${JWT_COOKIE_KEY}=${generateJWT(userId)}`);
}