// expect a certain status code

const { expect } = require('chai');

module.exports = function expectStatusCode(status, expectedStatus) {
    expect(status).to.be.equal(expectedStatus);
}