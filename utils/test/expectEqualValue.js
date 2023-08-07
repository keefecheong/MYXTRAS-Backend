// expect a certain value for the given test value

const { expect } = require('chai');

module.exports = function expectEqualValue(testValue, expectedValue) {
    expect(testValue).to.be.equal(expectedValue);
}