// to get all unique reject reasons in a single string

module.exports = function getJoinedReasons(results) {
    const allReasons = results.flat();
    const uniqueReasons = new Set(allReasons);

    return Array.from(uniqueReasons).join(', ');
}