// separate file to prevent circular dependency

// expiration time
// 1 hour for all (cache is updated)
const USER_EXPIRATION_TIME = 60 * 60;

// to cache part of the user's details for reference
// format: 'user:header:userid'
const USER_HEADER_KEY_BASE = "user:header";

function getHeaderKey(userId) {
  return `${USER_HEADER_KEY_BASE}:${userId}`;
}

module.exports = {
    USER_EXPIRATION_TIME,
    getHeaderKey
}