const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

// Try to find the User model, assuming it's in src/modules/user/user.model.js
const { User } = require('../src/modules/user/user.model');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-ecommerce', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@gmail.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);

    const { Role } = require('../src/modules/role/role.model');
    const superAdminRole = await Role.findOne({ isSuperAdmin: true });

    const updateResult = await User.updateOne(
      { email: adminEmail },
      {
        $set: {
          password: hashedPassword,
          name: 'Super Admin',
          role: 'admin',
          status: 'active',
          roleId: superAdminRole ? superAdminRole._id : null
        }
      },
      { upsert: true }
    );
    console.log(`Password for ${adminEmail} updated to 12345678 successfully.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });