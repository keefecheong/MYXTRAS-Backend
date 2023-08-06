// to return a Mocha Suite object crafted from an array of tests as json objects

const Mocha = require('mocha');

module.exports = function generateContextFromTest(title, tests) {
    const context = new Mocha.Suite(title);
    context.tests = tests.map(entry => it(entry.title, async () => await entry.callback(...entry.params)));

    return context;
}