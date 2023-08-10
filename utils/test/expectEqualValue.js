// expect a certain value for the given test value

const { expect } = require('chai');

module.exports = function expectEqualValue(testValue, expectedValue) {
    Array.isArray(testValue) ?
        expect(testValue).to.deep.equal(Array(testValue.length).fill(expectedValue)) :
        expect(testValue).to.be.equal(expectedValue);
}