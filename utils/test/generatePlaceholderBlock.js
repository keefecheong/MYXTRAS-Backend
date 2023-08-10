// returns placeholder block so test will run as expected
module.exports = function generatePlaceholderBlock() {
    return describe('test starting', () => {
        it('test starting', () => { return true });
    });
}