const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  User,
  Company,
  DeviceType,
  Device,
  PurchaseItem,
  CompanyPayment,
  Agent,
  AgentSaleItem,
  AgentPayment,
  Installation,
  AgentSaleBatch,
  PurchaseBatch,
  DeletedDevice
} = require('./models');
const { protect, checkPermission } = require('./middleware/auth');

// Helper to calculate start dates
const getTimeframes = () => {
  const now = new Date();
  
  // Today (Start of today)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // This Week (Monday of this week)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Reset now
  const now2 = new Date();
  // This Month (1st of this month)
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1);
  
  return { today, startOfWeek, startOfMonth };
};

// Helper for date range filtering in reports
const getRangeDates = (range, start, end) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();
  
  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }
  
  endDate.setHours(23, 59, 59, 999);
  
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last7':
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last30':
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last90':
      startDate.setDate(now.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  return { startDate, endDate };
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Login Route
router.post('/auth/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Please provide mobile and password' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ error: 'Invalid mobile or password' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Your account is disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid mobile or password' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'dev_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user info
router.get('/auth/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      mobile: req.user.mobile,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// ==========================================
// COMPANY ROUTES
// ==========================================

// GET all companies with summaries
router.get('/companies', protect, checkPermission('COMPANY'), async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    const summaries = [];
    const deviceTypes = await DeviceType.find();

    for (const comp of companies) {
      // Find devices purchased from this company
      const purchases = await PurchaseItem.find({ companyId: comp.id });
      const deviceIds = purchases.map(p => p.deviceId);
      const devices = await Device.find({ id: { $in: deviceIds } });

      const devicesCount = devices.length;
      const totalPurchaseValue = purchases.reduce((sum, item) => sum + item.purchasePrice, 0);

      // Payments made
      const payments = await CompanyPayment.find({ companyId: comp.id });
      const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
      const totalDue = totalPurchaseValue - totalPaid;

      summaries.push({
        company: comp,
        devicesCount,
        totalPurchaseValue,
        totalPaid,
        totalDue
      });
    }

    res.json({ companies, summaries, deviceTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching companies' });
  }
});

// GET single company details
router.get('/companies/:id', protect, checkPermission('COMPANY_DETAILS'), async (req, res) => {
  try {
    const comp = await Company.findOne({ id: req.params.id });
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const purchases = await PurchaseItem.find({ companyId: comp.id }).sort({ purchasedAt: -1 });
    const payments = await CompanyPayment.find({ companyId: comp.id }).sort({ paymentDate: -1 });
    const deviceTypes = await DeviceType.find({ companyId: comp.id }).sort({ createdAt: -1 });

    const deviceIds = purchases.map(p => p.deviceId);
    const devices = await Device.find({ id: { $in: deviceIds } });

    const devicesCount = devices.length;
    const totalPurchaseValue = purchases.reduce((sum, item) => sum + item.purchasePrice, 0);
    const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
    const totalDue = totalPurchaseValue - totalPaid;

    res.json({
      company: comp,
      devicesCount,
      totalPurchaseValue,
      totalPaid,
      totalDue,
      purchases,
      payments,
      deviceTypes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching company details' });
  }
});

// POST create company
router.post('/companies', protect, checkPermission('COMPANY_CREATE'), async (req, res) => {
  try {
    const { name, phone, address, basePrice } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'Name, phone, and address are required' });
    }

    const company = new Company({
      name,
      phone,
      address,
      basePrice: Number(basePrice) || 0
    });
    await company.save();

    res.status(201).json({ success: true, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating company' });
  }
});

// POST purchase device
router.post('/companies/purchase', protect, checkPermission('COMPANY_DEVICE_ADD'), async (req, res) => {
  try {
    const { companyId, deviceId, serialNumber, purchasePrice, purchasedAt, deviceTypeId, image } = req.body;
    if (!companyId || !deviceId || !serialNumber) {
      return res.status(400).json({ error: 'Company, Device ID (IMEI), and Serial are required' });
    }

    const existing = await Device.findOne({ id: deviceId });
    if (existing) {
      return res.status(400).json({ error: 'Device ID (IMEI) already exists in inventory' });
    }

    const company = await Company.findOne({ id: companyId });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Resolve price
    let pPrice = Number(purchasePrice);
    if (pPrice === 0 || isNaN(pPrice)) {
      if (deviceTypeId) {
        const type = await DeviceType.findOne({ id: deviceTypeId });
        pPrice = type ? type.basePrice : company.basePrice;
      } else {
        pPrice = company.basePrice;
      }
    }

    const device = new Device({
      id: deviceId,
      serialNumber,
      purchasePrice: pPrice,
      image: image || '',
      status: 'IN_STOCK',
      currentOwner: 'Company',
      deviceTypeId: deviceTypeId || null,
      companyId: companyId
    });
    await device.save();

    const purchaseItem = new PurchaseItem({
      companyId,
      deviceId,
      purchasePrice: pPrice,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
      createdByUserId: req.user.id
    });
    await purchaseItem.save();

    res.status(201).json({ success: true, device, purchaseItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding purchase' });
  }
});

// POST bulk CSV purchase upload
router.post('/companies/purchase/bulk', protect, checkPermission('COMPANY_DEVICE_ADD'), async (req, res) => {
  try {
    const { companyId, csvText } = req.body;
    if (!companyId || !csvText) {
      return res.status(400).json({ error: 'Company and CSV content are required' });
    }

    const company = await Company.findOne({ id: companyId });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain headers and at least one device row' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const deviceIdIdx = headers.findIndex(h => h.includes('imei') || h.includes('deviceid') || h.includes('device id'));
    const serialIdx = headers.findIndex(h => h.includes('serial') || h.includes('serialnumber'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('purchaseprice'));
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('purchasedat'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('devicetype'));

    if (deviceIdIdx === -1 || serialIdx === -1) {
      return res.status(400).json({ error: 'CSV must contain IMEI/deviceId and Serial columns' });
    }

    const importedDevices = [];
    const deviceIds = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 2) continue;

      const deviceId = cols[deviceIdIdx];
      const serialNumber = cols[serialIdx];
      if (!deviceId || !serialNumber) continue;

      // Check duplicates
      const existing = await Device.findOne({ id: deviceId });
      if (existing) continue;

      let deviceTypeId = null;
      if (typeIdx !== -1 && cols[typeIdx]) {
        const type = await DeviceType.findOne({
          companyId,
          $or: [{ id: cols[typeIdx] }, { name: new RegExp('^' + cols[typeIdx] + '$', 'i') }]
        });
        if (type) deviceTypeId = type.id;
      }

      let rawPrice = priceIdx !== -1 ? Number(cols[priceIdx]) : 0;
      let purchasePrice = rawPrice;
      if (!purchasePrice) {
        if (deviceTypeId) {
          const typeObj = await DeviceType.findOne({ id: deviceTypeId });
          purchasePrice = typeObj ? typeObj.basePrice : company.basePrice;
        } else {
          purchasePrice = company.basePrice;
        }
      }

      const purchasedAt = dateIdx !== -1 && cols[dateIdx] ? new Date(cols[dateIdx]) : new Date();

      const device = new Device({
        id: deviceId,
        serialNumber,
        purchasePrice,
        status: 'IN_STOCK',
        currentOwner: 'Company',
        deviceTypeId,
        companyId
      });
      await device.save();

      const purchaseItem = new PurchaseItem({
        companyId,
        deviceId,
        purchasePrice,
        purchasedAt,
        createdByUserId: req.user.id
      });
      await purchaseItem.save();

      importedDevices.push(device);
      deviceIds.push(deviceId);
    }

    if (importedDevices.length === 0) {
      return res.status(400).json({ error: 'No new devices could be imported (check for duplicates)' });
    }

    const batch = new PurchaseBatch({
      companyId,
      uploadedByUserId: req.user.id,
      imported: importedDevices.length,
      deviceIds
    });
    await batch.save();

    res.status(201).json({ success: true, batch, count: importedDevices.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error bulk purchasing devices' });
  }
});

// POST revert purchase batch
router.post('/companies/purchase/revert/:batchId', protect, checkPermission('COMPANY_DEVICE_ADD'), async (req, res) => {
  try {
    const batch = await PurchaseBatch.findOne({ id: req.params.batchId });
    if (!batch) return res.status(404).json({ error: 'Purchase batch not found' });
    if (batch.status === 'REVERTED') return res.status(400).json({ error: 'Batch is already reverted' });

    // Verify all devices in batch are still in stock
    const activeDevices = await Device.find({ id: { $in: batch.deviceIds } });
    const soldDevices = activeDevices.filter(d => d.status !== 'IN_STOCK');
    if (soldDevices.length > 0) {
      return res.status(400).json({
        error: `Cannot revert: ${soldDevices.length} devices are sold/installed (e.g. IMEI ${soldDevices[0].id})`
      });
    }

    // Delete devices and purchase items
    await Device.deleteMany({ id: { $in: batch.deviceIds } });
    await PurchaseItem.deleteMany({ deviceId: { $in: batch.deviceIds } });

    batch.status = 'REVERTED';
    await batch.save();

    res.json({ success: true, batch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error reverting purchase batch' });
  }
});

// GET purchase batches list
router.get('/companies/purchase/batches', protect, async (req, res) => {
  try {
    const batches = await PurchaseBatch.find().sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching purchase batches' });
  }
});

// POST company payment
router.post('/companies/payment', protect, checkPermission('COMPANY_PAYMENT'), async (req, res) => {
  try {
    const { companyId, amount, receiptImage, paymentDate } = req.body;
    if (!companyId || !amount) {
      return res.status(400).json({ error: 'Company and amount are required' });
    }

    const payment = new CompanyPayment({
      companyId,
      amount: Number(amount),
      receiptImage: receiptImage || '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      createdByUserId: req.user.id
    });
    await payment.save();

    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding payment' });
  }
});

// POST create device type
router.post('/companies/types', protect, checkPermission('COMPANY_CREATE'), async (req, res) => {
  try {
    const { companyId, name, basePrice } = req.body;
    if (!companyId || !name) {
      return res.status(400).json({ error: 'Company and type name are required' });
    }

    const deviceType = new DeviceType({
      companyId,
      name,
      basePrice: Number(basePrice) || 0
    });
    await deviceType.save();

    res.status(201).json({ success: true, deviceType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating device type' });
  }
});

// GET all device types
router.get('/device-types', protect, async (req, res) => {
  try {
    const deviceTypes = await DeviceType.find().sort({ createdAt: -1 });
    res.json({ success: true, deviceTypes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching device types' });
  }
});

// ==========================================
// AGENT ROUTES
// ==========================================

// GET all agents with summaries and options
router.get('/agents', protect, checkPermission('AGENTS'), async (req, res) => {
  try {
    const agents = await Agent.find().sort({ name: 1 });
    const summaries = [];
    const devices = await Device.find();
    const companies = await Company.find().sort({ name: 1 });
    const deviceTypes = await DeviceType.find();
    const batches = await AgentSaleBatch.find().sort({ createdAt: -1 });
    const actorUsers = await User.find({}, 'id name mobile');
    const agentSaleItems = await AgentSaleItem.find();
    const agentPayments = await AgentPayment.find();

    for (const ag of agents) {
      const sales = await AgentSaleItem.find({ agentId: ag.id });
      const devicesSold = sales.length;
      const totalSales = sales.reduce((sum, item) => sum + item.sellingPrice, 0);
      const totalCost = sales.reduce((sum, item) => sum + item.costPrice, 0);

      const payments = await AgentPayment.find({ agentId: ag.id });
      const totalReceived = payments.reduce((sum, item) => sum + item.amount, 0);

      const pendingAmount = totalSales - totalReceived;
      const profitGenerated = totalSales - totalCost;

      summaries.push({
        agent: ag,
        devicesSold,
        totalSales,
        totalReceived,
        pendingAmount,
        profitGenerated
      });
    }

    res.json({
      agents,
      summaries,
      devices,
      companies,
      deviceTypes,
      batches,
      actorUsers,
      agentSaleItems,
      agentPayments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching agents list' });
  }
});

// GET single agent details
router.get('/agents/:id', protect, checkPermission('AGENT_DETAILS'), async (req, res) => {
  try {
    const ag = await Agent.findOne({ id: req.params.id });
    if (!ag) return res.status(404).json({ error: 'Agent not found' });

    const sales = await AgentSaleItem.find({ agentId: ag.id }).sort({ soldAt: -1 });
    const payments = await AgentPayment.find({ agentId: ag.id }).sort({ paymentDate: -1 });

    const devicesSold = sales.length;
    const totalSales = sales.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalCost = sales.reduce((sum, item) => sum + item.costPrice, 0);
    const totalReceived = payments.reduce((sum, item) => sum + item.amount, 0);

    const pendingAmount = totalSales - totalReceived;
    const profitGenerated = totalSales - totalCost;

    res.json({
      agent: ag,
      devicesSold,
      totalSales,
      totalReceived,
      pendingAmount,
      profitGenerated,
      soldDevices: sales,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching agent details' });
  }
});

// POST create agent
router.post('/agents', protect, checkPermission('AGENT_CREATE'), async (req, res) => {
  try {
    const { name, phone, shopName } = req.body;
    if (!name || !phone || !shopName) {
      return res.status(400).json({ error: 'Name, phone, and shop name are required' });
    }

    // Parse dynamic selling prices salePrice_company_[companyId]
    const defaultPrices = {};
    Object.keys(req.body).forEach(k => {
      if (k.startsWith('salePrice_company_')) {
        const companyId = k.replace('salePrice_company_', '');
        const val = Number(req.body[k]);
        if (!isNaN(val) && val > 0) {
          defaultPrices[companyId] = val;
        }
      }
    });

    const agent = new Agent({ name, phone, shopName, defaultPrices });
    await agent.save();

    res.status(201).json({ success: true, agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating agent' });
  }
});

// PUT update agent details
router.put('/agents/:id', protect, checkPermission('AGENT_CREATE'), async (req, res) => {
  try {
    const agent = await Agent.findOne({ id: req.params.id });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { name, phone, shopName } = req.body;
    if (name) agent.name = name;
    if (phone) agent.phone = phone;
    if (shopName) agent.shopName = shopName;

    // Parse dynamic selling prices salePrice_company_[companyId]
    const defaultPrices = {};
    Object.keys(req.body).forEach(k => {
      if (k.startsWith('salePrice_company_')) {
        const companyId = k.replace('salePrice_company_', '');
        const val = Number(req.body[k]);
        if (!isNaN(val) && val > 0) {
          defaultPrices[companyId] = val;
        }
      }
    });
    agent.defaultPrices = defaultPrices;

    await agent.save();
    res.json({ success: true, agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating agent' });
  }
});

// POST record sale to agent (supports Installed vs Parceled)
router.post('/agents/sale', protect, checkPermission('AGENT_SALE'), async (req, res) => {
  try {
    const {
      agentId,
      deviceId,
      sellingPrice,
      saleType, // INSTALLED | PARCELED
      customerName,
      customerPhone,
      carNumber,
      chassisNumber,
      soldAt,
      remarks
    } = req.body;

    if (!agentId || !deviceId) {
      return res.status(400).json({ error: 'Agent and device ID are required' });
    }

    const device = await Device.findOne({ id: deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found in inventory' });
    if (device.status !== 'IN_STOCK') {
      return res.status(400).json({ error: `Device status is not IN_STOCK (Current: ${device.status})` });
    }

    const agent = await Agent.findOne({ id: agentId });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    // Price resolution
    let sPrice = Number(sellingPrice);
    if (isNaN(sPrice) || sPrice === 0) {
      const companyId = device.companyId;
      if (agent.defaultPrices && agent.defaultPrices.get(companyId)) {
        sPrice = agent.defaultPrices.get(companyId);
      } else {
        sPrice = 0;
      }
    }

    const isInstalled = saleType === 'INSTALLED';

    // Update Device status
    device.status = 'SOLD_TO_AGENT';
    device.currentOwner = isInstalled ? (customerName || agent.name) : agent.name;
    await device.save();

    // Create sale record
    const saleItem = new AgentSaleItem({
      agentId,
      deviceId,
      costPrice: device.purchasePrice,
      sellingPrice: sPrice,
      saleType: saleType || 'INSTALLED',
      originSaleType: saleType || 'INSTALLED',
      customerName: isInstalled ? (customerName || '') : '',
      customerPhone: isInstalled ? (customerPhone || '') : '',
      carNumber: isInstalled ? (carNumber || '') : '',
      chassisNumber: isInstalled ? (chassisNumber || '') : '',
      companyId: device.companyId || '',
      remarks: remarks || '',
      soldAt: soldAt ? new Date(soldAt) : new Date(),
      createdByUserId: req.user.id
    });
    await saleItem.save();

    res.status(201).json({ success: true, saleItem, device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording agent sale' });
  }
});

// POST bulk CSV sale upload
router.post('/agents/sale/bulk', protect, checkPermission('AGENT_SALE'), async (req, res) => {
  try {
    const { agentId, csvText, saleType } = req.body;
    if (!agentId || !csvText) {
      return res.status(400).json({ error: 'Agent and CSV content are required' });
    }

    const agent = await Agent.findOne({ id: agentId });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain headers and at least one device row' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const deviceIdIdx = headers.findIndex(h => h.includes('imei') || h.includes('deviceid') || h.includes('device id'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('sellingprice'));
    const typeIdx = headers.findIndex(h => h.includes('saletype') || h.includes('mode'));
    const custNameIdx = headers.findIndex(h => h.includes('customername') || h.includes('customer') || h.includes('name'));
    const custPhoneIdx = headers.findIndex(h => h.includes('customerphone') || h.includes('phone'));
    const carIdx = headers.findIndex(h => h.includes('car') || h.includes('carnumber'));
    const chassisIdx = headers.findIndex(h => h.includes('chassis') || h.includes('chassisnumber'));
    const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('soldat'));

    if (deviceIdIdx === -1) {
      return res.status(400).json({ error: 'CSV must contain IMEI/deviceId column' });
    }

    const importedSales = [];
    const deviceIds = [];
    let parceledCount = 0;
    let installedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 1) continue;

      const deviceId = cols[deviceIdIdx];
      if (!deviceId) continue;

      const device = await Device.findOne({ id: deviceId });
      if (!device || device.status !== 'IN_STOCK') continue;

      // Price
      let rawPrice = priceIdx !== -1 ? Number(cols[priceIdx]) : 0;
      let sPrice = rawPrice;
      if (isNaN(sPrice) || sPrice === 0) {
        const companyId = device.companyId;
        if (agent.defaultPrices && agent.defaultPrices.get(companyId)) {
          sPrice = agent.defaultPrices.get(companyId);
        } else {
          sPrice = 0;
        }
      }

      // Mode
      let rowSaleType = saleType;
      if (typeIdx !== -1 && cols[typeIdx]) {
        const val = cols[typeIdx].toUpperCase();
        if (val === 'INSTALLED' || val === 'PARCELED') rowSaleType = val;
      }
      if (!rowSaleType) rowSaleType = 'INSTALLED';

      const isInstalled = rowSaleType === 'INSTALLED';
      if (isInstalled) installedCount++;
      else parceledCount++;

      const customerName = isInstalled && custNameIdx !== -1 ? cols[custNameIdx] : '';
      const customerPhone = isInstalled && custPhoneIdx !== -1 ? cols[custPhoneIdx] : '';
      const carNumber = isInstalled && carIdx !== -1 ? cols[carIdx] : '';
      const chassisNumber = isInstalled && chassisIdx !== -1 ? cols[chassisIdx] : '';
      const soldAt = dateIdx !== -1 && cols[dateIdx] ? new Date(cols[dateIdx]) : new Date();

      // Update Device status
      device.status = 'SOLD_TO_AGENT';
      device.currentOwner = isInstalled ? (customerName || agent.name) : agent.name;
      await device.save();

      const saleItem = new AgentSaleItem({
        agentId,
        deviceId,
        costPrice: device.purchasePrice,
        sellingPrice: sPrice,
        saleType: rowSaleType,
        originSaleType: rowSaleType,
        customerName,
        customerPhone,
        carNumber,
        chassisNumber,
        companyId: device.companyId || '',
        soldAt,
        createdByUserId: req.user.id
      });
      importedSales.push(saleItem);
      deviceIds.push(deviceId);
    }

    if (importedSales.length === 0) {
      return res.status(400).json({ error: 'No sales imported. IMEIs must exist and be IN_STOCK.' });
    }

    const batch = new AgentSaleBatch({
      agentId,
      uploadedByUserId: req.user.id,
      imported: importedSales.length,
      parceled: parceledCount,
      installed: installedCount,
      deviceIds
    });
    await batch.save();

    for (const saleItem of importedSales) {
      saleItem.batchId = batch.id;
      await saleItem.save();
    }

    res.status(201).json({ success: true, batch, count: importedSales.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error bulk uploading partner sales' });
  }
});

// POST revert agent sale batch
router.post('/agents/sale/revert/:batchId', protect, checkPermission('AGENT_SALE'), async (req, res) => {
  try {
    const batch = await AgentSaleBatch.findOne({ id: req.params.batchId });
    if (!batch) return res.status(404).json({ error: 'Sale batch not found' });
    if (batch.status === 'REVERTED') return res.status(400).json({ error: 'Batch already reverted' });

    // Verify no device has been installed/completed
    const activeDevices = await Device.find({ id: { $in: batch.deviceIds } });
    const installedDevices = activeDevices.filter(d => d.status === 'INSTALLED');
    if (installedDevices.length > 0) {
      return res.status(400).json({
        error: `Cannot revert sale: ${installedDevices.length} devices are installed (e.g. IMEI ${installedDevices[0].id})`
      });
    }

    // Return devices to stock
    await Device.updateMany(
      { id: { $in: batch.deviceIds } },
      { status: 'IN_STOCK', currentOwner: 'Company' }
    );

    // Delete sales
    await AgentSaleItem.deleteMany({ batchId: batch.id });

    batch.status = 'REVERTED';
    await batch.save();

    res.json({ success: true, batch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error reverting sale batch' });
  }
});

// GET sale batches list
router.get('/agents/sale/batches', protect, async (req, res) => {
  try {
    const batches = await AgentSaleBatch.find().sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching sale batches' });
  }
});

// POST record agent payment
router.post('/agents/payment', protect, checkPermission('AGENT_PAYMENT'), async (req, res) => {
  try {
    const { agentId, amount, receiptImage, paymentDate, paymentMethod, note } = req.body;
    if (!agentId || !amount) {
      return res.status(400).json({ error: 'Agent and amount are required' });
    }

    const payment = new AgentPayment({
      agentId,
      amount: Number(amount),
      receiptImage: receiptImage || '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'CASH',
      note: note || '',
      createdByUserId: req.user.id
    });
    await payment.save();

    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording payment' });
  }
});

// ==========================================
// DEVICE INVENTORY ROUTES
// ==========================================

// GET all devices (with sorting & filtering context)
router.get('/devices', protect, checkPermission('INVENTORY'), async (req, res) => {
  try {
    const purchaseItems = await PurchaseItem.find();
    const agentSaleItems = await AgentSaleItem.find();
    const installations = await Installation.find();
    const agents = await Agent.find().sort({ name: 1 });
    const companies = await Company.find().sort({ name: 1 });
    const devices = await Device.find();

    const deviceTypes = await DeviceType.find();
    const deletedDeviceRecords = await DeletedDevice.find().sort({ deletedAt: -1 });
    const actorUsers = await User.find({}, 'id name mobile');
    const isAdmin = req.user.role === 'ADMIN';

    res.json({
      devices,
      purchaseItems,
      agentSaleItems,
      installations,
      agents,
      companies,
      deviceTypes,
      deletedDeviceRecords,
      actorUsers,
      isAdmin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching device inventory' });
  }
});

// DELETE soft delete device from inventory
router.delete('/devices/:id', protect, checkPermission('INVENTORY'), async (req, res) => {
  try {
    const device = await Device.findOne({ id: req.params.id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (device.status !== 'IN_STOCK') {
      return res.status(400).json({ error: 'Only in-stock devices can be deleted' });
    }

    const purchaseItem = await PurchaseItem.findOne({ deviceId: device.id });
    if (!purchaseItem) {
      return res.status(400).json({ error: 'Purchase record not found for device' });
    }

    const deletedLog = new DeletedDevice({
      deviceId: device.id,
      serialNumber: device.serialNumber,
      purchasePrice: device.purchasePrice,
      image: device.image || '',
      deviceTypeId: device.deviceTypeId || null,
      status: device.status,
      currentOwner: device.currentOwner,
      companyId: purchaseItem.companyId,
      purchasedAt: purchaseItem.purchasedAt,
      deletedByUserId: req.user.id
    });
    await deletedLog.save();

    await Device.deleteOne({ id: device.id });
    await PurchaseItem.deleteOne({ deviceId: device.id });

    res.json({ success: true, deletedDevice: deletedLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting device' });
  }
});

// POST restore deleted device
router.post('/devices/deleted/restore/:id', protect, checkPermission('INVENTORY'), async (req, res) => {
  try {
    const deleted = await DeletedDevice.findOne({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Deleted device record not found' });

    // Check duplicate IMEI
    const active = await Device.findOne({ id: deleted.deviceId });
    if (active) {
      return res.status(400).json({ error: 'Device with same IMEI already exists in active inventory' });
    }

    const device = new Device({
      id: deleted.deviceId,
      serialNumber: deleted.serialNumber,
      purchasePrice: deleted.purchasePrice,
      image: deleted.image || '',
      status: 'IN_STOCK',
      currentOwner: 'Company',
      deviceTypeId: deleted.deviceTypeId || null,
      companyId: deleted.companyId
    });
    await device.save();

    const purchaseItem = new PurchaseItem({
      companyId: deleted.companyId,
      deviceId: deleted.deviceId,
      purchasePrice: deleted.purchasePrice,
      purchasedAt: deleted.purchasedAt,
      createdByUserId: req.user.id
    });
    await purchaseItem.save();

    await DeletedDevice.deleteOne({ id: deleted.id });

    res.json({ success: true, device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error restoring device' });
  }
});

// GET deleted device logs list
router.get('/devices/deleted', protect, async (req, res) => {
  try {
    const records = await DeletedDevice.find().sort({ deletedAt: -1 });
    res.json({ success: true, deletedDeviceRecords: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching deleted devices list' });
  }
});

// ==========================================
// INSTALLATION ROUTES
// ==========================================

// GET all installations with full references
router.get('/installations', protect, checkPermission('INSTALL'), async (req, res) => {
  try {
    const installations = await Installation.find().sort({ installedAt: -1 });
    const devices = await Device.find();
    const agents = await Agent.find().sort({ name: 1 });
    const agentSaleItems = await AgentSaleItem.find();
    const actorUsers = await User.find({}, 'id name mobile');
    const companies = await Company.find();

    res.json({
      installations,
      devices,
      agents,
      agentSaleItems,
      companies,
      actorUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching installations' });
  }
});

// POST record customer installation
router.post('/installations', protect, checkPermission('INSTALL'), async (req, res) => {
  try {
    const {
      deviceId,
      customerName,
      customerPhone,
      alternatePhone,
      carNumber,
      chassisNumber,
      installedAt,
      remarks
    } = req.body;

    if (!deviceId || !customerName || !customerPhone || !carNumber || !chassisNumber) {
      return res.status(400).json({ error: 'Missing required installation fields' });
    }

    const device = await Device.findOne({ id: deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found in inventory' });
    if (device.status !== 'SOLD_TO_AGENT') {
      return res.status(400).json({ error: 'Device must be sold to an agent before installation' });
    }

    const saleItem = await AgentSaleItem.findOne({ deviceId });
    if (!saleItem) {
      return res.status(400).json({ error: 'No active partner sale record found for this device' });
    }

    // Update Device status
    device.status = 'INSTALLED';
    device.currentOwner = customerName;
    await device.save();

    // If parceled sale, update details
    if (saleItem.saleType === 'PARCELED') {
      saleItem.saleType = 'INSTALLED';
      saleItem.customerName = customerName;
      saleItem.customerPhone = customerPhone;
      saleItem.carNumber = carNumber;
      saleItem.chassisNumber = chassisNumber;
      await saleItem.save();
    }

    const installation = new Installation({
      deviceId,
      agentId: saleItem.agentId,
      userId: req.user.id,
      customerName,
      customerPhone,
      alternatePhone: alternatePhone || '',
      carNumber,
      chassisNumber,
      installedAt: installedAt ? new Date(installedAt) : new Date(),
      remarks: remarks || '',
      companyId: device.companyId || ''
    });
    await installation.save();

    res.status(201).json({ success: true, installation, device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording installation' });
  }
});

// ==========================================
// USER ROUTES (With First-Time Setup checks)
// ==========================================

// GET all users
router.get('/users', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      return res.json({ users: [], isFirstTimeSetup: true });
    }
  } catch (err) {
    console.error(err);
  }
  protect(req, res, () => {
    checkPermission('USERS')(req, res, next);
  });
}, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      permissions: u.permissions,
      disabled: u.disabled
    }));
    res.json({ users: safeUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching users list' });
  }
});

// POST create user / first-time setup
router.post('/users', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Setup Mode: bypass protect/checkPermission
      return next();
    }
  } catch (err) {
    console.error(err);
  }
  protect(req, res, () => {
    checkPermission('USERS')(req, res, next);
  });
}, async (req, res) => {
  try {
    const { name, mobile, password, role, permissions } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: 'Name, mobile, and password are required' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ error: 'Mobile number is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userCount = await User.countDocuments();
    let assignedRole = role || 'USER';
    let assignedPerms = permissions || [];

    // Automatically make the first registered user an Admin with all permissions
    if (userCount === 0) {
      assignedRole = 'ADMIN';
      assignedPerms = [
        'VIEW_DASHBOARD',
        'COMPANY', 'COMPANY_DETAILS', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT',
        'AGENTS', 'AGENT_DETAILS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT',
        'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'
      ];
    }

    const user = new User({
      name,
      mobile,
      password: hashedPassword,
      role: assignedRole,
      permissions: assignedPerms
    });
    await user.save();

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// PUT disable user
router.put('/users/:id/disable', protect, checkPermission('USERS'), async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot disable yourself' });

    user.disabled = req.body.disabled;
    await user.save();

    res.json({ success: true, disabled: user.disabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error disabling user' });
  }
});

// PUT update user permissions
router.put('/users/:id/role', protect, checkPermission('USERS'), async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot edit your own permissions' });

    user.role = req.body.role || user.role;
    user.permissions = req.body.permissions || user.permissions;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating user permissions' });
  }
});

// ==========================================
// REPORTS ROUTES (Enhanced with trend lines and daily snapshots)
// ==========================================

router.get('/reports', protect, checkPermission('REPORTS'), async (req, res) => {
  try {
    const now = new Date();
    const { today, startOfWeek, startOfMonth } = getTimeframes();

    // Helper for period snapshots
    const fetchSnapshotForTimeframe = async (startDate) => {
      // Find purchase items in timeframe
      const purchases = await PurchaseItem.find({
        purchasedAt: { $gte: startDate, $lte: now }
      });
      const totalPurchases = purchases.reduce((sum, item) => sum + item.purchasePrice, 0);

      // Find sales items in timeframe
      const sales = await AgentSaleItem.find({
        soldAt: { $gte: startDate, $lte: now }
      });
      const totalSales = sales.reduce((sum, item) => sum + item.sellingPrice, 0);
      const totalCost = sales.reduce((sum, item) => sum + item.costPrice, 0);

      // profit is Total Sales - Total Cost of sold devices
      const profit = totalSales - totalCost;

      // Completed installations
      const installations = await Installation.find({
        installedAt: { $gte: startDate, $lte: now }
      });

      // Collections
      const compPayments = await CompanyPayment.find({
        paymentDate: { $gte: startDate, $lte: now }
      });
      const companyCollections = compPayments.reduce((sum, item) => sum + item.amount, 0);

      const agPayments = await AgentPayment.find({
        paymentDate: { $gte: startDate, $lte: now }
      });
      const agentCollections = agPayments.reduce((sum, item) => sum + item.amount, 0);

      return {
        purchases: totalPurchases,
        sales: totalSales,
        profit,
        installations: installations.length,
        companyCollections,
        agentCollections
      };
    };

    // Calculate period snapshots
    const statsToday = await fetchSnapshotForTimeframe(today);
    const statsWeek = await fetchSnapshotForTimeframe(startOfWeek);
    const statsMonth = await fetchSnapshotForTimeframe(startOfMonth);

    // Calculate pending totals across lifetime (Company and Partner)
    const allPurchases = await PurchaseItem.find();
    const totalAllPurchases = allPurchases.reduce((sum, item) => sum + item.purchasePrice, 0);
    const allCompanyPayments = await CompanyPayment.find();
    const totalAllCompanyPayments = allCompanyPayments.reduce((sum, item) => sum + item.amount, 0);
    const pendingCompany = totalAllPurchases - totalAllCompanyPayments;

    const allSales = await AgentSaleItem.find();
    const totalAllSales = allSales.reduce((sum, item) => sum + item.sellingPrice, 0);
    const allAgentPayments = await AgentPayment.find();
    const totalAllAgentPayments = allAgentPayments.reduce((sum, item) => sum + item.amount, 0);
    const pendingPartners = totalAllSales - totalAllAgentPayments;

    // Interactive reports logic: range and company filters
    const { range, startDateStr, endDateStr, companyId } = req.query;
    const { startDate, endDate } = getRangeDates(range, startDateStr, endDateStr);

    // Apply filters
    const queryFilter = { soldAt: { $gte: startDate, $lte: endDate } };
    const purchaseFilter = { purchasedAt: { $gte: startDate, $lte: endDate } };
    const compPaymentFilter = { paymentDate: { $gte: startDate, $lte: endDate } };
    const agPaymentFilter = { paymentDate: { $gte: startDate, $lte: endDate } };
    const installFilter = { installedAt: { $gte: startDate, $lte: endDate } };

    if (companyId) {
      queryFilter.companyId = companyId;
      purchaseFilter.companyId = companyId;
      compPaymentFilter.companyId = companyId;
      installFilter.companyId = companyId;
    }

    // Purchases in range
    const rangePurchases = await PurchaseItem.find(purchaseFilter);
    const totalRangePurchases = rangePurchases.reduce((sum, item) => sum + item.purchasePrice, 0);

    // Sales in range
    const rangeSales = await AgentSaleItem.find(queryFilter);
    const totalRangeSales = rangeSales.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalRangeCost = rangeSales.reduce((sum, item) => sum + item.costPrice, 0);
    const rangeProfit = totalRangeSales - totalRangeCost;

    // Collections in range
    const rangeCompPayments = await CompanyPayment.find(compPaymentFilter);
    const totalRangeCompanyCollections = rangeCompPayments.reduce((sum, item) => sum + item.amount, 0);

    const rangeAgPayments = await AgentPayment.find(agPaymentFilter);
    const totalRangeAgentCollections = rangeAgPayments.reduce((sum, item) => sum + item.amount, 0);

    // Installations in range
    const rangeInstallations = await Installation.find(installFilter);

    // Dynamic Daily Trend lines coordinate builder
    const dailyData = [];
    let tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const nextDate = new Date(tempDate);
      nextDate.setDate(nextDate.getDate() + 1);

      // Purchases for day
      const dPFilter = { purchasedAt: { $gte: tempDate, $lt: nextDate } };
      if (companyId) dPFilter.companyId = companyId;
      const dPurchases = await PurchaseItem.find(dPFilter);
      const dPurchTotal = dPurchases.reduce((s, i) => s + i.purchasePrice, 0);

      // Sales for day
      const dSFilter = { soldAt: { $gte: tempDate, $lt: nextDate } };
      if (companyId) dSFilter.companyId = companyId;
      const dSales = await AgentSaleItem.find(dSFilter);
      const dSalesTotal = dSales.reduce((s, i) => s + i.sellingPrice, 0);
      const dCostTotal = dSales.reduce((s, i) => s + i.costPrice, 0);
      const dProfitTotal = dSalesTotal - dCostTotal;

      const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
      const dd = String(tempDate.getDate()).padStart(2, '0');

      dailyData.push({
        date: `${mm}-${dd}`,
        purchases: dPurchTotal,
        sales: dSalesTotal,
        profit: dProfitTotal
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    res.json({
      today: statsToday,
      week: statsWeek,
      month: statsMonth,
      companyCollections: totalRangeCompanyCollections,
      agentCollections: totalRangeAgentCollections,
      pendingPayments: pendingPartners, // outstanding total
      pendingCompany,
      recentInstallations: rangeInstallations.slice(0, 50), // matching installations list
      rangeTotals: {
        purchases: totalRangePurchases,
        sales: totalRangeSales,
        profit: rangeProfit,
        installationsCount: rangeInstallations.length,
        companyCollections: totalRangeCompanyCollections,
        agentCollections: totalRangeAgentCollections,
        pendingCompany,
        pendingPartners
      },
      dailyTrends: dailyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating reports' });
  }
});

module.exports = router;
