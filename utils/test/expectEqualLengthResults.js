// to expect an array (results after db/cache queries) to be the length of another array

const { expect } = require("chai");

module.exports = function expectEqualLengthResults(resultsArray, initialArray) {
  expect(resultsArray.length).to.be.equal(initialArray.length);
};
