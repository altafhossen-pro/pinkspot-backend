const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Division, District, Upazila, DhakaCity } = require('../src/modules/address/address.model');

const exportData = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gold-ecommerce';
    await mongoose.connect(dbUri);
    console.log('✅ Connected to database');

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const divisions = await Division.find().lean();
    fs.writeFileSync(path.join(dataDir, 'divisions.json'), JSON.stringify(divisions, null, 2));
    console.log(`✅ Exported ${divisions.length} divisions`);

    const districts = await District.find().lean();
    fs.writeFileSync(path.join(dataDir, 'districts.json'), JSON.stringify(districts, null, 2));
    console.log(`✅ Exported ${districts.length} districts`);

    const upazilas = await Upazila.find().lean();
    fs.writeFileSync(path.join(dataDir, 'upazilas.json'), JSON.stringify(upazilas, null, 2));
    console.log(`✅ Exported ${upazilas.length} upazilas`);

    const dhakaCities = await DhakaCity.find().lean();
    fs.writeFileSync(path.join(dataDir, 'dhakacities.json'), JSON.stringify(dhakaCities, null, 2));
    console.log(`✅ Exported ${dhakaCities.length} dhaka cities`);

    console.log('🎉 All data exported successfully to scripts/data folder');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

exportData();
