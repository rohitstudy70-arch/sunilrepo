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
  address: { type: String, required: true },
  basePrice: { type: Number, default: 0 } // Base purchase price
}, { timestamps: true });

// Device Type Schema
const DeviceTypeSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  name: { type: String, required: true },
  basePrice: { type: Number, default: 0 } // Base purchase price for this type
}, { timestamps: true });

// Device Schema
const DeviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Manually entered Device ID (IMEI)
  serialNumber: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  image: { type: String, default: '' }, // base64 encoded string
  status: { type: String, enum: ['IN_STOCK', 'SOLD_TO_AGENT', 'INSTALLED'], default: 'IN_STOCK' },
  currentOwner: { type: String, default: 'Company' },
  deviceTypeId: { type: String, default: null },
  companyId: { type: String, default: null } // Stored for easier lookups
}, { timestamps: true });

// PurchaseItem Schema
const PurchaseItemSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  deviceId: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  createdByUserId: { type: String, default: '' }
}, { timestamps: true });

// CompanyPayment Schema
const CompanyPaymentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  amount: { type: Number, required: true },
  receiptImage: { type: String, default: '' }, // base64 encoded string
  paymentDate: { type: Date, default: Date.now },
  createdByUserId: { type: String, default: '' }
}, { timestamps: true });

// Agent Schema
const AgentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  shopName: { type: String, required: true },
  defaultPrices: { type: Map, of: Number, default: {} } // Map of companyId -> default price
}, { timestamps: true });

// AgentSaleItem Schema
const AgentSaleItemSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  agentId: { type: String, required: true },
  deviceId: { type: String, required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  saleType: { type: String, enum: ['INSTALLED', 'PARCELED'], default: 'INSTALLED' },
  originSaleType: { type: String, enum: ['INSTALLED', 'PARCELED'], default: 'INSTALLED' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  carNumber: { type: String, default: '' },
  chassisNumber: { type: String, default: '' },
  companyId: { type: String, default: '' },
  remarks: { type: String, default: '' },
  hasNicPdf: { type: Boolean, default: false },
  hasWahanPdf: { type: Boolean, default: false },
  nicPdfUrl: { type: String, default: '' },
  wahanPdfUrl: { type: String, default: '' },
  soldAt: { type: Date, default: Date.now },
  createdByUserId: { type: String, default: '' },
  batchId: { type: String, default: null } // Links to AgentSaleBatch
}, { timestamps: true });

// AgentPayment Schema
const AgentPaymentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  agentId: { type: String, required: true },
  amount: { type: Number, required: true },
  receiptImage: { type: String, default: '' }, // base64 encoded string
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'CASH' },
  note: { type: String, default: '' },
  createdByUserId: { type: String, default: '' }
}, { timestamps: true });

// Installation Schema
const InstallationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  deviceId: { type: String, required: true },
  agentId: { type: String, required: true },
  userId: { type: String, default: '' }, // User who performed installation
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  alternatePhone: { type: String, default: '' },
  carNumber: { type: String, required: true },
  chassisNumber: { type: String, required: true },
  installedAt: { type: Date, default: Date.now },
  installationType: { type: String, default: 'INSTALL' },
  remarks: { type: String, default: '' },
  companyId: { type: String, default: '' }
}, { timestamps: true });

// AgentSaleBatch Schema (NEW)
const AgentSaleBatchSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  agentId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedByUserId: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'REVERTED'], default: 'ACTIVE' },
  imported: { type: Number, default: 0 },
  parceled: { type: Number, default: 0 },
  installed: { type: Number, default: 0 },
  deviceIds: { type: [String], default: [] }
}, { timestamps: true });

// PurchaseBatch Schema (NEW)
const PurchaseBatchSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  companyId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedByUserId: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'REVERTED'], default: 'ACTIVE' },
  imported: { type: Number, default: 0 },
  deviceIds: { type: [String], default: [] }
}, { timestamps: true });

// DeletedDevice Schema (NEW)
const DeletedDeviceSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  deviceId: { type: String, required: true },
  serialNumber: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  image: { type: String, default: '' },
  deviceTypeId: { type: String, default: null },
  status: { type: String, default: 'IN_STOCK' },
  currentOwner: { type: String, default: 'Company' },
  companyId: { type: String, required: true },
  purchasedAt: { type: Date, required: true },
  deletedAt: { type: Date, default: Date.now },
  deletedByUserId: { type: String, required: true }
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Company: mongoose.model('Company', CompanySchema),
  DeviceType: mongoose.model('DeviceType', DeviceTypeSchema),
  Device: mongoose.model('Device', DeviceSchema),
  PurchaseItem: mongoose.model('PurchaseItem', PurchaseItemSchema),
  CompanyPayment: mongoose.model('CompanyPayment', CompanyPaymentSchema),
  Agent: mongoose.model('Agent', AgentSchema),
  AgentSaleItem: mongoose.model('AgentSaleItem', AgentSaleItemSchema),
  AgentPayment: mongoose.model('AgentPayment', AgentPaymentSchema),
  Installation: mongoose.model('Installation', InstallationSchema),
  AgentSaleBatch: mongoose.model('AgentSaleBatch', AgentSaleBatchSchema),
  PurchaseBatch: mongoose.model('PurchaseBatch', PurchaseBatchSchema),
  DeletedDevice: mongoose.model('DeletedDevice', DeletedDeviceSchema)
};
