// controller funtions for searching for users and forums

const { searchUserPromise } = require("./searchUserController.js");
const { searchForumPromise } = require("./searchForumController.js");

const returnGoodReq = require("../../utils/returnReq/returnGoodReq.js");
const returnBadReq = require("../../utils/returnReq/returnBadReq.js");
const returnServerErrorReq = require("../../utils/returnReq/returnServerErrorReq.js");

// function to search for forum/user/both
async function search(req, res, type) {
  const searchTerm = req.query.term;

  if (searchTerm === "") {
    return returnBadReq(res, "Search term cannot be empty");
  }

  const regexTerm = new RegExp(searchTerm, "i");

  // set limit based on query type
  const limit = searchTerm == "all" ? 3 : 6;

  const excludeUsers = req.user.blocked_users.map((entry) => entry.user_id);
  excludeUsers.push(req.user._id);

  const userPromise = searchUserPromise(
    regexTerm,
    req.user._id,
    excludeUsers,
    limit,
  );
  const forumPromise = searchForumPromise(regexTerm, limit);

  let results;

  try {
    // check the type of query and execute the corresponding promise(s) for results
    switch (type) {
      case "all":
        {
          const [users, forums] = await Promise.all([userPromise, forumPromise]);
          results = [...users, ...forums].slice(0, 6);
        }
        break;
      case "user":
        results = await userPromise;
        break;
      case "forum":
        results = await forumPromise;
        break;
      default:
        return returnBadReq(res, "Invalid search type");
    }

    returnGoodReq(res, { topSixResults: results });
  } catch (error) {
    returnServerErrorReq(res);
  }
}

module.exports = {
  search,
};
