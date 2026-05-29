const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/device-distribution';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Device.deleteMany({});
    await PurchaseItem.deleteMany({});
    await CompanyPayment.deleteMany({});
    await Agent.deleteMany({});
    await AgentSaleItem.deleteMany({});
    await AgentPayment.deleteMany({});
    await Installation.deleteMany({});

    console.log('Inserting seed data...');

    // 1. Users
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('12345', salt);
    const arshiPassword = await bcrypt.hash('123456', salt);
    
    const users = [
      {
        id: '205c36df-7338-4b4e-b7af-fa73e8618629',
        name: 'Arshi',
        mobile: 'arshi@gps',
        password: arshiPassword,
        role: 'ADMIN',
        permissions: ['COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS', 'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS', 'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'],
        disabled: false
      },
      {
        id: '39989ff0-c1c2-49e6-903f-b400a4940790',
        name: 'ronijaat',
        mobile: '7310986315',
        password: defaultPassword,
        role: 'ADMIN',
        permissions: ['COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS', 'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS', 'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'],
        disabled: false
      },
      {
        id: '105c36df-7338-4b4e-b7af-fa73e8618627',
        name: 'sunil',
        mobile: '9761334377',
        password: defaultPassword,
        role: 'ADMIN',
        permissions: ['COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS', 'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS', 'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'],
        disabled: false
      },
      {
        id: 'efd611e2-73a7-4d66-ad24-8ef1fee3c092',
        name: 'User 7317',
        mobile: '7310986317',
        password: defaultPassword,
        role: 'USER',
        permissions: ['AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS'],
        disabled: false
      },
      {
        id: '55ca63c9-3115-4bff-8ccd-7f1b8d30a3be',
        name: 'suraj',
        mobile: '7217821410',
        password: defaultPassword,
        role: 'USER',
        permissions: ['INVENTORY'],
        disabled: false
      }
    ];
    await User.insertMany(users);
    console.log('Users seeded.');

    // 2. Companies
    const companies = [
      {
        id: 'bfae3ece-8534-4ce3-b12e-e00eae1982f0',
        name: 'Intel',
        phone: '99727272727',
        address: 'delhi'
      },
      {
        id: '61c5b2da-e26a-400b-b85b-c6c75b22246b',
        name: 'ITRIANGLE',
        phone: '7782808063',
        address: 'POORNIA BIHAR'
      },
      {
        id: 'e387f575-8ccd-41b2-a6dd-f018ea4944df',
        name: 'BLACK BOX',
        phone: '9870448815',
        address: 'SHARANPUR'
      },
      {
        id: 'ab83c331-6765-404b-b031-0f8a844976a4',
        name: 'ROSEMATA AUTOTECH PVT LTD',
        phone: '9779599922',
        address: 'DELHI'
      },
      {
        id: '2d0b52a4-201b-463d-957d-a0acca6a1008',
        name: "rohit7250-web4's Org",
        phone: '09304044912',
        address: '01'
      }
    ];
    await Company.insertMany(companies);
    console.log('Companies seeded.');

    // 3. Devices
    const devices = [
      {
        id: '991199119911',
        serialNumber: '882288228822',
        purchasePrice: 2998,
        image: '',
        status: 'INSTALLED',
        currentOwner: 'naveen'
      },
      {
        id: '358250331433192',
        serialNumber: '433192',
        purchasePrice: 6018,
        image: '',
        status: 'SOLD_TO_AGENT',
        currentOwner: 'MADHUR'
      }
    ];
    await Device.insertMany(devices);
    console.log('Devices seeded.');

    // 4. PurchaseItems
    const purchaseItems = [
      {
        id: '000c1f50-4b8f-46a7-96d2-d5caf9d2ea5f',
        companyId: 'bfae3ece-8534-4ce3-b12e-e00eae1982f0',
        deviceId: '991199119911',
        purchasePrice: 2998,
        purchasedAt: new Date('2026-05-29T00:00:00.000Z')
      },
      {
        id: 'c6c106dc-dade-4661-8538-53d1e7095d83',
        companyId: '61c5b2da-e26a-400b-b85b-c6c75b22246b',
        deviceId: '358250331433192',
        purchasePrice: 6018,
        purchasedAt: new Date('2026-05-29T00:00:00.000Z')
      }
    ];
    await PurchaseItem.insertMany(purchaseItems);
    console.log('PurchaseItems seeded.');

    // 5. CompanyPayments
    const companyPayments = [
      {
        id: '8744f4bf-e753-414c-966f-649d0bfefe84',
        companyId: 'bfae3ece-8534-4ce3-b12e-e00eae1982f0',
        amount: 1000,
        receiptImage: '',
        paymentDate: new Date('2026-05-29T00:00:00.000Z')
      }
    ];
    await CompanyPayment.insertMany(companyPayments);
    console.log('CompanyPayments seeded.');

    // 6. Agents
    const agents = [
      {
        id: '56582f1e-1fb4-4246-be46-8cf787d87f28',
        name: 'varun',
        phone: '9876543210',
        shopName: 'noida'
      },
      {
        id: '7267901d-ceb3-4122-83ce-1db3b2e7ee26',
        name: 'MADHUR',
        phone: '7895051411',
        shopName: 'ROHTRA'
      }
    ];
    await Agent.insertMany(agents);
    console.log('Agents seeded.');

    // 7. AgentSaleItems
    const agentSaleItems = [
      {
        id: '9c48ba69-f0e4-46fe-8021-cd9b002a1c14',
        agentId: '56582f1e-1fb4-4246-be46-8cf787d87f28',
        deviceId: '991199119911',
        costPrice: 2998,
        sellingPrice: 4000,
        soldAt: new Date('2026-05-29T00:00:00.000Z')
      },
      {
        id: '035f72bb-5c79-4e93-8a8c-372f765c07c2',
        agentId: '7267901d-ceb3-4122-83ce-1db3b2e7ee26',
        deviceId: '358250331433192',
        costPrice: 6018,
        sellingPrice: 7000,
        soldAt: new Date('2026-05-29T00:00:00.000Z')
      }
    ];
    await AgentSaleItem.insertMany(agentSaleItems);
    console.log('AgentSaleItems seeded.');

    // 8. AgentPayments
    const agentPayments = [
      {
        id: 'cd168b3b-6200-4b4d-942a-6b779aa9998a',
        agentId: '56582f1e-1fb4-4246-be46-8cf787d87f28',
        amount: 1000,
        receiptImage: '',
        paymentDate: new Date('2026-05-29T00:00:00.000Z')
      }
    ];
    await AgentPayment.insertMany(agentPayments);
    console.log('AgentPayments seeded.');

    // 9. Installations
    const installations = [
      {
        id: 'c56f0e7c-433d-4cda-82f7-371204760243',
        deviceId: '991199119911',
        agentId: '56582f1e-1fb4-4246-be46-8cf787d87f28',
        customerName: 'naveen',
        customerPhone: '99876553632',
        carNumber: 'UP15ET7631',
        chassisNumber: '12384838838934',
        installedAt: new Date('2026-05-29T00:00:00.000Z')
      }
    ];
    await Installation.insertMany(installations);
    console.log('Installations seeded.');

    console.log('Seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
