const mongoose = require('mongoose');
const { Order } = require('./src/modules/order/order.model');
const { Product } = require('./src/modules/product/product.model');
const User = require('./src/modules/user/user.model');

// Custom random function
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

mongoose.connect('mongodb://localhost:27017/gold-ecommerce')
  .then(async () => {
    console.log('Connected to DB. Seeding 60 fake orders for analytics...');

    const users = await mongoose.model('User').find().limit(10);
    const products = await Product.find({ isActive: true }).select('title variants category').lean();

    if (users.length === 0 || products.length === 0) {
      console.log('Not enough users or products.');
      process.exit(1);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const statuses = ['delivered', 'delivered', 'delivered', 'delivered', 'confirmed', 'shipped'];

    const ordersToInsert = [];

    for (let i = 0; i < 150; i++) {
      const date = randomDate(thirtyDaysAgo, new Date());
      const user = users[randomInt(0, users.length - 1)];
      const status = statuses[randomInt(0, statuses.length - 1)];
      
      const numItems = randomInt(1, 3);
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[randomInt(0, products.length - 1)];
        if (!product.variants || product.variants.length === 0) continue;
        const variant = product.variants[randomInt(0, product.variants.length - 1)];
        const price = variant.currentPrice || 100;
        // Make qty higher to simulate fast moving products
        const qty = randomInt(5, 15);
        
        items.push({
          product: product._id,
          variant: variant._id,
          quantity: qty,
          price: price,
          total: price * qty,
          subtotal: price * qty
        });
        subtotal += price * qty;
      }

      if (items.length === 0) continue;

      const total = subtotal + 100; // 100 delivery fee
      
      const newOrder = {
        orderId: `FKO-${Date.now()}-${i}`,
        user: user._id,
        items: items,
        subtotal: subtotal,
        deliveryFee: 100,
        total: total,
        steadfastCollectedAmount: total,
        paymentMethod: 'cod',
        paymentStatus: status === 'delivered' ? 'paid' : 'pending',
        status: status,
        statusTimestamps: {
          pending: date,
          confirmed: date,
          delivered: status === 'delivered' ? date : null
        },
        shippingAddress: {
          name: user.name || 'Fake User',
          phone: user.phone || '01700000000',
          street: '123 Fake Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'Dhaka'
        },
        createdAt: date,
        updatedAt: date,
        isDeleted: false
      };

      ordersToInsert.push(newOrder);
    }

    await Order.insertMany(ordersToInsert);
    console.log(`Successfully inserted ${ordersToInsert.length} fake orders.`);

    // Now let's update some product totalSold stats to make the inventory look realistic
    for (const item of ordersToInsert) {
       for(const orderItem of item.items) {
           await Product.findByIdAndUpdate(orderItem.product, {
               $inc: { totalSold: orderItem.quantity }
           });
       }
    }

    console.log('Updated product totalSold fields.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
