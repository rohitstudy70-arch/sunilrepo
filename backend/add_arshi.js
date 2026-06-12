require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('./models');

const MONGO_URI = process.env.MONGO_URI;

const ALL_PERMS = [
  'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_DEVICE_DELETE', 'COMPANY_PAYMENT',
  'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT',
  'INVENTORY', 'INSTALL', 'REPORTS', 'USERS'
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const hashedPwd = await bcrypt.hash('12345', 10);

  // Check if user already exists
  const existing = await User.findOne({ mobile: 'arshi@gps' });
  if (existing) {
    existing.role = 'ADMIN';
    existing.permissions = ALL_PERMS;
    existing.password = hashedPwd;
    existing.disabled = false;
    await existing.save();
    console.log('arshi@gps already existed — updated to ADMIN with all permissions.');
  } else {
    await User.create({
      id: uuidv4(),
      name: 'arshi@gps',
      mobile: 'arshi@gps',
      password: hashedPwd,
      role: 'ADMIN',
      permissions: ALL_PERMS,
      disabled: false
    });
    console.log('arshi@gps created as ADMIN with all permissions.');
  }

  console.log('\nLogin: Mobile = arshi@gps | Password = 12345 | Role = ADMIN');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
