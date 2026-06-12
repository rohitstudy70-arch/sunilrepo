const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const {
  User,
  Company,
  Device,
  PurchaseItem,
  CompanyPayment,
  Agent,
  AgentSaleItem,
  AgentPayment,
  Installation
} = require('./models');
const { protect, checkPermission } = require('./middleware/auth');

// Helper to calculate start dates
const getTimeframes = () => {
  const now = new Date();
  
  // Today (Start of today)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // This Week (Monday of this week)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Reset now
  const now2 = new Date();
  // This Month (1st of this month)
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1);
  
  return { today, startOfWeek, startOfMonth };
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

    // Generate JWT token
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

    for (const comp of companies) {
      // Find purchase items for this company
      const purchases = await PurchaseItem.find({ companyId: comp.id });
      const totalPurchaseAmount = purchases.reduce((sum, item) => sum + item.purchasePrice, 0);
      const devicesPurchased = purchases.length;

      // Find total payments paid to company
      const payments = await CompanyPayment.find({ companyId: comp.id });
      const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);

      const remainingDue = totalPurchaseAmount - totalPaid;

      summaries.push({
        company: comp,
        devicesPurchased,
        totalPurchaseAmount,
        totalPaid,
        remainingDue
      });
    }

    res.json({ companies, summaries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching companies' });
  }
});

// GET single company details
router.get('/companies/:id', protect, checkPermission('COMPANY_DETAILS'), async (req, res) => {
  try {
    const comp = await Company.findOne({ id: req.params.id });
    if (!comp) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const purchases = await PurchaseItem.find({ companyId: comp.id }).sort({ purchasedAt: -1 });
    const totalPurchaseAmount = purchases.reduce((sum, item) => sum + item.purchasePrice, 0);
    const devicesPurchased = purchases.length;

    const payments = await CompanyPayment.find({ companyId: comp.id }).sort({ paymentDate: -1 });
    const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);

    const remainingDue = totalPurchaseAmount - totalPaid;

    res.json({
      company: comp,
      devicesPurchased,
      totalPurchaseAmount,
      totalPaid,
      remainingDue,
      purchasedDevices: purchases,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching company details' });
  }
});

// POST create company
router.post('/companies', protect, checkPermission('COMPANY_CREATE'), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'Name, phone, and address are required' });
    }

    const company = new Company({ name, phone, address });
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
    const { companyId, deviceId, serialNumber, purchasePrice, purchasedAt, image } = req.body;
    if (!companyId || !deviceId || !serialNumber || !purchasePrice) {
      return res.status(400).json({ error: 'Company, device ID, serial number, and price are required' });
    }

    // Check if device already exists
    const existing = await Device.findOne({ id: deviceId });
    if (existing) {
      return res.status(400).json({ error: 'Device ID already exists in inventory' });
    }

    // Create Device in inventory
    const device = new Device({
      id: deviceId,
      serialNumber,
      purchasePrice,
      image: image || '',
      status: 'IN_STOCK',
      currentOwner: ''
    });
    await device.save();

    // Create Purchase Item record
    const purchaseItem = new PurchaseItem({
      companyId,
      deviceId,
      purchasePrice,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date()
    });
    await purchaseItem.save();

    res.status(201).json({ success: true, device, purchaseItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding purchase' });
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
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    });
    await payment.save();

    res.status(201).json({ success: true, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding payment' });
  }
});

// ==========================================
// AGENT ROUTES
// ==========================================

// GET all agents with summaries
router.get('/agents', protect, checkPermission('AGENTS'), async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    const summaries = [];

    // Also fetch all devices to use for selection in frontend sale form
    const devices = await Device.find();

    for (const ag of agents) {
      // Find sales for this agent
      const sales = await AgentSaleItem.find({ agentId: ag.id });
      const devicesSold = sales.length;
      const totalSales = sales.reduce((sum, item) => sum + item.sellingPrice, 0);
      const totalCost = sales.reduce((sum, item) => sum + item.costPrice, 0);

      // Find total received payments from this agent
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

    res.json({ agents, summaries, devices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching agents' });
  }
});

// GET single agent details
router.get('/agents/:id', protect, checkPermission('AGENT_DETAILS'), async (req, res) => {
  try {
    const ag = await Agent.findOne({ id: req.params.id });
    if (!ag) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const sales = await AgentSaleItem.find({ agentId: ag.id }).sort({ soldAt: -1 });
    const devicesSold = sales.length;
    const totalSales = sales.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalCost = sales.reduce((sum, item) => sum + item.costPrice, 0);

    const payments = await AgentPayment.find({ agentId: ag.id }).sort({ paymentDate: -1 });
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

    const agent = new Agent({ name, phone, shopName });
    await agent.save();

    res.status(201).json({ success: true, agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating agent' });
  }
});

// POST record sale to agent
router.post('/agents/sale', protect, checkPermission('AGENT_SALE'), async (req, res) => {
  try {
    const { agentId, deviceId, sellingPrice, soldAt } = req.body;
    if (!agentId || !deviceId || !sellingPrice) {
      return res.status(400).json({ error: 'Agent, device ID, and selling price are required' });
    }

    // Get device to verify stock status and extract purchase price (cost price)
    const device = await Device.findOne({ id: deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found in inventory' });
    }

    if (device.status !== 'IN_STOCK') {
      return res.status(400).json({ error: 'Device is not IN_STOCK (Current status: ' + device.status + ')' });
    }

    const agent = await Agent.findOne({ id: agentId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update Device in Inventory
    device.status = 'SOLD_TO_AGENT';
    device.currentOwner = agent.name;
    await device.save();

    // Create AgentSaleItem
    const saleItem = new AgentSaleItem({
      agentId,
      deviceId,
      costPrice: device.purchasePrice,
      sellingPrice: Number(sellingPrice),
      soldAt: soldAt ? new Date(soldAt) : new Date()
    });
    await saleItem.save();

    res.status(201).json({ success: true, saleItem, device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording agent sale' });
  }
});

// POST record agent payment
router.post('/agents/payment', protect, checkPermission('AGENT_PAYMENT'), async (req, res) => {
  try {
    const { agentId, amount, receiptImage, paymentDate } = req.body;
    if (!agentId || !amount) {
      return res.status(400).json({ error: 'Agent and amount are required' });
    }

    const payment = new AgentPayment({
      agentId,
      amount: Number(amount),
      receiptImage: receiptImage || '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
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

// GET all devices (with sorting & filtering)
router.get('/devices', protect, checkPermission('INVENTORY'), async (req, res) => {
  try {
    // Populate data for filtering options
    const purchaseItems = await PurchaseItem.find();
    const agentSaleItems = await AgentSaleItem.find();
    const installations = await Installation.find();
    const agents = await Agent.find();
    const companies = await Company.find();

    const devices = await Device.find();

    res.json({
      devices,
      purchaseItems,
      agentSaleItems,
      installations,
      agents,
      companies
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching device inventory' });
  }
});

// ==========================================
// INSTALLATION ROUTES
// ==========================================

// GET all installations
router.get('/installations', protect, checkPermission('INSTALL'), async (req, res) => {
  try {
    const installations = await Installation.find().sort({ installedAt: -1 });
    const devices = await Device.find();
    const agents = await Agent.find();
    const agentSaleItems = await AgentSaleItem.find();

    res.json({
      installations,
      devices,
      agents,
      agentSaleItems
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
      agentId,
      deviceId,
      customerName,
      customerPhone,
      carNumber,
      chassisNumber,
      installedAt
    } = req.body;

    if (!deviceId || !customerName || !customerPhone || !carNumber || !chassisNumber) {
      return res.status(400).json({ error: 'Missing required installation fields' });
    }

    // Check device state
    const device = await Device.findOne({ id: deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found in inventory' });
    }

    if (device.status !== 'SOLD_TO_AGENT') {
      return res.status(400).json({ error: 'Device must be sold to an agent before installation' });
    }

    // Update Device Inventory
    device.status = 'INSTALLED';
    device.currentOwner = customerName;
    await device.save();

    // Create Installation record
    const installation = new Installation({
      deviceId,
      agentId: agentId || '', // could be direct or via agent
      customerName,
      customerPhone,
      carNumber,
      chassisNumber,
      installedAt: installedAt ? new Date(installedAt) : new Date()
    });
    await installation.save();

    res.status(201).json({ success: true, installation, device });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error recording installation' });
  }
});

// ==========================================
// USER ROUTES
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
    // Remove passwords before sending
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
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// POST create user
router.post('/users', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
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
    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If this is the first user, force role to ADMIN and give all permissions
    const userCount = await User.countDocuments();
    const finalRole = userCount === 0 ? 'ADMIN' : role;
    const finalPermissions = userCount === 0 ? [
      'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS',
      'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS',
      'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'
    ] : permissions;

    const user = new User({
      name,
      mobile,
      password: hashedPassword,
      role: finalRole,
      permissions: finalPermissions || []
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

// PUT update user disabled status
router.put('/users/:id/disable', protect, checkPermission('USERS'), async (req, res) => {
  try {
    const { disabled } = req.body;
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent disabling self
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot disable your own account' });
    }

    user.disabled = disabled;
    await user.save();

    res.json({ success: true, user: { id: user.id, disabled: user.disabled } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating user status' });
  }
});

// PUT update user role & permissions
router.put('/users/:id/role', protect, checkPermission('USERS'), async (req, res) => {
  try {
    const { role, permissions } = req.body;
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    user.permissions = permissions || [];
    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating user permissions' });
  }
});

// ==========================================
// REPORTS ROUTES
// ==========================================

// GET system reports
router.get('/reports', protect, checkPermission('REPORTS'), async (req, res) => {
  try {
    const { today, startOfWeek, startOfMonth } = getTimeframes();
    const now = new Date();

    const fetchStatsForTimeframe = async (startDate) => {
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

      const profit = totalSales - totalCost; // Profit is Sales - Cost of sold devices! Wait, on reports page it displays "Purchases", "Sales", "Profit". In today stats: Purchases=9,016, Sales=11,000, Profit=1,984. 11,000 - 9,016 = 1,984. So profit is Sales - Purchases in that timeframe! Let's follow this: Sales - Purchases. Let's make it Total Sales - Total Purchases in timeframe to match the exact live calculation: 11000 - 9016 = 1984.
      const profitDisplay = totalSales - totalPurchases;

      return {
        purchases: totalPurchases,
        sales: totalSales,
        profit: profitDisplay
      };
    };

    const statsToday = await fetchStatsForTimeframe(today);
    const statsWeek = await fetchStatsForTimeframe(startOfWeek);
    const statsMonth = await fetchStatsForTimeframe(startOfMonth);

    // Collections
    const companyPayments = await CompanyPayment.find({
      paymentDate: { $gte: startOfMonth, $lte: now }
    });
    const companyCollections = companyPayments.reduce((sum, item) => sum + item.amount, 0);

    const agentPayments = await AgentPayment.find({
      paymentDate: { $gte: startOfMonth, $lte: now }
    });
    const agentCollections = agentPayments.reduce((sum, item) => sum + item.amount, 0);

    // Pending Payments (Total system outstanding from agents: Total Sales - Total Collections)
    const allSales = await AgentSaleItem.find();
    const totalAllSales = allSales.reduce((sum, item) => sum + item.sellingPrice, 0);

    const allPayments = await AgentPayment.find();
    const totalAllPayments = allPayments.reduce((sum, item) => sum + item.amount, 0);
    const pendingPayments = totalAllSales - totalAllPayments;

    // Recent Installations
    const recentInstallations = await Installation.find().sort({ installedAt: -1 }).limit(10);

    res.json({
      today: statsToday,
      week: statsWeek,
      month: statsMonth,
      companyCollections,
      agentCollections,
      pendingPayments,
      recentInstallations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating reports' });
  }
});

module.exports = router;
