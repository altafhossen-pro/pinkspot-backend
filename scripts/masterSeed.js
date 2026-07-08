const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { seedPermissions } = require('../src/modules/permission/permission.seed');
const { initRoles } = require('../src/scripts/initRoles');
const { Role } = require('../src/modules/role/role.model');
const { User } = require('../src/modules/user/user.model');
const Settings = require('../src/modules/settings/settings.model');

const masterSeed = async () => {
  try {
    console.log('🚀 Starting master seeding process...\n');

    // 1. Connect to database
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-ecommerce';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to database\n');

    // 2. Initialize roles and permissions (initRoles already calls seedPermissions)
    console.log('📋 Initializing Roles and Permissions...');
    // We can't just call initRoles() because it has process.exit(0) inside. 
    // We need to replicate or import without process.exit.
    // Instead of calling the script which exits, let's just do it here:
    
    // Seed permissions
    await seedPermissions();
    console.log('✅ Permissions seeded\n');

    // Setup roles
    const { Permission } = require('../src/modules/permission/permission.model');
    const allPermissions = await Permission.find({ isActive: true });
    
    // Super Admin Role
    let superAdminRole = await Role.findOne({ isSuperAdmin: true });
    if (!superAdminRole) {
      superAdminRole = new Role({
        name: 'Super Admin',
        slug: 'super-admin',
        description: 'Has all permissions. Cannot be modified or deleted.',
        permissions: allPermissions.map(p => p._id),
        isSuperAdmin: true,
        isDefault: false,
        isActive: true,
      });
      await superAdminRole.save();
      console.log('✅ Super Admin role created\n');
    } else {
      superAdminRole.permissions = allPermissions.map(p => p._id);
      await superAdminRole.save();
      console.log('✅ Super Admin role updated\n');
    }

    // Default Admin Role
    let adminRole = await Role.findOne({ slug: 'admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        slug: 'admin',
        description: 'Default admin role with full permissions',
        permissions: allPermissions.map(p => p._id),
        isSuperAdmin: false,
        isDefault: true,
        isActive: true,
      });
      await adminRole.save();
      console.log('✅ Default Admin role created\n');
    }

    // 3. Create Super Admin User
    console.log('👤 Checking Super Admin user...');
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.SUPERADMIN_PASSWORD || 'password123';
    
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      adminUser = new User({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // The string role type
        roleId: superAdminRole._id,
        status: 'active',
        emailVerified: true
      });
      
      await adminUser.save();
      console.log(`✅ Super Admin created: ${adminEmail} (password: ${adminPassword})\n`);
    } else {
      console.log(`ℹ️  Super Admin ${adminEmail} already exists. Making sure role is Super Admin...\n`);
      adminUser.roleId = superAdminRole._id;
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // 4. Initialize Settings
    console.log('⚙️ Checking Settings...');
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({});
      await settings.save();
      console.log('✅ Default settings created\n');
    } else {
      console.log('ℹ️  Settings already exist\n');
    }

    console.log('🎉 Master seeding completed successfully!\n');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during master seeding:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

if (require.main === module) {
  masterSeed();
}

module.exports = { masterSeed };
