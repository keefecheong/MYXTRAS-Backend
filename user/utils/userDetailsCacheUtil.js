// utils to handle separate user details for caching objects

const redisClient = require("../../cache/redis.js");
const { getHeaderKey, USER_EXPIRATION_TIME } = require("../cache/userCache.js");

// to retrieve details from objects with the same creator to store in cache
function storeDetailsSingle(data) {
  if (!data || data.length <= 0) {
    return { workingData: [], creatorDetailsPromises: [] };
  }

  const workingData = JSON.parse(JSON.stringify(data));

  const isArray = Array.isArray(data);

  const creatorDetails = isArray
    ? workingData[0].creator_id
    : workingData.creator_id;
  const headerKey = getHeaderKey(creatorDetails._id);

  isArray
    ? workingData.forEach((data) => (data.creator_id = data.creator_id._id))
    : (workingData.creator_id = workingData.creator_id._id);

  const creatorDetailsPromises = [
    redisClient.json.set(headerKey, "$", creatorDetails),
    redisClient.expire(headerKey, USER_EXPIRATION_TIME),
  ];

  return { workingData, creatorDetailsPromises };
}

// to retrieve details from objects with multiple possible creators to store in cache
function storeDetailsMany(data, forId) {
  if (!data || data.length <= 0) {
    return { workingData: [], creatorDetailsPromises: [] };
  }

  const workingData = JSON.parse(JSON.stringify(data));

  const uniqueCreatorDetails = new Set();

  if (forId) {
    workingData.forEach((object) => {
      uniqueCreatorDetails.add(JSON.stringify(object._id));
    });
  } else {
    workingData.forEach((object) => {
      uniqueCreatorDetails.add(JSON.stringify(object.creator_id));
      object.creator_id = object.creator_id._id;
    });
  }

  const creatorDetailsPromises = [];

  Array.from(uniqueCreatorDetails).forEach((entry) => {
    const details = JSON.parse(entry);
    const headerKey = getHeaderKey(details._id);

    creatorDetailsPromises.push(redisClient.json.set(headerKey, "$", details));
    creatorDetailsPromises.push(
      redisClient.expire(headerKey, USER_EXPIRATION_TIME)
    );
  });

  return { workingData, creatorDetailsPromises };
}

// to retrieve details from cache and populate same creator_id on objects
async function retrieveDetailsSingle(data) {
  if (!data || data.length <= 0) {
    return null;
  }

  const isArray = Array.isArray(data);

  const creatorId = isArray ? data[0].creator_id : data.creator_id;

  const creatorDetails = await redisClient.json.get(getHeaderKey(creatorId));

  if (!creatorDetails) {
    return null;
  }

  isArray
    ? data.forEach((entry) => (entry.creator_id = creatorDetails))
    : (data.creator_id = creatorDetails);

  return data;
}

// to retrieve details from cache and populate creator_id on objects
async function retrieveDetailsMany(data, forId) {
  if (!data || data.length <= 0) {
    return null;
  }

  const uniqueCreatorIds = new Set();

  data.forEach((object) =>
    uniqueCreatorIds.add(forId ? object._id : object.creator_id)
  );

  const creatorDetails = await Promise.all(
    Array.from(uniqueCreatorIds).map((creatorId) =>
      redisClient.json.get(getHeaderKey(creatorId))
    )
  );

  if (creatorDetails.includes(null)) {
    return null;
  }

  data.forEach((object) =>
    forId
      ? (object = creatorDetails.find((entry) => entry._id == object._id))
      : (object.creator_id = creatorDetails.find(
          (entry) => entry._id == object.creator_id
        ))
  );

  return data;
}

module.exports = {
  storeDetailsSingle,
  storeDetailsMany,
  retrieveDetailsSingle,
  retrieveDetailsMany,
};
