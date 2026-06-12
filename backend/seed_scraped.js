require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { 
  User, Company, DeviceType, Device, PurchaseItem, 
  CompanyPayment, Agent, AgentSaleItem, AgentPayment, 
  Installation, PurchaseBatch, AgentSaleBatch, DeletedDevice 
} = require('./models');

const MONGO_URI = process.env.MONGO_URI;

const ALL_PERMS = [
  'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_DEVICE_DELETE', 'COMPANY_PAYMENT',
  'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT',
  'INVENTORY', 'INSTALL', 'REPORTS', 'USERS'
];

function extractAllJsonFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let pos = 0;
  let mergedObj = {};
  
  while (pos < content.length) {
    const startIdx = content.indexOf('{', pos);
    if (startIdx === -1) break;
    
    let braceCount = 0;
    let jsonStr = '';
    
    for (let i = startIdx; i < content.length; i++) {
      const char = content[i];
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      jsonStr += char;
      if (braceCount === 0) {
        break;
      }
    }
    
    if (braceCount === 0 && jsonStr.length > 200) {
      try {
        const parsed = JSON.parse(jsonStr);
        for (const key of Object.keys(parsed)) {
          if (Array.isArray(parsed[key])) {
            mergedObj[key] = parsed[key];
          } else if (mergedObj[key] === undefined) {
            mergedObj[key] = parsed[key];
          }
        }
      } catch (e) {}
    }
    pos = startIdx + 1;
  }
  return mergedObj;
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB.');

  // Clear existing collections
  console.log('Clearing collections...');
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

  // Load scraped blocks
  const scratchDir = path.join(__dirname, '../scratch');
  const devicesBlock = extractAllJsonFromFile(path.join(scratchDir, 'devices_extracted.txt'));
  const companiesBlock = extractAllJsonFromFile(path.join(scratchDir, 'companies_extracted.txt'));
  const agentsBlock = extractAllJsonFromFile(path.join(scratchDir, 'agents_extracted.txt'));
  const usersBlock = extractAllJsonFromFile(path.join(scratchDir, 'users_extracted.txt'));

  if (!devicesBlock.devices || !companiesBlock.companyPayments || !agentsBlock.agentPayments || !usersBlock.users) {
    throw new Error('Failed to load all scraped data blocks.');
  }

  const hashedPwd = await bcrypt.hash('12345', 10);

  // 1. Seed Users
  console.log('Seeding Users...');
  const usersToInsert = [];
  const processedUserMobiles = new Set();

  // Add sunil first
  usersToInsert.push({
    id: '105c36df-7338-4b4e-b7af-fa73e8618627',
    name: 'sunil',
    mobile: '9761334377',
    password: hashedPwd,
    role: 'ADMIN',
    permissions: ALL_PERMS,
    disabled: false
  });
  processedUserMobiles.add('9761334377');

  // Add arshi@gps admin
  usersToInsert.push({
    id: 'arshi_admin_id',
    name: 'arshi@gps',
    mobile: 'arshi@gps',
    password: hashedPwd,
    role: 'ADMIN',
    permissions: ALL_PERMS,
    disabled: false
  });
  processedUserMobiles.add('arshi@gps');

  // Load other users from extracted users list
  for (const u of usersBlock.users) {
    if (!processedUserMobiles.has(u.mobile)) {
      usersToInsert.push({
        id: u.id,
        name: u.name === '$undefined' ? u.mobile : u.name,
        mobile: u.mobile,
        password: hashedPwd,
        role: u.role || 'USER',
        permissions: u.role === 'ADMIN' ? ALL_PERMS : ['COMPANY', 'AGENTS', 'INVENTORY', 'INSTALL'],
        disabled: u.disabled || false
      });
      processedUserMobiles.add(u.mobile);
    }
  }

  // Load users from devices block actorUsers if missing
  for (const u of devicesBlock.actorUsers) {
    if (!processedUserMobiles.has(u.mobile)) {
      usersToInsert.push({
        id: u.id,
        name: u.name,
        mobile: u.mobile,
        password: hashedPwd,
        role: u.name === 'sunil' ? 'ADMIN' : 'USER',
        permissions: u.name === 'sunil' ? ALL_PERMS : ['COMPANY', 'AGENTS', 'INVENTORY', 'INSTALL'],
        disabled: false
      });
      processedUserMobiles.add(u.mobile);
    }
  }

  await User.insertMany(usersToInsert);
  console.log(`Seeded ${usersToInsert.length} Users.`);

  // 2. Seed Companies
  console.log('Seeding Companies...');
  const companiesToInsert = devicesBlock.companies.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || '9911552788',
    address: c.address || 'GURGAON',
    basePrice: c.basePrice || 0
  }));
  await Company.insertMany(companiesToInsert);
  console.log(`Seeded ${companiesToInsert.length} Companies.`);

  // 3. Seed Agents (Partners)
  console.log('Seeding Agents...');
  const agentsToInsert = agentsBlock.agents.map(a => ({
    id: a.id,
    name: a.name,
    phone: a.phone || '7895051411',
    shopName: a.shopName || 'MEERUT',
    defaultPrices: a.defaultPrices || {}
  }));
  await Agent.insertMany(agentsToInsert);
  console.log(`Seeded ${agentsToInsert.length} Agents.`);

  // 4. Seed Devices
  console.log('Seeding Devices...');
  const devicesToInsert = devicesBlock.devices.map(d => ({
    id: d.id,
    serialNumber: d.serialNumber,
    purchasePrice: d.purchasePrice,
    image: d.image || '',
    status: d.status,
    currentOwner: d.currentOwner,
    deviceTypeId: d.deviceTypeId,
    companyId: d.companyId || (devicesBlock.purchaseItems.find(p => p.deviceId === d.id) || {}).companyId || null
  }));
  await Device.insertMany(devicesToInsert);
  console.log(`Seeded ${devicesToInsert.length} Devices.`);

  // 5. Seed PurchaseItems
  console.log('Seeding PurchaseItems...');
  const purchaseItemsToInsert = devicesBlock.purchaseItems.map(p => ({
    id: p.id,
    companyId: p.companyId,
    deviceId: p.deviceId,
    purchasePrice: p.purchasePrice,
    purchasedAt: p.purchasedAt ? new Date(p.purchasedAt) : new Date(),
    createdByUserId: p.createdByUserId || '105c36df-7338-4b4e-b7af-fa73e8618627'
  }));
  await PurchaseItem.insertMany(purchaseItemsToInsert);
  console.log(`Seeded ${purchaseItemsToInsert.length} PurchaseItems.`);

  // 6. Seed CompanyPayments
  console.log('Seeding CompanyPayments...');
  const companyPaymentsToInsert = companiesBlock.companyPayments.map(p => ({
    id: p.id,
    companyId: p.companyId,
    amount: p.amount,
    receiptImage: p.receiptImage || '',
    paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
    createdByUserId: p.createdByUserId || '105c36df-7338-4b4e-b7af-fa73e8618627'
  }));
  await CompanyPayment.insertMany(companyPaymentsToInsert);
  console.log(`Seeded ${companyPaymentsToInsert.length} CompanyPayments.`);

  // 7. Seed AgentSaleItems
  console.log('Seeding AgentSaleItems...');
  const agentSaleItemsToInsert = agentsBlock.agentSaleItems.map(s => ({
    id: s.id,
    agentId: s.agentId,
    deviceId: s.deviceId,
    costPrice: s.costPrice,
    sellingPrice: s.sellingPrice,
    saleType: s.saleType,
    originSaleType: s.originSaleType || s.saleType,
    customerName: s.customerName || '',
    customerPhone: s.customerPhone || '',
    carNumber: s.carNumber || '',
    chassisNumber: s.chassisNumber || '',
    companyId: s.companyId || '',
    remarks: s.remarks || '',
    hasNicPdf: s.hasNicPdf || false,
    hasWahanPdf: s.hasWahanPdf || false,
    nicPdfUrl: s.nicPdfUrl || '',
    wahanPdfUrl: s.wahanPdfUrl || '',
    soldAt: s.soldAt ? new Date(s.soldAt) : new Date(),
    createdByUserId: s.createdByUserId || '105c36df-7338-4b4e-b7af-fa73e8618627'
  }));
  await AgentSaleItem.insertMany(agentSaleItemsToInsert);
  console.log(`Seeded ${agentSaleItemsToInsert.length} AgentSaleItems.`);

  // 8. Seed AgentPayments
  console.log('Seeding AgentPayments...');
  const agentPaymentsToInsert = agentsBlock.agentPayments.map(p => ({
    id: p.id,
    agentId: p.agentId,
    amount: p.amount,
    receiptImage: p.receiptImage || '',
    paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
    paymentMethod: p.paymentMethod || 'CASH',
    note: p.note || '',
    createdByUserId: p.createdByUserId || '105c36df-7338-4b4e-b7af-fa73e8618627'
  }));
  await AgentPayment.insertMany(agentPaymentsToInsert);
  console.log(`Seeded ${agentPaymentsToInsert.length} AgentPayments.`);

  // 9. Seed Installations
  console.log('Seeding Installations...');
  const installationsToInsert = devicesBlock.installations.map(i => ({
    id: i.id,
    deviceId: i.deviceId,
    agentId: i.agentId,
    userId: i.userId || '8f91590f-1d48-4fa5-b939-20344af4b178',
    customerName: i.customerName,
    customerPhone: i.customerPhone,
    alternatePhone: i.alternatePhone || '',
    carNumber: i.carNumber,
    chassisNumber: i.chassisNumber,
    installedAt: i.installedAt ? new Date(i.installedAt) : new Date(),
    installationType: i.installationType || 'INSTALL',
    remarks: i.remarks || '',
    companyId: i.companyId || ''
  }));
  await Installation.insertMany(installationsToInsert);
  console.log(`Seeded ${installationsToInsert.length} Installations.`);

  // 10. Seed DeletedDevices
  console.log('Seeding DeletedDevices...');
  const deletedDevicesToInsert = devicesBlock.deletedDeviceRecords.map(d => ({
    id: d.id,
    deviceId: d.deviceId,
    serialNumber: d.serialNumber,
    purchasePrice: d.purchasePrice,
    image: d.image || '',
    deviceTypeId: d.deviceTypeId || null,
    status: d.status || 'IN_STOCK',
    currentOwner: d.currentOwner || 'Company',
    companyId: d.companyId,
    purchasedAt: d.purchasedAt ? new Date(d.purchasedAt) : new Date(),
    deletedAt: d.deletedAt ? new Date(d.deletedAt) : new Date(),
    deletedByUserId: d.deletedByUserId || '39989ff0-c1c2-49e6-903f-b400a4940790'
  }));
  await DeletedDevice.insertMany(deletedDevicesToInsert);
  console.log(`Seeded ${deletedDevicesToInsert.length} DeletedDevices.`);

  console.log('\nAll scraped reference app data successfully seeded! 🎉');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
