const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  permissions: { type: [String], default: [] },
  disabled: { type: Boolean, default: false }
}, { timestamps: true });

// Company Schema
const CompanySchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

// Device Schema
const DeviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Manually entered Device ID
  serialNumber: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  image: { type: String, default: '' }, // base64 encoded string
  status: { type: String, enum: ['IN_STOCK', 'SOLD_TO_AGENT', 'INSTALLED'], default: 'IN_STOCK' },
  currentOwner: { type: String, default: '' } // agent or customer name
}, { timestamps: true });

// PurchaseItem Schema
const PurchaseItemSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  deviceId: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// CompanyPayment Schema
const CompanyPaymentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  amount: { type: Number, required: true },
  receiptImage: { type: String, default: '' }, // base64 encoded string
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Agent Schema
const AgentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  shopName: { type: String, required: true }
}, { timestamps: true });

// AgentSaleItem Schema
const AgentSaleItemSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  agentId: { type: String, required: true },
  deviceId: { type: String, required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  soldAt: { type: Date, default: Date.now }
}, { timestamps: true });

// AgentPayment Schema
const AgentPaymentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  agentId: { type: String, required: true },
  amount: { type: Number, required: true },
  receiptImage: { type: String, default: '' }, // base64 encoded string
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Installation Schema
const InstallationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  deviceId: { type: String, required: true },
  agentId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  carNumber: { type: String, required: true },
  chassisNumber: { type: String, required: true },
  installedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Company: mongoose.model('Company', CompanySchema),
  Device: mongoose.model('Device', DeviceSchema),
  PurchaseItem: mongoose.model('PurchaseItem', PurchaseItemSchema),
  CompanyPayment: mongoose.model('CompanyPayment', CompanyPaymentSchema),
  Agent: mongoose.model('Agent', AgentSchema),
  AgentSaleItem: mongoose.model('AgentSaleItem', AgentSaleItemSchema),
  AgentPayment: mongoose.model('AgentPayment', AgentPaymentSchema),
  Installation: mongoose.model('Installation', InstallationSchema)
};
