const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const advancedAnalyticsController = require('./advanced-analytics.controller');

// Dashboard analytics routes
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/sales', analyticsController.getSalesAnalytics);
router.get('/products', analyticsController.getProductAnalytics);
router.get('/customers', analyticsController.getCustomerAnalytics);

// Advanced analytics routes
router.get('/advanced/top-products', advancedAnalyticsController.getTopProducts);
router.get('/advanced/orders-by-day', advancedAnalyticsController.getOrdersByDayOfWeek);
router.get('/advanced/category-performance', advancedAnalyticsController.getCategoryPerformance);
router.get('/advanced/inventory-movement', advancedAnalyticsController.getInventoryMovement);
router.get('/advanced/customer-retention', advancedAnalyticsController.getCustomerRetention);
router.get('/advanced/sales-by-time', advancedAnalyticsController.getSalesByTimeOfDay);
router.get('/advanced/geographic', advancedAnalyticsController.getGeographicDistribution);
router.get('/advanced/coupons', advancedAnalyticsController.getCouponAnalytics);
router.get('/advanced/order-status', advancedAnalyticsController.getOrderStatusReport);
router.get('/advanced/order-source', advancedAnalyticsController.getOrderSourceReport);
router.get('/advanced/aov', advancedAnalyticsController.getAovTrend);
router.get('/advanced/top-customers', advancedAnalyticsController.getTopCustomers);
router.get('/advanced/return-analytics', advancedAnalyticsController.getReturnAnalytics);
router.get('/advanced/recent-activity', advancedAnalyticsController.getRecentActivity);

module.exports = router;
