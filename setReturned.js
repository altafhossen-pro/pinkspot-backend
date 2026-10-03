const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/gold-ecommerce')
.then(async () => {
    const Order = require('./src/modules/order/order.model').Order;
    // Find 4 delivered orders
    const orders = await Order.find({ status: 'delivered' }).limit(5);
    for (let order of orders) {
        order.status = 'returned';
        await order.save();
        console.log('Updated order', order._id, 'to returned');
    }
    console.log('Done!');
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
