const Blocklist = require('./blocklist.model');
const sendResponse = require('../../utils/sendResponse');

// Block an IP or Phone
exports.blockEntity = async (req, res) => {
  try {
    const { type, value, reason, responseMsg, days } = req.body;

    if (!type || !['ip', 'phone'].includes(type)) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Valid block type (ip or phone) is required'
      });
    }

    if (!value) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Block value is required'
      });
    }

    let expiresAt = null;
    if (days && !isNaN(days) && days > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(days));
    }

    // Check if already exists
    const existingBlock = await Blocklist.findOne({ value });
    
    if (existingBlock) {
      // Update existing
      existingBlock.type = type;
      existingBlock.reason = reason || existingBlock.reason;
      if (responseMsg !== undefined) existingBlock.responseMsg = responseMsg;
      existingBlock.expiresAt = expiresAt;
      existingBlock.blockedBy = req.user._id;
      await existingBlock.save();
      
      return sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: `${type.toUpperCase()} block updated successfully`,
        data: existingBlock
      });
    }

    // Create new block
    const newBlock = new Blocklist({
      type,
      value,
      reason,
      responseMsg,
      expiresAt,
      blockedBy: req.user._id
    });

    await newBlock.save();

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: `${type.toUpperCase()} blocked successfully`,
      data: newBlock
    });

  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error while blocking'
    });
  }
};

// Unblock an IP or Phone
exports.unblockEntity = async (req, res) => {
  try {
    const { value } = req.params;

    if (!value) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Value is required to unblock'
      });
    }

    const deletedBlock = await Blocklist.findOneAndDelete({ value });

    if (!deletedBlock) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: 'Block record not found'
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Unblocked successfully',
      data: deletedBlock
    });

  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error while unblocking'
    });
  }
};

// Get all blocks
exports.getAllBlocks = async (req, res) => {
  try {
    const { type } = req.query;
    
    // Clean up expired blocks automatically when fetched
    await Blocklist.deleteMany({ expiresAt: { $lt: new Date() } });

    const query = {};
    if (type && ['ip', 'phone'].includes(type)) {
      query.type = type;
    }

    const blocks = await Blocklist.find(query).sort({ createdAt: -1 }).populate('blockedBy', 'name email');

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Blocklist fetched successfully',
      data: blocks
    });

  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error while fetching blocklist'
    });
  }
};
