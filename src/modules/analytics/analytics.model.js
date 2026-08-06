const mongoose = require('mongoose');

// This model temporarily stores visitor IDs to prevent duplicate counting within the day.
// Data is automatically deleted after 48 hours to save database space (TTL Index).
const dailyVisitorSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        index: true // Index for fast querying by date
    },
    visitorId: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Compound index to ensure absolute uniqueness of a visitor per day
dailyVisitorSchema.index({ date: 1, visitorId: 1 }, { unique: true });
// TTL Index: Automatically delete documents 48 hours (172800 seconds) after they are created
dailyVisitorSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

// This model stores the permanent aggregated stats for each day (takes up almost 0 space).
const dailyStatsSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    totalVisitors: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
});

const DailyVisitor = mongoose.model('DailyVisitor', dailyVisitorSchema);
const DailyStats = mongoose.model('DailyStats', dailyStatsSchema);

module.exports = {
    DailyVisitor,
    DailyStats
};
