// to expect a response to be null, empty string/array etc., or not null, based on expectEmpty

const { expect } = require('chai');

module.exports = function expectEmpty(obj, expectEmpty) {
    const check = obj === null ||
        (typeof obj === 'string' && obj.trim() === '') ||
        (Array.isArray(obj) && (obj.length === 0 || obj.includes(null) || obj.includes(undefined))) ||
        (typeof obj === 'object' && Object.keys(obj).length === 0);

    expectEmpty ? expect(check).to.be.true : expect(check).to.be.false;
}