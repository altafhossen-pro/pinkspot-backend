const { DailyVisitor, DailyStats } = require('./modules/analytics/analytics.model');

const activeVisitors = new Map();
const todayTotalVisitors = new Set();
let currentDay = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
let isInitialized = false;

// Initialize memory cache from DB on startup
const initializeTodayVisitors = async () => {
    try {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const visits = await DailyVisitor.find({ date: todayStr }).select('visitorId');
        todayTotalVisitors.clear();
        visits.forEach(v => todayTotalVisitors.add(v.visitorId));
        
        // Also ensure a DailyStats document exists for today
        const stats = await DailyStats.findOneAndUpdate(
            { date: todayStr },
            { $setOnInsert: { date: todayStr, totalVisitors: todayTotalVisitors.size } },
            { upsert: true, new: true }
        );
        
        // If the stats DB has a higher count (e.g. from previous days before TTL deletion), use it as base if needed.
        // Actually, for today, the count should just match todayTotalVisitors.size, so it's fine.

        currentDay = todayStr;
        isInitialized = true;
        console.log(`Initialized today's total visitors: ${todayTotalVisitors.size}`);
    } catch (err) {
        console.error("Failed to initialize today's visitors from DB", err);
    }
};

initializeTodayVisitors();

const handleVisitorTracking = async (io, socket) => {
    const visitorId = socket.handshake.auth?.visitorId;
    const todayStr = new Date().toLocaleDateString('en-CA');

    // Handle day change reset
    if (todayStr !== currentDay) {
        currentDay = todayStr;
        todayTotalVisitors.clear();
        isInitialized = true; // no need to fetch from DB for a brand new day
    }

    if (visitorId) {
        // Track live visitors
        if (activeVisitors.has(visitorId)) {
            activeVisitors.set(visitorId, activeVisitors.get(visitorId) + 1);
        } else {
            activeVisitors.set(visitorId, 1);
        }
        
        // Track daily total visitors
        if (isInitialized && !todayTotalVisitors.has(visitorId)) {
            todayTotalVisitors.add(visitorId);
            try {
                // Upsert to ensure uniqueness in DB even across server instances
                const result = await DailyVisitor.updateOne(
                    { date: todayStr, visitorId: visitorId },
                    { $setOnInsert: { date: todayStr, visitorId: visitorId } },
                    { upsert: true }
                );
                
                // If this was a genuinely new unique visitor today (upsertedId exists)
                if (result.upsertedId) {
                    await DailyStats.updateOne(
                        { date: todayStr },
                        { $inc: { totalVisitors: 1 } },
                        { upsert: true }
                    );
                }
                
                // Broadcast updated total count
                io.emit('today_total_visitors', todayTotalVisitors.size);
            } catch (err) {
                console.error("Error saving daily visitor", err);
            }
        }
        
        // Broadcast the unique live visitor count
        io.emit('unique_visitors_count', activeVisitors.size);
    } else {
        console.log('Client connected to socket.io (No visitorId)');
    }

    // Always send the current counts to the newly connected client
    socket.emit('unique_visitors_count', activeVisitors.size);
    socket.emit('today_total_visitors', todayTotalVisitors.size);

    socket.on('disconnect', () => {
        if (visitorId && activeVisitors.has(visitorId)) {
            const currentCount = activeVisitors.get(visitorId);
            if (currentCount > 1) {
                activeVisitors.set(visitorId, currentCount - 1);
            } else {
                // Set count to 0 and wait 10 seconds before deleting to handle page refreshes
                activeVisitors.set(visitorId, 0);
                setTimeout(() => {
                    if (activeVisitors.get(visitorId) === 0) {
                        activeVisitors.delete(visitorId);
                        // Broadcast updated count after confirm deletion
                        io.emit('unique_visitors_count', activeVisitors.size);
                    }
                }, 10000);
            }
        } else if (!visitorId) {
            console.log('Client disconnected from socket.io (No visitorId)');
        }
    });
};

const { handleOrderPresence } = require('./modules/order/order.socket');

const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        // Initialize visitor tracking for this connection
        handleVisitorTracking(io, socket);
        
        // Initialize order presence tracking
        handleOrderPresence(io, socket);

        // Additional socket namespaces or event listeners can be added here
        // ...
    });
};

module.exports = {
    setupSocketHandlers
};
