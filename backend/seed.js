/**
 * Seed Script — Populates the database with dummy data matching the reference app.
 * Run:  node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  User, Company, DeviceType, Device, PurchaseItem,
  CompanyPayment, Agent, AgentSaleItem, AgentPayment,
  Installation, PurchaseBatch, AgentSaleBatch, DeletedDevice
} = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/device-distribution';

// All permissions list
const ALL_PERMS = [
  'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_DEVICE_DELETE', 'COMPANY_PAYMENT',
  'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT',
  'INVENTORY', 'INSTALL', 'REPORTS', 'USERS'
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Clearing existing data...');

  // Clear everything
  await User.deleteMany({});
  await Company.deleteMany({});
  await DeviceType.deleteMany({});
  await Device.deleteMany({});
  await PurchaseItem.deleteMany({});
  await CompanyPayment.deleteMany({});
  await Agent.deleteMany({});
  await AgentSaleItem.deleteMany({});
  await AgentPayment.deleteMany({});
  await Installation.deleteMany({});
  await PurchaseBatch.deleteMany({});
  await AgentSaleBatch.deleteMany({});
  await DeletedDevice.deleteMany({});
  console.log('All collections cleared.');

  // ─────────────────────── USERS ───────────────────────
  const hashedPwd = await bcrypt.hash('12345', 10);
  const adminUser = await User.create({
    id: uuidv4(), name: 'sunil', mobile: '9761334377',
    password: hashedPwd, role: 'ADMIN', permissions: ALL_PERMS
  });
  const user2 = await User.create({
    id: uuidv4(), name: 'ronijaat', mobile: '7310986315',
    password: hashedPwd, role: 'USER', permissions: ['COMPANY','AGENTS','INVENTORY','INSTALL','AGENT_SALE','COMPANY_DEVICE_ADD']
  });
  const user3 = await User.create({
    id: uuidv4(), name: 'suraj', mobile: '7417421410',
    password: hashedPwd, role: 'USER', permissions: ['INSTALL','INVENTORY','AGENTS']
  });
  const user4 = await User.create({
    id: uuidv4(), name: 'Hemant', mobile: '7895490270',
    password: hashedPwd, role: 'USER', permissions: ['INSTALL','INVENTORY']
  });
  console.log('Users created: sunil (ADMIN), ronijaat, suraj, Hemant');

  // ─────────────────────── COMPANIES ───────────────────────
  const compWatsoo = await Company.create({ id: uuidv4(), name: 'WATSOO', phone: '9289046951', address: 'GURGAON', basePrice: 5500 });
  const compITriangle = await Company.create({ id: uuidv4(), name: 'iTRIANGLE', phone: '+91 77828 08063', address: 'POORNIA', basePrice: 6018 });
  const compRosmerta = await Company.create({ id: uuidv4(), name: 'ROSMERTA', phone: '+91 97795 99922', address: 'GHAZIABAD', basePrice: 5800 });
  const compBlackbox = await Company.create({ id: uuidv4(), name: 'BLACKBOX', phone: '+91 98704 48815', address: 'SHARANPUR', basePrice: 6200 });
  const compMasroof = await Company.create({ id: uuidv4(), name: 'MASROOF', phone: '9911552788', address: 'BERAILLY', basePrice: 5000 });
  const companies = [compWatsoo, compITriangle, compRosmerta, compBlackbox, compMasroof];
  console.log('Companies created: WATSOO, iTRIANGLE, ROSMERTA, BLACKBOX, MASROOF');

  // ─────────────────────── DEVICE TYPES ───────────────────────
  const typeAIS = await DeviceType.create({ id: uuidv4(), companyId: compITriangle.id, name: 'AIS140', basePrice: 6500 });
  const typeBasic = await DeviceType.create({ id: uuidv4(), companyId: compWatsoo.id, name: 'Basic Tracker', basePrice: 5500 });
  const typeOBD = await DeviceType.create({ id: uuidv4(), companyId: compRosmerta.id, name: 'OBD GPS', basePrice: 6000 });
  console.log('Device Types created: AIS140, Basic Tracker, OBD GPS');

  // ─────────────────────── AGENTS (PARTNERS) ───────────────────────
  const agMadhur = await Agent.create({
    id: uuidv4(), name: 'MADHUR', phone: '7895051411', shopName: 'ROHTA MEERUT',
    defaultPrices: { [compWatsoo.id]: 7000, [compITriangle.id]: 7500 }
  });
  const agInder = await Agent.create({
    id: uuidv4(), name: 'INDER', phone: '9927010414', shopName: 'MUZAFFARNAGAR',
    defaultPrices: { [compWatsoo.id]: 7200, [compITriangle.id]: 7800 }
  });
  const agPoornia = await Agent.create({
    id: uuidv4(), name: 'POORNIA OFFICE', phone: '7782808063', shopName: 'POORNIA BRANCH',
    defaultPrices: { [compITriangle.id]: 7000 }
  });
  const agSuraj = await Agent.create({
    id: uuidv4(), name: 'SURAJ TRADER', phone: '7417421410', shopName: 'MEERUT CITY',
    defaultPrices: { [compWatsoo.id]: 6800, [compBlackbox.id]: 7500 }
  });
  const agHemant = await Agent.create({
    id: uuidv4(), name: 'HEMANT ELECTRONICS', phone: '7895490270', shopName: 'BIJNOR',
    defaultPrices: { [compRosmerta.id]: 7200 }
  });
  const agents = [agMadhur, agInder, agPoornia, agSuraj, agHemant];
  console.log('Agents created: MADHUR, INDER, POORNIA OFFICE, SURAJ TRADER, HEMANT ELECTRONICS');

  // ─────────────────────── DEVICES & PURCHASE ITEMS ───────────────────────
  // Helper to generate IMEI-like IDs
  const genIMEI = (prefix, idx) => `${prefix}${String(idx).padStart(9, '0')}`;
  const genSerial = (prefix, idx) => `${prefix}${String(idx).padStart(5, '0')}`;

  const allDevices = [];
  const allPurchaseItems = [];

  // 50 devices across companies
  const deviceDefs = [
    // WATSOO — 15 devices
    ...Array.from({ length: 15 }, (_, i) => ({
      companyId: compWatsoo.id, imei: genIMEI('358250331', i + 1),
      serial: genSerial('WTS', i + 1), price: 5500, typeId: typeBasic.id,
      purchasedAt: new Date(2026, 5, 1 + Math.floor(i / 5))
    })),
    // iTRIANGLE — 15 devices
    ...Array.from({ length: 15 }, (_, i) => ({
      companyId: compITriangle.id, imei: genIMEI('869710050', i + 1),
      serial: genSerial('ITR', i + 1), price: 6018, typeId: typeAIS.id,
      purchasedAt: new Date(2026, 5, 2 + Math.floor(i / 5))
    })),
    // ROSMERTA — 8 devices
    ...Array.from({ length: 8 }, (_, i) => ({
      companyId: compRosmerta.id, imei: genIMEI('352672110', i + 1),
      serial: genSerial('ROS', i + 1), price: 5800, typeId: typeOBD.id,
      purchasedAt: new Date(2026, 5, 3 + Math.floor(i / 3))
    })),
    // BLACKBOX — 7 devices
    ...Array.from({ length: 7 }, (_, i) => ({
      companyId: compBlackbox.id, imei: genIMEI('862304044', i + 1),
      serial: genSerial('BBX', i + 1), price: 6200, typeId: null,
      purchasedAt: new Date(2026, 5, 4 + Math.floor(i / 3))
    })),
    // MASROOF — 5 devices
    ...Array.from({ length: 5 }, (_, i) => ({
      companyId: compMasroof.id, imei: genIMEI('863921077', i + 1),
      serial: genSerial('MSR', i + 1), price: 5000, typeId: null,
      purchasedAt: new Date(2026, 5, 5)
    })),
  ];

  for (const dd of deviceDefs) {
    const dev = await Device.create({
      id: dd.imei, serialNumber: dd.serial, purchasePrice: dd.price,
      status: 'IN_STOCK', currentOwner: 'Company',
      deviceTypeId: dd.typeId, companyId: dd.companyId
    });
    allDevices.push(dev);

    const pi = await PurchaseItem.create({
      id: uuidv4(), companyId: dd.companyId, deviceId: dd.imei,
      purchasePrice: dd.price, purchasedAt: dd.purchasedAt,
      createdByUserId: adminUser.id
    });
    allPurchaseItems.push(pi);
  }
  console.log(`${allDevices.length} devices purchased across all suppliers.`);

  // ─────────────────────── COMPANY PAYMENTS ───────────────────────
  await CompanyPayment.create({ id: uuidv4(), companyId: compWatsoo.id, amount: 40000, paymentDate: new Date(2026, 5, 3), createdByUserId: adminUser.id });
  await CompanyPayment.create({ id: uuidv4(), companyId: compITriangle.id, amount: 50000, paymentDate: new Date(2026, 5, 4), createdByUserId: adminUser.id });
  await CompanyPayment.create({ id: uuidv4(), companyId: compITriangle.id, amount: 40000, paymentDate: new Date(2026, 5, 8), createdByUserId: adminUser.id });
  await CompanyPayment.create({ id: uuidv4(), companyId: compRosmerta.id, amount: 25000, paymentDate: new Date(2026, 5, 5), createdByUserId: adminUser.id });
  await CompanyPayment.create({ id: uuidv4(), companyId: compBlackbox.id, amount: 20000, paymentDate: new Date(2026, 5, 6), createdByUserId: adminUser.id });
  await CompanyPayment.create({ id: uuidv4(), companyId: compMasroof.id, amount: 10000, paymentDate: new Date(2026, 5, 7), createdByUserId: adminUser.id });
  console.log('Company payments recorded (₹185,000 total).');

  // ─────────────────────── AGENT SALES ───────────────────────
  // Sell 25 devices to agents — mix of INSTALLED and PARCELED
  const customerNames = [
    'Rahul Kumar', 'Amit Sharma', 'Priya Singh', 'Vikram Yadav', 'Sanjay Gupta',
    'Neha Verma', 'Mohit Jain', 'Deepak Rawat', 'Suresh Chauhan', 'Anil Pandit',
    'Ramesh Tyagi', 'Kavita Devi', 'Pooja Saini', 'Lalit Mohan', 'Rajiv Tiwari',
    'Vinod Nagar', 'Anita Bhatt', 'Mukesh Garg', 'Ravi Malik', 'Sunita Rani',
    'Ashok Thakur', 'Meena Kumari', 'Dinesh Chandra', 'Pankaj Sharma', 'Kiran Bala'
  ];
  const carNumbers = [
    'UP-14-AB-1234', 'DL-8C-AE-5678', 'UP-58-CD-9012', 'HR-26-BX-3456', 'UP-15-GH-7890',
    'DL-1CA-1122', 'UP-14-EF-3344', 'UK-07-AJ-5566', 'UP-21-KL-7788', 'HR-51-MN-9900',
    'UP-80-PQ-2233', 'DL-4S-RS-4455', 'UP-65-TU-6677', 'HR-36-VW-8899', 'UP-14-XY-0011',
    'DL-9C-AB-2244', 'UP-25-CD-3366', 'UK-04-EF-4488', 'UP-09-GH-5500', 'HR-06-IJ-6622',
    'UP-53-KL-7744', 'DL-2C-MN-8866', 'UP-78-OP-9988', 'HR-12-QR-1100', 'UP-14-ST-2211'
  ];
  const chassisNos = customerNames.map((_, i) => `CH${String(10000 + i * 137)}`);

  const salesDefs = [];
  // First 12: INSTALLED (fully installed from day one)
  for (let i = 0; i < 12; i++) {
    const agIdx = i % agents.length;
    salesDefs.push({
      device: allDevices[i], agent: agents[agIdx],
      saleType: 'INSTALLED', customerName: customerNames[i],
      customerPhone: `98${String(10000000 + i * 1111111).slice(0, 8)}`,
      carNumber: carNumbers[i], chassisNumber: chassisNos[i],
      sellingPrice: 7000 + (i % 3) * 500,
      soldAt: new Date(2026, 5, 3 + Math.floor(i / 4))
    });
  }
  // Next 8: PARCELED (stock assignment, some will be installed later)
  for (let i = 12; i < 20; i++) {
    const agIdx = i % agents.length;
    salesDefs.push({
      device: allDevices[i], agent: agents[agIdx],
      saleType: 'PARCELED', customerName: '', customerPhone: '',
      carNumber: '', chassisNumber: '',
      sellingPrice: 7200 + (i % 2) * 300,
      soldAt: new Date(2026, 5, 5 + Math.floor(i / 5))
    });
  }
  // Next 5: INSTALLED more recent
  for (let i = 20; i < 25; i++) {
    const agIdx = i % agents.length;
    salesDefs.push({
      device: allDevices[i], agent: agents[agIdx],
      saleType: 'INSTALLED', customerName: customerNames[i],
      customerPhone: `97${String(20000000 + i * 2222222).slice(0, 8)}`,
      carNumber: carNumbers[i], chassisNumber: chassisNos[i],
      sellingPrice: 7500,
      soldAt: new Date(2026, 5, 9 + Math.floor((i - 20) / 2))
    });
  }

  const allSaleItems = [];
  for (const sd of salesDefs) {
    sd.device.status = 'SOLD_TO_AGENT';
    sd.device.currentOwner = sd.saleType === 'INSTALLED' ? (sd.customerName || sd.agent.name) : sd.agent.name;
    await sd.device.save();

    const si = await AgentSaleItem.create({
      id: uuidv4(), agentId: sd.agent.id, deviceId: sd.device.id,
      costPrice: sd.device.purchasePrice, sellingPrice: sd.sellingPrice,
      saleType: sd.saleType, originSaleType: sd.saleType,
      customerName: sd.customerName, customerPhone: sd.customerPhone,
      carNumber: sd.carNumber, chassisNumber: sd.chassisNumber,
      companyId: sd.device.companyId, soldAt: sd.soldAt,
      createdByUserId: adminUser.id
    });
    allSaleItems.push(si);
  }
  console.log(`${salesDefs.length} device sales recorded (12 installed + 8 parceled + 5 recent installed).`);

  // ─────────────────────── INSTALLATIONS ───────────────────────
  // Create installation records for all INSTALLED type sales
  const installedSales = salesDefs.filter(s => s.saleType === 'INSTALLED');
  for (const sd of installedSales) {
    sd.device.status = 'INSTALLED';
    sd.device.currentOwner = sd.customerName;
    await sd.device.save();

    await Installation.create({
      id: uuidv4(), deviceId: sd.device.id, agentId: sd.agent.id,
      userId: adminUser.id,
      customerName: sd.customerName, customerPhone: sd.customerPhone,
      carNumber: sd.carNumber, chassisNumber: sd.chassisNumber,
      installedAt: new Date(sd.soldAt.getTime() + 86400000), // installed 1 day after sale
      remarks: 'Installation completed successfully',
      companyId: sd.device.companyId
    });
  }
  // Also install 3 of the parceled ones (simulate completed installations)
  for (let i = 12; i < 15; i++) {
    const sd = salesDefs[i];
    const custName = customerNames[i];
    const custPhone = `96${String(30000000 + i * 3333333).slice(0, 8)}`;
    const carNum = carNumbers[i];
    const chassisNum = chassisNos[i];

    sd.device.status = 'INSTALLED';
    sd.device.currentOwner = custName;
    await sd.device.save();

    // Update sale item too
    const si = allSaleItems[i];
    si.saleType = 'INSTALLED';
    si.customerName = custName;
    si.customerPhone = custPhone;
    si.carNumber = carNum;
    si.chassisNumber = chassisNum;
    await si.save();

    await Installation.create({
      id: uuidv4(), deviceId: sd.device.id, agentId: sd.agent.id,
      userId: user2.id,
      customerName: custName, customerPhone: custPhone,
      carNumber: carNum, chassisNumber: chassisNum,
      installedAt: new Date(2026, 5, 10),
      remarks: 'Parceled device installation completed',
      companyId: sd.device.companyId
    });
  }
  console.log(`${installedSales.length + 3} installations recorded (${installedSales.length} direct + 3 parceled-to-installed).`);

  // ─────────────────────── AGENT PAYMENTS ───────────────────────
  await AgentPayment.create({ id: uuidv4(), agentId: agMadhur.id, amount: 15000, paymentDate: new Date(2026, 5, 6), paymentMethod: 'CASH', note: 'First installment', createdByUserId: adminUser.id });
  await AgentPayment.create({ id: uuidv4(), agentId: agMadhur.id, amount: 7000, paymentDate: new Date(2026, 5, 10), paymentMethod: 'ONLINE', note: 'UPI payment', createdByUserId: adminUser.id });
  await AgentPayment.create({ id: uuidv4(), agentId: agInder.id, amount: 10000, paymentDate: new Date(2026, 5, 7), paymentMethod: 'CASH', note: '', createdByUserId: adminUser.id });
  await AgentPayment.create({ id: uuidv4(), agentId: agPoornia.id, amount: 5000, paymentDate: new Date(2026, 5, 8), paymentMethod: 'ONLINE', note: 'IMPS transfer', createdByUserId: adminUser.id });
  await AgentPayment.create({ id: uuidv4(), agentId: agSuraj.id, amount: 8000, paymentDate: new Date(2026, 5, 9), paymentMethod: 'CASH', note: '', createdByUserId: adminUser.id });
  await AgentPayment.create({ id: uuidv4(), agentId: agHemant.id, amount: 7000, paymentDate: new Date(2026, 5, 10), paymentMethod: 'CHQ', note: 'Cheque #4521', createdByUserId: adminUser.id });
  console.log('Agent payments recorded (₹52,000 total collected from partners).');

  // ─────────────────────── DELETED DEVICE LOGS ───────────────────────
  // Soft delete 2 devices for testing archive
  const delDev1 = allDevices[45]; // IN_STOCK device
  const delDev2 = allDevices[46];

  for (const dd of [delDev1, delDev2]) {
    await DeletedDevice.create({
      id: uuidv4(), deviceId: dd.id, serialNumber: dd.serialNumber,
      purchasePrice: dd.purchasePrice, deviceTypeId: dd.deviceTypeId,
      status: dd.status, currentOwner: dd.currentOwner,
      companyId: dd.companyId,
      purchasedAt: new Date(2026, 5, 5),
      deletedAt: new Date(2026, 5, 11),
      deletedByUserId: adminUser.id
    });
    await Device.deleteOne({ id: dd.id });
    await PurchaseItem.deleteOne({ deviceId: dd.id });
  }
  console.log('2 devices soft-deleted to archive logs.');

  // ─────────────────────── SUMMARY ───────────────────────
  const finalDevCount = await Device.countDocuments();
  const finalInstCount = await Installation.countDocuments();
  const finalAgentSaleCount = await AgentSaleItem.countDocuments();

  console.log('\n═══════════════════════════════════════');
  console.log('     SEED COMPLETE — SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Users:          4 (admin + 3 users)`);
  console.log(`Companies:      ${companies.length}`);
  console.log(`Device Types:   3`);
  console.log(`Devices:        ${finalDevCount} active (2 soft-deleted)`);
  console.log(`Sales:          ${finalAgentSaleCount}`);
  console.log(`Installations:  ${finalInstCount}`);
  console.log(`Deleted Logs:   2`);
  console.log('───────────────────────────────────────');
  console.log('LOGIN CREDENTIALS:');
  console.log('  ADMIN:  Mobile: 9761334377  Password: 12345');
  console.log('  USER1:  Mobile: 7310986315  Password: 12345');
  console.log('  USER2:  Mobile: 7417421410  Password: 12345');
  console.log('  USER3:  Mobile: 7895490270  Password: 12345');
  console.log('═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Done. MongoDB disconnected.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
