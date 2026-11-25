const { getUserWallet } = require('../services/walletService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user credit balance and transaction ledger
// @route   GET /api/wallet
// @access  Private
const getWallet = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const walletData = await getUserWallet(req.user._id, { page, limit });

  res.status(200).json({
    success: true,
    ...walletData
  });
});

module.exports = {
  getWallet
};

