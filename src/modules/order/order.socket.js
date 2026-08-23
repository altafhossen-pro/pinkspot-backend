const activeOrderViewers = new Map(); // Map<orderId, Map<socketId, { userId, name, role }>>
const socketToOrderMap = new Map(); // Map<socketId, orderId> for quick cleanup on disconnect

const handleOrderPresence = (io, socket) => {
    // Client joins an order room
    socket.on('join_order_room', (data) => {
        const { orderId, user } = data;
        if (!orderId || !user) return;

        // If the socket was in another order room, leave it first
        if (socketToOrderMap.has(socket.id)) {
            const previousOrderId = socketToOrderMap.get(socket.id);
            if (previousOrderId !== orderId) {
                removeUserFromOrder(io, socket.id, previousOrderId);
            }
        }

        // Initialize order map if it doesn't exist
        if (!activeOrderViewers.has(orderId)) {
            activeOrderViewers.set(orderId, new Map());
        }

        // Add user to the room
        activeOrderViewers.get(orderId).set(socket.id, { ...user, socketId: socket.id });
        socketToOrderMap.set(socket.id, orderId);

        // Join the actual socket.io room for localized broadcasting if needed
        socket.join(`order_${orderId}`);

        // Broadcast to everyone (or just admins) the updated presence for this order
        broadcastOrderPresenceUpdate(io, orderId);
    });

    // Client explicitly leaves an order room
    socket.on('leave_order_room', (data) => {
        const { orderId } = data;
        if (orderId) {
            removeUserFromOrder(io, socket.id, orderId);
            socket.leave(`order_${orderId}`);
        }
    });

    // Client requests the state of all orders (for the orders list page)
    socket.on('get_all_orders_presence', () => {
        const allPresence = getAllPresenceData();
        socket.emit('all_orders_presence', allPresence);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socketToOrderMap.has(socket.id)) {
            const orderId = socketToOrderMap.get(socket.id);
            removeUserFromOrder(io, socket.id, orderId);
        }
    });
};

// Helper to remove a user from an order and broadcast
const removeUserFromOrder = (io, socketId, orderId) => {
    if (activeOrderViewers.has(orderId)) {
        const viewersMap = activeOrderViewers.get(orderId);
        viewersMap.delete(socketId);

        // Clean up the order map if empty
        if (viewersMap.size === 0) {
            activeOrderViewers.delete(orderId);
        }

        socketToOrderMap.delete(socketId);

        // Broadcast the update
        broadcastOrderPresenceUpdate(io, orderId);
    }
};

// Broadcast current viewers of a specific order
const broadcastOrderPresenceUpdate = (io, orderId) => {
    const viewers = activeOrderViewers.has(orderId) 
        ? Array.from(activeOrderViewers.get(orderId).values()) 
        : [];
        
    io.emit('order_presence_update', { orderId, viewers });
};

// Format all active orders data for initial load
const getAllPresenceData = () => {
    const allPresence = {};
    for (const [orderId, viewersMap] of activeOrderViewers.entries()) {
        allPresence[orderId] = Array.from(viewersMap.values());
    }
    return allPresence;
};

module.exports = {
    handleOrderPresence
};
