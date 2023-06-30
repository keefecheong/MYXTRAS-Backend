// controller functions to handle DELETE requests for forums

const Forum = require('../../models/forum.js');


const deleteForum = async (req, res) => {
    if (!req.user._id.equals(res.forum.creator_id.id)){
      return res.status(401).json({message: 'Unauthorized.'});
    }
  
    try{
        await Forum.findByIdAndDelete(req.params.forumID);
        res.status(200).json({ message: 'Thread removed.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
  }

module.exports = {
    deleteForum
}