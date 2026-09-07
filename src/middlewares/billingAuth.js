const billingAuth = (req, res, next) => {
  const apiKey = req.headers['x-billing-api-key'];
  
  // Use environment variable in production, fallback for testing
  const validApiKey = process.env.BILLING_API_KEY || 'pinkspot_secure_billing_key_2026';

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Invalid or missing Billing API Key.',
    });
  }

  next();
};

module.exports = billingAuth;
