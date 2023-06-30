// controller functions to handle DELETE requests for threads

const Thread = require('../../models/thread.js');


const deleteThread = async (req, res) => {
    if (!req.user._id.equals(res.thread.creator_id.id)){
      return res.status(401).json({message: 'Unauthorized.'});
    }
  
    try{
        await Thread.findByIdAndDelete(req.params.threadID);
        res.status(200).json({ message: 'Thread removed.' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
  }

module.exports = {
    deleteThread
}