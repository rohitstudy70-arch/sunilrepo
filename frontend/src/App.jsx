import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Smartphone, Wrench, ShieldAlert, TrendingUp, LogOut, 
  Sun, Moon, Search, ArrowLeft, Calendar, DollarSign, Plus, Upload, 
  ShieldCheck, Eye, EyeOff, UserCheck, UserX, Trash2, ArrowUpDown,
  Menu, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN');
};

const exportToExcel = (headers, rows, filename) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.map(val => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || "export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [companyDetailId, setCompanyDetailId] = useState(null);
  const [agentDetailId, setAgentDetailId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication State
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Theme Sync
  useEffect(() => {
    const doc = document.documentElement;
    if (darkMode) {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
  }, [darkMode]);

  // Load User Details if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Fetch user failed:', err);
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: loginMobile, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setCurrentPath('/');
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection error. Is backend server running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setCurrentPath('/login');
  };

  // Permission Checker helper
  const hasPerm = (perm) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions && user.permissions.includes(perm);
  };

  // Route Guard routing logic
  useEffect(() => {
    if (!token && currentPath !== '/users') {
      setCurrentPath('/login');
    } else if (token && currentPath === '/login') {
      setCurrentPath('/');
    }
  }, [token, currentPath]);

  // Render Loader
  if (token && !user) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ textAlign: 'center', gap: '16px' }}>
          <h2 className="page-title">Loading...</h2>
          <p className="card-subtitle">Verifying your secure credentials</p>
        </div>
      </div>
    );
  }

  // Auth Layout (Login)
  if (currentPath === '/login') {
    return (
      <div className="login-container">
        {/* Backdrop Glow Blobs */}
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>

        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-logo">
            <Smartphone size={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center' }}>
            <h1 className="page-title text-gradient" style={{ fontSize: '2.1rem' }}>Arshi GPS Hub</h1>
            <p className="card-subtitle" style={{ fontSize: '0.85rem' }}>Device Distribution Management System</p>
          </div>

          {authError && <div className="alert alert-danger">{authError}</div>}

          <div className="form-group">
            <label className="form-label">Username/Mobile</label>
            <input 
              type="text" 
              required 
              placeholder="Enter mobile number or username" 
              className="form-input" 
              value={loginMobile}
              onChange={(e) => setLoginMobile(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              required 
              placeholder="Enter password" 
              className="form-input" 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            {authLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '4px' }}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setCurrentPath('/users'); }} 
              className="table-link"
              style={{ fontWeight: 600 }}
            >
              First-time setup / manage users
            </a>
          </p>
        </form>
      </div>
    );
  }

  if (!token && currentPath === '/users') {
    return (
      <div className="login-container">
        {/* Backdrop Glow Blobs */}
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>

        <div style={{ width: '100%', maxWidth: '440px', zIndex: 10 }}>
          <UsersView hasPerm={() => false} setPath={setCurrentPath} isSetupMode={true} />
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <TrendingUp size={18} />, perm: null },
    { name: 'Companies', path: '/companies', icon: <Building2 size={18} />, perm: 'COMPANY' },
    { name: 'Agents', path: '/agents', icon: <Users size={18} />, perm: 'AGENTS' },
    { name: 'Installations', path: '/installations', icon: <Wrench size={18} />, perm: 'INSTALL' },
    { name: 'Devices', path: '/devices', icon: <Smartphone size={18} />, perm: 'INVENTORY' },
    { name: 'Users', path: '/users', icon: <ShieldAlert size={18} />, perm: 'USERS' },
    { name: 'Reports', path: '/reports', icon: <TrendingUp size={18} />, perm: 'REPORTS' }
  ];

  // Dashboard Layout & Header wrapper
  return (
    <>
      {/* Background Decorative Glows */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <div className="app-layout">
        {/* Responsive Left Sidebar */}
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-brand-icon">
              <Smartphone size={20} />
            </div>
            <span className="sidebar-brand-name">Arshi GPS Hub</span>
          </div>

          <div className="sidebar-menu">
            {navItems.map((item, idx) => {
              if (item.perm && !hasPerm(item.perm)) return null;
              const isActive = currentPath === item.path;
              return (
                <div 
                  key={idx} 
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPath(item.path);
                    setCompanyDetailId(null);
                    setAgentDetailId(null);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Wrapper */}
        <div className="app-main-wrapper">
          <header className="header">
            <div className="header-content">
              <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="header-user-info">
                <p className="user-name">Signed in as <span>{user?.name}</span></p>
                <p className="user-role">{user?.role}</p>
              </div>

              <div className="header-actions">
                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="btn btn-secondary" 
                  style={{ width: '40px', height: '40px', padding: 0 }}
                  title="Toggle Theme"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </header>

          <main className="main-content animate-fade-up">
            {currentPath === '/' && (
              <DashboardView 
                user={user} 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
                setCompanyDetailId={setCompanyDetailId}
                setAgentDetailId={setAgentDetailId}
              />
            )}
            {currentPath === '/companies' && !companyDetailId && (
              <CompaniesView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
                setCompanyDetailId={setCompanyDetailId}
              />
            )}
            {currentPath === '/companies' && companyDetailId && (
              <CompanyDetailView 
                companyId={companyDetailId} 
                setCompanyDetailId={setCompanyDetailId} 
              />
            )}
            {currentPath === '/agents' && !agentDetailId && (
              <AgentsView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
                setAgentDetailId={setAgentDetailId}
              />
            )}
            {currentPath === '/agents' && agentDetailId && (
              <AgentDetailView 
                agentId={agentDetailId} 
                setAgentDetailId={setAgentDetailId} 
              />
            )}
            {currentPath === '/devices' && (
              <DevicesView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
              />
            )}
            {currentPath === '/installations' && (
              <InstallationsView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
              />
            )}
            {currentPath === '/users' && (
              <UsersView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
              />
            )}
            {currentPath === '/reports' && (
              <ReportsView 
                hasPerm={hasPerm} 
                setPath={setCurrentPath} 
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
function DashboardView({ user, hasPerm, setPath, setCompanyDetailId, setAgentDetailId }) {
  // Clear any detail view IDs when going back to dashboard
  useEffect(() => {
    setCompanyDetailId(null);
    setAgentDetailId(null);
  }, []);

  const links = [
    {
      title: 'Company Dashboard',
      desc: 'Add companies, record purchase devices, company payments, and view balances.',
      badge: 'Company',
      path: '/companies',
      perm: 'COMPANY',
      icon: <Building2 size={24} />
    },
    {
      title: 'Agent Ledger',
      desc: 'Track agents, sales, commissions, and performance summaries.',
      badge: 'Agents',
      path: '/agents',
      perm: 'AGENTS',
      icon: <Users size={24} />
    },
    {
      title: 'Installations',
      desc: 'Search and review customer installations with device and agent context.',
      badge: 'Install',
      path: '/installations',
      perm: 'INSTALL',
      icon: <Wrench size={24} />
    },
    {
      title: 'Device Inventory',
      desc: 'Manage stock, inventory movements, and device purchase details.',
      badge: 'Inventory',
      path: '/devices',
      perm: 'INVENTORY',
      icon: <Smartphone size={24} />
    },
    {
      title: 'User Management',
      desc: 'Create users, assign permission sets, and disable blocked accounts.',
      badge: 'Security',
      path: '/users',
      perm: 'USERS',
      icon: <ShieldAlert size={24} />
    },
    {
      title: 'Reports',
      desc: 'View summary reports for sales, purchases, profit, and pending balances.',
      badge: 'Reports',
      path: '/reports',
      perm: 'REPORTS',
      icon: <TrendingUp size={24} />
    }
  ];

  return (
    <div className="card-section" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div className="page-title-group">
          <p className="page-category">Management Hub</p>
          <h1 className="page-title">Quick Links</h1>
          <p className="card-subtitle">Open workflows for company activity, agent operations, device inventory, installations, user management, and reports.</p>
        </div>
      </div>

      <div className="grid-container">
        {links.map((link, idx) => {
          if (!hasPerm(link.perm)) return null;
          return (
            <div key={idx} className="link-card" onClick={() => setPath(link.path)}>
              <div className="link-card-header">
                <div style={{ color: 'var(--text-muted)' }}>
                  {link.icon}
                </div>
                <span className="badge">{link.badge}</span>
              </div>
              <div>
                <h3 className="link-card-title" style={{ marginTop: '20px' }}>{link.title}</h3>
                <p className="link-card-desc">{link.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPANIES VIEW
// ==========================================
function CompaniesView({ hasPerm, setPath, setCompanyDetailId, user }) {
  const [companies, setCompanies] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [actorUsers, setActorUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [activeFormTab, setActiveFormTab] = useState('purchase'); // 'purchase' | 'company' | 'type' | 'payment'
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSensitive, setShowSensitive] = useState(localStorage.getItem('showSensitive') === 'true');

  // Filters State
  const [search, setSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form States
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyBasePrice, setCompanyBasePrice] = useState('0');

  const [purchaseCompId, setPurchaseCompId] = useState('');
  const [purchaseDevId, setPurchaseDevId] = useState('');
  const [purchaseSerial, setPurchaseSerial] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [purchaseType, setPurchaseType] = useState('');
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseImageFile, setPurchaseImageFile] = useState(null);

  // Bulk Purchase CSV
  const [bulkCompId, setBulkCompId] = useState('');
  const [bulkCSVText, setBulkCSVText] = useState('');

  // Device Type State
  const [typeCompId, setTypeCompId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeBasePrice, setTypeBasePrice] = useState('0');

  const [payCompId, setPayCompId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payReceiptFile, setPayReceiptFile] = useState(null);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        setSummaries(data.summaries || []);
        setDeviceTypes(data.deviceTypes || []);
      }

      // Fetch batches
      const batchRes = await fetch(`${API_URL}/companies/purchase/batches`, { headers: getHeaders() });
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        setBatches(batchData.batches || []);
      }

      // Fetch users for uploader mapping
      const usersRes = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setActorUsers(usersData.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 5000);
  };

  const getCompanyName = (id) => {
    const c = companies.find(comp => comp.id === id);
    return c ? c.name : 'Unknown';
  };

  const getUserName = (id) => {
    const u = actorUsers.find(usr => usr.id === id);
    return u ? u.name : 'System';
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name: companyName, 
          phone: companyPhone, 
          address: companyAddress,
          basePrice: Number(companyBasePrice) || 0 
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Company supplier registered successfully!');
        setCompanyName('');
        setCompanyPhone('');
        setCompanyAddress('');
        setCompanyBasePrice('0');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to add company', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    let base64Image = '';
    if (purchaseImageFile) {
      base64Image = await fileToBase64(purchaseImageFile);
    }
    try {
      const res = await fetch(`${API_URL}/companies/purchase`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          companyId: purchaseCompId,
          deviceId: purchaseDevId,
          serialNumber: purchaseSerial,
          purchasePrice: Number(purchasePrice),
          deviceTypeId: purchaseType || undefined,
          purchasedAt: purchasedAt || undefined,
          image: base64Image
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Device purchase recorded in inventory!');
        setPurchaseCompId('');
        setPurchaseDevId('');
        setPurchaseSerial('');
        setPurchasePrice('0');
        setPurchaseType('');
        setPurchasedAt(new Date().toISOString().split('T')[0]);
        setPurchaseImageFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record purchase', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleBulkPurchaseUpload = async (e) => {
    e.preventDefault();
    if (!bulkCompId || !bulkCSVText) {
      triggerAlert('Please select a supplier and enter CSV content', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/companies/purchase/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          companyId: bulkCompId,
          csvText: bulkCSVText
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert(`Bulk import successful: ${data.count} devices added!`);
        setBulkCompId('');
        setBulkCSVText('');
        setShowBulkUpload(false);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to import CSV', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleAddDeviceType = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/companies/types`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          companyId: typeCompId,
          name: typeName,
          basePrice: Number(typeBasePrice) || 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Device type created successfully!');
        setTypeCompId('');
        setTypeName('');
        setTypeBasePrice('0');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to create device type', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    let base64Receipt = '';
    if (payReceiptFile) {
      base64Receipt = await fileToBase64(payReceiptFile);
    }
    try {
      const res = await fetch(`${API_URL}/companies/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          companyId: payCompId,
          amount: Number(payAmount),
          receiptImage: base64Receipt,
          paymentDate: payDate || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Company payment recorded!');
        setPayCompId('');
        setPayAmount('');
        setPayDate(new Date().toISOString().split('T')[0]);
        setPayReceiptFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record payment', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleRevertBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to revert this import batch? All unsold devices in this batch will be permanently removed from inventory.')) return;
    try {
      const res = await fetch(`${API_URL}/companies/purchase/revert/${batchId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Import batch reverted successfully!');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to revert batch', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleToggleSensitive = () => {
    const val = !showSensitive;
    setShowSensitive(val);
    localStorage.setItem('showSensitive', val);
  };

  // Filter balance sheet
  const filteredSummaries = summaries.filter(s => {
    const nameMatch = s.company.name.toLowerCase().includes(search.toLowerCase());
    const dueMatch = !dueOnly || s.totalDue > 0;
    return nameMatch && dueMatch;
  });

  const handleExportBalanceSheet = () => {
    const headers = ['Supplier Name', 'Contact', 'Devices Count', 'Purchase Value', 'Total Paid', 'Outstanding Due'];
    const rows = filteredSummaries.map(s => [
      s.company.name,
      s.company.phone + ' - ' + s.company.address,
      s.devicesCount,
      s.totalPurchaseValue,
      s.totalPaid,
      s.totalDue
    ]);
    exportToExcel(headers, rows, 'Company_Balances.csv');
  };

  // Find types for currently selected purchase company
  const currentCompTypes = deviceTypes.filter(t => t.companyId === purchaseCompId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Company Ledger</p>
          <h1 className="page-title">Companies</h1>
          <p className="card-subtitle">Manage suppliers, record device purchases and payments, and review balances per company.</p>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Dashboard
        </button>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
          {alert.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-label">COMPANIES</span>
          <span className="stat-value">{companies.length}</span>
          <span className="stat-desc">Active suppliers</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">DEVICES PURCHASED</span>
          <span className="stat-value">
            {summaries.reduce((sum, s) => sum + s.devicesCount, 0)}
          </span>
          <span className="stat-desc">Across all companies</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">TOTAL PURCHASE VALUE</span>
          <span className="stat-value">
            {showSensitive ? formatCurrency(summaries.reduce((sum, s) => sum + s.totalPurchaseValue, 0)) : '••••'}
          </span>
          <span className="stat-desc">Inventory cost</span>
        </div>
      </div>

      {/* Tabs Actions UI Panel */}
      <section className="card-section">
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <h2 className="card-title">Actions</h2>
          <p className="card-subtitle">Purchase devices, create companies and types, or record payments — use tabs to switch.</p>
        </div>

        <div style={{ marginTop: '20px' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'purchase' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('purchase'); }}
            >
              Purchase device
            </button>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('company'); }}
            >
              New company
            </button>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'type' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('type'); }}
            >
              Device type
            </button>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('payment'); }}
            >
              Payment
            </button>
          </div>

          {/* Form Tabs panel content */}
          {activeFormTab === 'purchase' && hasPerm('COMPANY_DEVICE_ADD') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Add one device or upload many via CSV.
                </p>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => setShowBulkUpload(!showBulkUpload)}
                >
                  {showBulkUpload ? 'Single purchase' : 'Bulk CSV upload'}
                </button>
              </div>

              {showBulkUpload ? (
                <form onSubmit={handleBulkPurchaseUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Bulk CSV upload</h3>
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <select 
                      required 
                      className="form-select"
                      value={bulkCompId}
                      onChange={e => setBulkCompId(e.target.value)}
                    >
                      <option value="">Select company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CSV Text *</label>
                    <textarea 
                      required
                      placeholder="deviceId,serialNumber,purchasePrice,purchasedAt&#10;358250331000000,ITR12345,6000,2026-06-12"
                      className="form-input"
                      style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      value={bulkCSVText}
                      onChange={e => setBulkCSVText(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Import CSV Devices</button>
                </form>
              ) : (
                <form onSubmit={handleAddPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Device purchase</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <select 
                      required 
                      className="form-select"
                      value={purchaseCompId}
                      onChange={e => { setPurchaseCompId(e.target.value); setPurchaseType(''); }}
                    >
                      <option value="">Select company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">IMEI *</label>
                      <input 
                        required 
                        className="form-input"
                        value={purchaseDevId}
                        onChange={e => setPurchaseDevId(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Serial number *</label>
                      <input 
                        required 
                        className="form-input"
                        value={purchaseSerial}
                        onChange={e => setPurchaseSerial(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                    <div className="form-group">
                      <label className="form-label">Device Type (optional)</label>
                      <select 
                        className="form-select"
                        value={purchaseType}
                        onChange={e => setPurchaseType(e.target.value)}
                      >
                        <option value="">No type</option>
                        {currentCompTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purchase price *</label>
                      <input 
                        type="number"
                        required 
                        className="form-input"
                        value={purchasePrice}
                        onChange={e => setPurchasePrice(e.target.value)}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Use 0 for company or type base price</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase date</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={purchasedAt}
                      onChange={e => setPurchasedAt(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Photo (optional)</label>
                    <div className="file-upload-wrapper">
                      <button type="button" className="file-upload-btn">
                        <Upload size={16} /> {purchaseImageFile ? purchaseImageFile.name : 'Upload device image'}
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="file-upload-input"
                        onChange={e => setPurchaseImageFile(e.target.files[0])}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">Add purchase</button>
                </form>
              )}
            </div>
          )}

          {activeFormTab === 'company' && hasPerm('COMPANY_CREATE') && (
            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>New company supplier</h3>
              <div className="form-group">
                <label className="form-label">Company name *</label>
                <input 
                  required 
                  className="form-input"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input 
                  required 
                  className="form-input"
                  value={companyPhone}
                  onChange={e => setCompanyPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <input 
                  required 
                  className="form-input"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base purchase price</label>
                <input 
                  type="number"
                  className="form-input"
                  value={companyBasePrice}
                  onChange={e => setCompanyBasePrice(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Add company</button>
            </form>
          )}

          {activeFormTab === 'type' && hasPerm('COMPANY_CREATE') && (
            <form onSubmit={handleAddDeviceType} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Device type</h3>
              <div className="form-group">
                <label className="form-label">Company supplier *</label>
                <select 
                  required 
                  className="form-select"
                  value={typeCompId}
                  onChange={e => setTypeCompId(e.target.value)}
                >
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type name *</label>
                <input 
                  required 
                  placeholder="e.g. AIS140, Basic Tracker"
                  className="form-input"
                  value={typeName}
                  onChange={e => setTypeName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base selling price</label>
                <input 
                  type="number"
                  className="form-input"
                  value={typeBasePrice}
                  onChange={e => setTypeBasePrice(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Create Device Type</button>
            </form>
          )}

          {activeFormTab === 'payment' && hasPerm('COMPANY_PAYMENT') && (
            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Company payment</h3>
              <div className="form-group">
                <label className="form-label">Company supplier *</label>
                <select 
                  required 
                  className="form-select"
                  value={payCompId}
                  onChange={e => setPayCompId(e.target.value)}
                >
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment amount *</label>
                <input 
                  type="number"
                  required 
                  className="form-input"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Image</label>
                <div className="file-upload-wrapper">
                  <button type="button" className="file-upload-btn">
                    <Upload size={16} /> {payReceiptFile ? payReceiptFile.name : 'Upload receipt image'}
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-upload-input"
                    onChange={e => setPayReceiptFile(e.target.files[0])}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Record Payment</button>
            </form>
          )}
        </div>
      </section>

      {/* CSV Purchase Upload Batches History */}
      {batches.length > 0 && (
        <section className="card-section">
          <div className="card-title-group">
            <h2 className="card-title">Historic import history</h2>
            <p className="card-subtitle">Each CSV upload is saved as a batch. Revert removes all devices and related records from that import.</p>
          </div>
          <div className="table-wrapper" style={{ marginTop: '20px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Import Date</th>
                  <th>Supplier</th>
                  <th>Uploader</th>
                  <th>Status</th>
                  <th>Imported</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, idx) => (
                  <tr key={idx}>
                    <td>{new Date(b.uploadedAt).toLocaleString('en-IN')}</td>
                    <td>{getCompanyName(b.companyId)}</td>
                    <td>{getUserName(b.uploadedByUserId)}</td>
                    <td>
                      <span className={`badge ${b.status === 'ACTIVE' ? 'badge-active' : 'badge-disabled'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>{b.imported} device(s)</td>
                    <td>
                      {b.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleRevertBatch(b.id)} 
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-danger)' }}
                        >
                          Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Company Balance Sheet */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Company balance sheet</h2>
          <p className="card-subtitle">Filter by search, show cost toggles, and view outstanding dues per supplier.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
            <label className="form-label">Search companies</label>
            <input 
              placeholder="Search supplier name or ID..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '42px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={dueOnly}
                onChange={e => setDueOnly(e.target.checked)}
              />
              Due only
            </label>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleToggleSensitive}
            >
              {showSensitive ? 'Hide Purchase & Costs' : 'Show purchase, cost & profit'}
            </button>
          </div>
          <button onClick={handleExportBalanceSheet} className="btn btn-secondary">
            Export Excel
          </button>
        </div>

        {loading ? (
          <p style={{ marginTop: '20px' }}>Loading balance sheet...</p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: '24px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Devices</th>
                  <th>Purchase</th>
                  <th>Paid</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No supplier records matching filters</td>
                  </tr>
                ) : (
                  filteredSummaries.map((sum, index) => (
                    <tr key={index}>
                      <td>
                        <a 
                          href="#" 
                          style={{ fontWeight: 600, textDecoration: 'underline' }}
                          onClick={(e) => { e.preventDefault(); setCompanyDetailId(sum.company.id); }}
                        >
                          {sum.company.name}
                        </a>
                      </td>
                      <td>
                        <div>{sum.company.phone}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sum.company.address}</div>
                      </td>
                      <td>{sum.devicesCount}</td>
                      <td>{showSensitive ? formatCurrency(sum.totalPurchaseValue) : '••••'}</td>
                      <td>{formatCurrency(sum.totalPaid)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(sum.totalDue)}</td>
                    </tr>
                  ))
                )}
                {/* Totals Row */}
                <tr style={{ fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}>
                  <td>Totals ({filteredSummaries.length})</td>
                  <td></td>
                  <td>{filteredSummaries.reduce((sum, s) => sum + s.devicesCount, 0)}</td>
                  <td>
                    {showSensitive ? formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.totalPurchaseValue, 0)) : '••••'}
                  </td>
                  <td>
                    {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.totalPaid, 0))}
                  </td>
                  <td>
                    {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.totalDue, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 3. COMPANY DETAIL VIEW
// ==========================================
function CompanyDetailView({ companyId, setCompanyDetailId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/companies/${companyId}`, { headers: getHeaders() });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [companyId]);

  if (loading) return <p>Loading details...</p>;
  if (!data) return <p>Error loading company details.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Company Ledger</p>
          <h1 className="page-title">{data.company.name}</h1>
          <p className="card-subtitle">{data.company.phone} · {data.company.address}</p>
        </div>
        <button onClick={() => setCompanyDetailId(null)} className="btn btn-secondary" style={{ gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Summary
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Devices Purchased</span>
          <span className="stat-value">{data.devicesPurchased}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Purchase</span>
          <span className="stat-value">{formatCurrency(data.totalPurchaseAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Paid</span>
          <span className="stat-value">{formatCurrency(data.totalPaid)}</span>
          <p className="card-subtitle" style={{ color: 'var(--danger-text)' }}>Due {formatCurrency(data.remainingDue)}</p>
        </div>
      </div>

      {/* Devices purchased list */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Purchased Devices</h2>
          <p className="card-subtitle">All devices purchased from this company.</p>
        </div>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Price</th>
                <th>Purchased At</th>
              </tr>
            </thead>
            <tbody>
              {data.purchasedDevices.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>No devices purchased</td>
                </tr>
              ) : (
                data.purchasedDevices.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.deviceId}</td>
                    <td>{formatCurrency(item.purchasePrice)}</td>
                    <td>{formatDate(item.purchasedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Payments */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Payments</h2>
          <p className="card-subtitle">Payments sent to this company.</p>
        </div>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No payments recorded</td>
                </tr>
              ) : (
                data.payments.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                    <td>{formatDate(item.paymentDate)}</td>
                    <td>
                      {item.receiptImage ? (
                        <a href={item.receiptImage} target="_blank" rel="noreferrer" className="table-link">
                          View Receipt
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Receipt</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. AGENTS VIEW
// ==========================================
function AgentsView({ hasPerm, setPath, setAgentDetailId, user }) {
  const [agents, setAgents] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [actorUsers, setActorUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [activeFormTab, setActiveFormTab] = useState('sale'); // 'sale' | 'partner' | 'payment'
  const [showSensitive, setShowSensitive] = useState(localStorage.getItem('showSensitive') === 'true');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false);

  // 3-Step Wizard State
  const [saleStep, setSaleStep] = useState(1); // 1: Partner & Mode, 2: Select Devices, 3: Confirm
  const [wizardAgentId, setWizardAgentId] = useState('');
  const [wizardSaleType, setWizardSaleType] = useState('INSTALLED'); // 'INSTALLED' | 'PARCELED'
  const [wizardCustomerName, setWizardCustomerName] = useState('');
  const [wizardCustomerPhone, setWizardCustomerPhone] = useState('');
  const [wizardDeviceSearch, setWizardDeviceSearch] = useState('');
  const [wizardSelectedDeviceIds, setWizardSelectedDeviceIds] = useState([]);
  const [wizardCustomPrices, setWizardCustomPrices] = useState({}); // deviceId -> custom price string
  const [wizardRemarks, setWizardRemarks] = useState('');

  // Register / Edit Partner Form States
  const [editAgentId, setEditAgentId] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerShop, setPartnerShop] = useState('');
  const [partnerPrices, setPartnerPrices] = useState({}); // companyId -> price string

  // Bulk Upload Sales
  const [bulkAgentId, setBulkAgentId] = useState('');
  const [bulkCSVText, setBulkCSVText] = useState('');
  const [bulkSaleType, setBulkSaleType] = useState('INSTALLED');

  // Payment Form States
  const [payAgentId, setPayAgentId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNote, setPayNote] = useState('');
  const [payReceiptFile, setPayReceiptFile] = useState(null);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        setSummaries(data.summaries || []);
        setDevices(data.devices || []);
      }

      // Fetch companies for dynamic price map config
      const compRes = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData.companies || []);
      }

      // Fetch historic import batches
      const batchRes = await fetch(`${API_URL}/agents/sale/batches`, { headers: getHeaders() });
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        setBatches(batchData.batches || []);
      }

      // Fetch users for uploader mapping
      const usersRes = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setActorUsers(usersData.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 5000);
  };

  const getAgentName = (id) => {
    const a = agents.find(ag => ag.id === id);
    return a ? a.name : 'Unknown Partner';
  };

  const getUserName = (id) => {
    const u = actorUsers.find(usr => usr.id === id);
    return u ? u.name : 'System';
  };

  const getCompanyName = (id) => {
    const c = companies.find(comp => comp.id === id);
    return c ? c.name : 'Unknown';
  };

  // Pricing Helpers
  const getDeviceDefaultSellingPrice = (dev) => {
    if (!wizardAgentId) return 0;
    const agent = agents.find(a => a.id === wizardAgentId);
    if (agent && agent.defaultPrices && agent.defaultPrices[dev.companyId]) {
      return agent.defaultPrices[dev.companyId];
    }
    // Fallback to company default price
    const company = companies.find(c => c.id === dev.companyId);
    return company ? company.basePrice : 0;
  };

  // Reset wizard
  const resetWizard = () => {
    setSaleStep(1);
    setWizardAgentId('');
    setWizardSaleType('INSTALLED');
    setWizardCustomerName('');
    setWizardCustomerPhone('');
    setWizardDeviceSearch('');
    setWizardSelectedDeviceIds([]);
    setWizardCustomPrices({});
    setWizardRemarks('');
  };

  // Wizard Step Navigation Validations
  const handleWizardStep1Continue = () => {
    if (!wizardAgentId) {
      triggerAlert('Please select a partner', 'danger');
      return;
    }
    if (wizardSaleType === 'INSTALLED') {
      if (!wizardCustomerName || !wizardCustomerPhone) {
        triggerAlert('Customer name and phone are required for installed tracker sales', 'danger');
        return;
      }
    }
    setSaleStep(2);
  };

  const handleWizardStep2Continue = () => {
    if (wizardSelectedDeviceIds.length === 0) {
      triggerAlert('Please select at least one device from the stock table', 'danger');
      return;
    }
    setSaleStep(3);
  };

  // Submit Sale wizard transaction
  const handleSubmitWizardSale = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      let errorMsg = '';

      for (const devId of wizardSelectedDeviceIds) {
        const device = devices.find(d => d.id === devId);
        const resolvedDefault = getDeviceDefaultSellingPrice(device);
        const customVal = wizardCustomPrices[devId];
        const finalPrice = (customVal !== undefined && customVal !== '') ? Number(customVal) : resolvedDefault;

        const res = await fetch(`${API_URL}/agents/sale`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            agentId: wizardAgentId,
            deviceId: devId,
            sellingPrice: finalPrice,
            saleType: wizardSaleType,
            customerName: wizardCustomerName,
            customerPhone: wizardCustomerPhone,
            remarks: wizardRemarks
          })
        });
        const data = await res.json();
        if (res.ok) {
          successCount++;
        } else {
          errorMsg = data.error || 'Failed to record one of the sales';
        }
      }

      if (successCount === wizardSelectedDeviceIds.length) {
        triggerAlert(`Successfully sold ${successCount} devices to partner!`);
        resetWizard();
        loadData();
      } else {
        triggerAlert(`Sold ${successCount} of ${wizardSelectedDeviceIds.length} devices. Error: ${errorMsg}`, 'danger');
        loadData();
      }
    } catch (err) {
      triggerAlert('Network error recording sale wizard', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Bulk Sale Upload Form Submit
  const handleBulkSaleUpload = async (e) => {
    e.preventDefault();
    if (!bulkAgentId || !bulkCSVText) {
      triggerAlert('Please select a partner and paste CSV contents', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/agents/sale/bulk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          agentId: bulkAgentId,
          csvText: bulkCSVText,
          saleType: bulkSaleType
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert(`Bulk sale import successful: ${data.count} devices sold!`);
        setBulkAgentId('');
        setBulkCSVText('');
        setShowBulkUpload(false);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to import bulk sales', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Create or Edit Partner Form Submit
  const handleCreateOrUpdatePartner = async (e) => {
    e.preventDefault();
    if (!partnerName || !partnerPhone || !partnerShop) {
      triggerAlert('Name, phone, and shop name are required', 'danger');
      return;
    }

    // Prepare body
    const body = {
      name: partnerName,
      phone: partnerPhone,
      shopName: partnerShop
    };
    // Include dynamic prices salePrice_company_[companyId]
    Object.entries(partnerPrices).forEach(([compId, price]) => {
      if (price !== '') {
        body[`salePrice_company_${compId}`] = Number(price);
      }
    });

    try {
      const url = editAgentId ? `${API_URL}/agents/${editAgentId}` : `${API_URL}/agents`;
      const method = editAgentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert(`Partner ${editAgentId ? 'updated' : 'registered'} successfully!`);
        setEditAgentId(null);
        setPartnerName('');
        setPartnerPhone('');
        setPartnerShop('');
        setPartnerPrices({});
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to register partner', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleEditPartnerClick = (agent) => {
    setEditAgentId(agent.id);
    setPartnerName(agent.name);
    setPartnerPhone(agent.phone);
    setPartnerShop(agent.shopName);
    
    // Map default prices
    const prices = {};
    if (agent.defaultPrices) {
      Object.entries(agent.defaultPrices).forEach(([compId, val]) => {
        prices[compId] = val;
      });
    }
    setPartnerPrices(prices);
    setActiveFormTab('partner');
  };

  // Record Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    let base64Receipt = '';
    if (payReceiptFile) {
      base64Receipt = await fileToBase64(payReceiptFile);
    }
    try {
      const res = await fetch(`${API_URL}/agents/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          agentId: payAgentId,
          amount: Number(payAmount),
          paymentDate: payDate || undefined,
          paymentMethod: payMethod,
          note: payNote,
          receiptImage: base64Receipt
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Partner payment collection recorded!');
        setPayAgentId('');
        setPayAmount('');
        setPayDate(new Date().toISOString().split('T')[0]);
        setPayMethod('CASH');
        setPayNote('');
        setPayReceiptFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record payment collection', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Revert historic sale import batch
  const handleRevertBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to revert this sales batch? All devices sold in this batch will be restored back to IN_STOCK in your inventory.')) return;
    try {
      const res = await fetch(`${API_URL}/agents/sale/revert/${batchId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Sales batch reverted successfully, inventory restored!');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to revert batch', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleToggleSensitive = () => {
    const val = !showSensitive;
    setShowSensitive(val);
    localStorage.setItem('showSensitive', val);
  };

  // Filter ledgers
  const filteredSummaries = summaries.filter(s => {
    const nameMatch = s.agent.name.toLowerCase().includes(search.toLowerCase()) || 
                      s.agent.shopName.toLowerCase().includes(search.toLowerCase());
    const dueMatch = !dueOnly || s.pendingAmount > 0;
    return nameMatch && dueMatch;
  });

  // Export ledger summary
  const handleExportLedger = () => {
    const headers = ['Partner Name', 'Shop / Location', 'Contact', 'Devices Sold', 'Total Sales Value', 'Amount Received', 'Outstanding Balance'];
    const rows = filteredSummaries.map(s => [
      s.agent.name,
      s.agent.shopName,
      s.agent.phone,
      s.devicesSold,
      s.totalSales,
      s.totalReceived,
      s.pendingAmount
    ]);
    exportToExcel(headers, rows, 'Partner_Ledger_Summary.csv');
  };

  // Filter in stock devices for wizard step 2
  const inStockDevices = devices.filter(d => {
    if (d.status !== 'IN_STOCK') return false;
    if (wizardDeviceSearch) {
      const s = wizardDeviceSearch.toLowerCase();
      return d.id.toLowerCase().includes(s) || d.serialNumber.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Partners & Distributors</p>
          <h1 className="page-title">Partners</h1>
          <p className="card-subtitle">Manage sub-dealers, record tracker sales and collection payments, and review outstanding ledgers.</p>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Dashboard
        </button>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
          {alert.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-label">PARTNERS</span>
          <span className="stat-value">{agents.length}</span>
          <span className="stat-desc">Registered sub-dealers</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">DEVICES SOLD</span>
          <span className="stat-value">
            {summaries.reduce((sum, s) => sum + s.devicesSold, 0)}
          </span>
          <span className="stat-desc">Across all partners</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">TOTAL SALES VALUE</span>
          <span className="stat-value">
            {formatCurrency(summaries.reduce((sum, s) => sum + s.totalSales, 0))}
          </span>
          <span className="stat-desc">Revenue booked</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">OUTSTANDING BALANCE</span>
          <span className="stat-value" style={{ color: 'var(--danger-text)' }}>
            {formatCurrency(summaries.reduce((sum, s) => sum + s.pendingAmount, 0))}
          </span>
          <span className="stat-desc">Awaiting collection</span>
        </div>
      </div>

      {/* Action Tabs Panel */}
      <section className="card-section">
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <h2 className="card-title">Actions</h2>
          <p className="card-subtitle">Sell devices (3-step wizard), register partners, or collect payments — use tabs to navigate.</p>
        </div>

        <div style={{ marginTop: '20px' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'sale' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('sale'); }}
            >
              Record Sale
            </button>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'partner' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('partner'); setEditAgentId(null); setPartnerName(''); setPartnerPhone(''); setPartnerShop(''); setPartnerPrices({}); }}
            >
              {editAgentId ? 'Edit Partner' : 'Register Partner'}
            </button>
            <button 
              type="button"
              className={`btn ${activeFormTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setActiveFormTab('payment'); }}
            >
              Partner Payment Collection
            </button>
          </div>

          {/* Form Tabs panel content */}
          {activeFormTab === 'sale' && hasPerm('AGENT_SALE') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {showBulkUpload ? 'Bulk CSV Sale' : `Record Sale Wizard — Step ${saleStep} of 3`}
                </h3>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={() => { setShowBulkUpload(!showBulkUpload); resetWizard(); }}
                >
                  {showBulkUpload ? 'Wizard sale flow' : 'Bulk CSV upload'}
                </button>
              </div>

              {showBulkUpload ? (
                <form onSubmit={handleBulkSaleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  <div className="form-group">
                    <label className="form-label">Partner *</label>
                    <select 
                      required 
                      className="form-select"
                      value={bulkAgentId}
                      onChange={e => setBulkAgentId(e.target.value)}
                    >
                      <option value="">Select partner</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.shopName})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Mode *</label>
                    <select 
                      required 
                      className="form-select"
                      value={bulkSaleType}
                      onChange={e => setBulkSaleType(e.target.value)}
                    >
                      <option value="INSTALLED">Installed (Requires customer detail headers in CSV)</option>
                      <option value="PARCELED">Parceled (Direct sub-dealer stock assignment)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">CSV Text *</label>
                    <textarea 
                      required
                      placeholder="deviceId,sellingPrice,customerName,customerPhone&#10;358250331000000,7500,John Doe,9876543210"
                      className="form-input"
                      style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      value={bulkCSVText}
                      onChange={e => setBulkCSVText(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      CSV Headers: imei/deviceId, price/sellingPrice (optional), customerName (optional), customerPhone (optional)
                    </span>
                  </div>
                  <button type="submit" className="btn btn-primary">Bulk import sales</button>
                </form>
              ) : (
                <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                  {/* Wizard Step 1: Partner & Mode */}
                  {saleStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Select Partner *</label>
                        <select 
                          required 
                          className="form-select"
                          value={wizardAgentId}
                          onChange={e => setWizardAgentId(e.target.value)}
                        >
                          <option value="">Select partner</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.shopName})</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sale Mode *</label>
                        <select 
                          required 
                          className="form-select"
                          value={wizardSaleType}
                          onChange={e => setWizardSaleType(e.target.value)}
                        >
                          <option value="INSTALLED">Installed (Complete installation details now)</option>
                          <option value="PARCELED">Parceled (Assign stock only, install later)</option>
                        </select>
                      </div>

                      {wizardSaleType === 'INSTALLED' && (
                        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                          <div className="form-group">
                            <label className="form-label">Customer name *</label>
                            <input 
                              required 
                              className="form-input"
                              placeholder="e.g. Rahul Kumar"
                              value={wizardCustomerName}
                              onChange={e => setWizardCustomerName(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Customer phone *</label>
                            <input 
                              required 
                              className="form-input"
                              placeholder="10 digit mobile"
                              value={wizardCustomerPhone}
                              onChange={e => setWizardCustomerPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button type="button" onClick={handleWizardStep1Continue} className="btn btn-primary">
                          Continue to select devices
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Wizard Step 2: Select Devices & Selling Price */}
                  {saleStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                        <input 
                          placeholder="Search in stock IMEI or Serial..."
                          className="form-input"
                          style={{ flexGrow: 1 }}
                          value={wizardDeviceSearch}
                          onChange={e => setWizardDeviceSearch(e.target.value)}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          Selected: {wizardSelectedDeviceIds.length} device(s)
                        </span>
                      </div>

                      <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}>Select</th>
                              <th>IMEI / Serial</th>
                              <th>Product Supplier</th>
                              {showSensitive && <th>Cost Price</th>}
                              <th>Selling Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inStockDevices.length === 0 ? (
                              <tr>
                                <td colSpan={showSensitive ? 5 : 4} style={{ textAlign: 'center' }}>
                                  No devices in stock match search
                                </td>
                              </tr>
                            ) : (
                              inStockDevices.map(d => {
                                const isSelected = wizardSelectedDeviceIds.includes(d.id);
                                const defaultPrice = getDeviceDefaultSellingPrice(d);
                                return (
                                  <tr key={d.id} className={isSelected ? 'row-selected' : ''}>
                                    <td>
                                      <input 
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            setWizardSelectedDeviceIds([...wizardSelectedDeviceIds, d.id]);
                                          } else {
                                            setWizardSelectedDeviceIds(wizardSelectedDeviceIds.filter(id => id !== d.id));
                                          }
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{d.id}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>S/N: {d.serialNumber}</div>
                                    </td>
                                    <td>
                                      <div>{getCompanyName(d.companyId)}</div>
                                    </td>
                                    {showSensitive && <td>{formatCurrency(d.purchasePrice)}</td>}
                                    <td>
                                      <input 
                                        type="number"
                                        placeholder={defaultPrice || '0'}
                                        className="form-input"
                                        style={{ width: '100px', padding: '4px 8px', fontSize: '0.85rem' }}
                                        value={wizardCustomPrices[d.id] || ''}
                                        onChange={e => setWizardCustomPrices({ ...wizardCustomPrices, [d.id]: e.target.value })}
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                        <button type="button" onClick={() => setSaleStep(1)} className="btn btn-secondary">
                          Back
                        </button>
                        <button type="button" onClick={handleWizardStep2Continue} className="btn btn-primary">
                          Review & confirm sale
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Wizard Step 3: Confirmation Summary */}
                  {saleStep === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="form-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                          Sale Summary Confirmation
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Sub-Dealer Partner:</span>
                            <div style={{ fontWeight: 600 }}>{getAgentName(wizardAgentId)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Sale Type Mode:</span>
                            <div style={{ fontWeight: 600 }}>{wizardSaleType}</div>
                          </div>
                          {wizardSaleType === 'INSTALLED' && (
                            <>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                                <div style={{ fontWeight: 600 }}>{wizardCustomerName}</div>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>Customer Phone:</span>
                                <div style={{ fontWeight: 600 }}>{wizardCustomerPhone}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.9rem' }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Devices sold ({wizardSelectedDeviceIds.length})</h4>
                        <div className="table-wrapper">
                          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>IMEI</th>
                                <th>Serial</th>
                                {showSensitive && <th>Cost Price</th>}
                                <th>Selling Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wizardSelectedDeviceIds.map(devId => {
                                const dev = devices.find(d => d.id === devId);
                                const defaultPrice = getDeviceDefaultSellingPrice(dev);
                                const customVal = wizardCustomPrices[devId];
                                const finalPrice = (customVal !== undefined && customVal !== '') ? Number(customVal) : defaultPrice;
                                return (
                                  <tr key={devId}>
                                    <td style={{ fontWeight: 600 }}>{devId}</td>
                                    <td>{dev ? dev.serialNumber : ''}</td>
                                    {showSensitive && <td>{formatCurrency(dev ? dev.purchasePrice : 0)}</td>}
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(finalPrice)}</td>
                                  </tr>
                                );
                              })}
                              {/* Summary calculations */}
                              <tr style={{ fontWeight: 700, background: 'rgba(255,255,255,0.03)' }}>
                                <td>Totals</td>
                                <td></td>
                                {showSensitive && (
                                  <td>
                                    {formatCurrency(wizardSelectedDeviceIds.reduce((sum, devId) => {
                                      const dev = devices.find(d => d.id === devId);
                                      return sum + (dev ? dev.purchasePrice : 0);
                                    }, 0))}
                                  </td>
                                )}
                                <td>
                                  {formatCurrency(wizardSelectedDeviceIds.reduce((sum, devId) => {
                                    const dev = devices.find(d => d.id === devId);
                                    const defaultPrice = getDeviceDefaultSellingPrice(dev);
                                    const customVal = wizardCustomPrices[devId];
                                    const finalPrice = (customVal !== undefined && customVal !== '') ? Number(customVal) : defaultPrice;
                                    return sum + finalPrice;
                                  }, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Remarks (Optional)</label>
                        <input 
                          className="form-input"
                          placeholder="Add notes for this sale transaction..."
                          value={wizardRemarks}
                          onChange={e => setWizardRemarks(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                        <button type="button" onClick={() => setSaleStep(2)} className="btn btn-secondary">
                          Back to select devices
                        </button>
                        <button type="button" onClick={handleSubmitWizardSale} className="btn btn-primary">
                          Record Sale Transaction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeFormTab === 'partner' && hasPerm('AGENT_CREATE') && (
            <form onSubmit={handleCreateOrUpdatePartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>
                {editAgentId ? 'Edit Partner details' : 'Register new sub-dealer partner'}
              </h3>
              
              <div className="form-group">
                <label className="form-label">Partner name *</label>
                <input 
                  required 
                  className="form-input"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input 
                  required 
                  className="form-input"
                  value={partnerPhone}
                  onChange={e => setPartnerPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shop name / location *</label>
                <input 
                  required 
                  className="form-input"
                  value={partnerShop}
                  onChange={e => setPartnerShop(e.target.value)}
                />
              </div>

              {/* Dynamic Prices Config Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px' }}>
                  Default Pricing Configuration (Optional)
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Define custom partner default selling prices per company supplier. Unset values fall back to company default pricing.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {companies.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No companies suppliers available</p>
                  ) : (
                    companies.map(comp => (
                      <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{comp.name}</span>
                        <input 
                          type="number"
                          placeholder={`Company default: ₹${comp.basePrice}`}
                          className="form-input"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          value={partnerPrices[comp.id] || ''}
                          onChange={e => setPartnerPrices({ ...partnerPrices, [comp.id]: e.target.value })}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                {editAgentId ? 'Save details' : 'Register partner'}
              </button>
            </form>
          )}

          {activeFormTab === 'payment' && hasPerm('AGENT_PAYMENT') && (
            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>Record collection payment</h3>
              
              <div className="form-group">
                <label className="form-label">Partner *</label>
                <select 
                  required 
                  className="form-select"
                  value={payAgentId}
                  onChange={e => setPayAgentId(e.target.value)}
                >
                  <option value="">Select partner</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.shopName})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Payment Amount *</label>
                  <input 
                    type="number"
                    required 
                    className="form-input"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select 
                    required 
                    className="form-select"
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                  >
                    <option value="CASH">CASH</option>
                    <option value="ONLINE">ONLINE (UPI/IMPS)</option>
                    <option value="CHQ">CHEQUE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input 
                  type="date"
                  className="form-input"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Collection Notes</label>
                <input 
                  className="form-input"
                  placeholder="e.g. UPI transaction ID, cheque number..."
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt Photo (optional)</label>
                <div className="file-upload-wrapper">
                  <button type="button" className="file-upload-btn">
                    <Upload size={16} /> {payReceiptFile ? payReceiptFile.name : 'Upload payment screenshot'}
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file-upload-input"
                    onChange={e => setPayReceiptFile(e.target.files[0])}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">Record collection payment</button>
            </form>
          )}
        </div>
      </section>

      {/* CSV Sales Upload Batches History */}
      {batches.length > 0 && (
        <section className="card-section">
          <div className="card-title-group">
            <h2 className="card-title">Historic import history</h2>
            <p className="card-subtitle">Every sales bulk import is saved as a batch. Reverting restores the devices to IN_STOCK.</p>
          </div>
          <div className="table-wrapper" style={{ marginTop: '20px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Import Date</th>
                  <th>Sub-Dealer Partner</th>
                  <th>Uploader</th>
                  <th>Status</th>
                  <th>Imported sales</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b, idx) => (
                  <tr key={idx}>
                    <td>{new Date(b.uploadedAt).toLocaleString('en-IN')}</td>
                    <td>{getAgentName(b.agentId)}</td>
                    <td>{getUserName(b.uploadedByUserId)}</td>
                    <td>
                      <span className={`badge ${b.status === 'ACTIVE' ? 'badge-active' : 'badge-disabled'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.imported} device(s) 
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        ({b.installed} inst / {b.parceled} parc)
                      </span>
                    </td>
                    <td>
                      {b.status === 'ACTIVE' && (
                        <button 
                          onClick={() => handleRevertBatch(b.id)} 
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-danger)' }}
                        >
                          Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Partner Ledger summaries */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Sub-dealer partner ledger summary</h2>
          <p className="card-subtitle">Filter by search name, outstanding balances, and check margins or edit details.</p>
        </div>

        {/* Filters and Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
            <label className="form-label">Search partners</label>
            <input 
              placeholder="Search by partner name or shop..."
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '42px' }}>
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={dueOnly}
                onChange={e => setDueOnly(e.target.checked)}
              />
              Outstanding balance only
            </label>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleToggleSensitive}
            >
              {showSensitive ? 'Hide Purchase & Costs' : 'Show purchase, cost & profit'}
            </button>
          </div>
          <button onClick={handleExportLedger} className="btn btn-secondary">
            Export Excel
          </button>
        </div>

        {loading ? (
          <p style={{ marginTop: '20px' }}>Loading ledgers...</p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: '24px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Partner details</th>
                  <th>Shop / Location</th>
                  <th>Contact</th>
                  <th>Devices sold</th>
                  <th>Sales Value</th>
                  <th>Collected</th>
                  <th>Balance Due</th>
                  {showSensitive && <th>Profit margin</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={showSensitive ? 9 : 8} style={{ textAlign: 'center' }}>
                      No partner summaries matching filters
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((sum, index) => (
                    <tr key={index}>
                      <td>
                        <a 
                          href="#" 
                          style={{ fontWeight: 600, textDecoration: 'underline' }}
                          onClick={(e) => { e.preventDefault(); setAgentDetailId(sum.agent.id); }}
                        >
                          {sum.agent.name}
                        </a>
                      </td>
                      <td>{sum.agent.shopName}</td>
                      <td>{sum.agent.phone}</td>
                      <td>{sum.devicesSold}</td>
                      <td>{formatCurrency(sum.totalSales)}</td>
                      <td>{formatCurrency(sum.totalReceived)}</td>
                      <td style={{ fontWeight: 600, color: sum.pendingAmount > 0 ? 'var(--danger-text)' : 'inherit' }}>
                        {formatCurrency(sum.pendingAmount)}
                      </td>
                      {showSensitive && (
                        <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                          {formatCurrency(sum.profitGenerated)}
                        </td>
                      )}
                      <td>
                        <button 
                          onClick={() => handleEditPartnerClick(sum.agent)} 
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {/* Totals Row */}
                <tr style={{ fontWeight: 700, background: 'rgba(255,255,255,0.05)' }}>
                  <td>Totals ({filteredSummaries.length})</td>
                  <td></td>
                  <td></td>
                  <td>{filteredSummaries.reduce((sum, s) => sum + s.devicesSold, 0)}</td>
                  <td>
                    {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.totalSales, 0))}
                  </td>
                  <td>
                    {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.totalReceived, 0))}
                  </td>
                  <td>
                    {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.pendingAmount, 0))}
                  </td>
                  {showSensitive && (
                    <td>
                      {formatCurrency(filteredSummaries.reduce((sum, s) => sum + s.profitGenerated, 0))}
                    </td>
                  )}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 5. AGENT DETAIL VIEW
// ==========================================
function AgentDetailView({ agentId, setAgentDetailId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/agents/${agentId}`, { headers: getHeaders() });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [agentId]);

  if (loading) return <p>Loading details...</p>;
  if (!data) return <p>Error loading agent details.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Agent Ledger</p>
          <h1 className="page-title">{data.agent.name}</h1>
          <p className="card-subtitle">{data.agent.shopName} · {data.agent.phone}</p>
        </div>
        <button onClick={() => setAgentDetailId(null)} className="btn btn-secondary" style={{ gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Summary
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-label">Devices Sold</span>
          <span className="stat-value">{data.devicesSold}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Sales</span>
          <span className="stat-value">{formatCurrency(data.totalSales)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Received</span>
          <span className="stat-value">{formatCurrency(data.totalReceived)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Amount</span>
          <span className="stat-value">{formatCurrency(data.pendingAmount)}</span>
          <p className="card-subtitle" style={{ color: 'var(--success-text)' }}>Profit {formatCurrency(data.profitGenerated)}</p>
        </div>
      </div>

      {/* Sold devices */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Sold Devices</h2>
          <p className="card-subtitle">Devices sold by this agent.</p>
        </div>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Sold At</th>
              </tr>
            </thead>
            <tbody>
              {data.soldDevices.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No devices sold</td>
                </tr>
              ) : (
                data.soldDevices.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.deviceId}</td>
                    <td>{formatCurrency(item.costPrice)}</td>
                    <td>{formatCurrency(item.sellingPrice)}</td>
                    <td>{formatDate(item.soldAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments collected */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Payments</h2>
          <p className="card-subtitle">Payments collected from this agent.</p>
        </div>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No payments recorded</td>
                </tr>
              ) : (
                data.payments.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.id}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                    <td>{formatDate(item.paymentDate)}</td>
                    <td>
                      {item.receiptImage ? (
                        <a href={item.receiptImage} target="_blank" rel="noreferrer" className="table-link">
                          View Receipt
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Receipt</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. DEVICES VIEW
// ==========================================
function DevicesView({ hasPerm, setPath, user }) {
  const [devices, setDevices] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [agentSaleItems, setAgentSaleItems] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [deletedDevices, setDeletedDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout & Navigation Tabs
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'deleted'
  const [layoutMode, setLayoutMode] = useState('table'); // 'table' | 'cards'
  const [showSensitive, setShowSensitive] = useState(localStorage.getItem('showSensitive') === 'true');

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Complete Install Modal State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installDeviceId, setInstallDeviceId] = useState('');
  const [installCustomerName, setInstallCustomerName] = useState('');
  const [installCustomerPhone, setInstallCustomerPhone] = useState('');
  const [installAlternatePhone, setInstallAlternatePhone] = useState('');
  const [installCarNumber, setInstallCarNumber] = useState('');
  const [installChassisNumber, setInstallChassisNumber] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [installRemarks, setInstallRemarks] = useState('');

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/devices`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        setPurchaseItems(data.purchaseItems || []);
        setAgentSaleItems(data.agentSaleItems || []);
        setInstallations(data.installations || []);
        setAgents(data.agents || []);
        setCompanies(data.companies || []);
      }

      // Fetch soft-deleted logs
      const delRes = await fetch(`${API_URL}/devices/deleted`, { headers: getHeaders() });
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeletedDevices(delData.deletedDevices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 5000);
  };

  const getDeviceCompany = (devId) => {
    const pItem = purchaseItems.find(p => p.deviceId === devId);
    if (!pItem) return '';
    const comp = companies.find(c => c.id === pItem.companyId);
    return comp ? comp.name : '';
  };

  const getDeviceCompanyId = (devId) => {
    const pItem = purchaseItems.find(p => p.deviceId === devId);
    return pItem ? pItem.companyId : '';
  };

  const getDeviceAgent = (devId) => {
    const sItem = agentSaleItems.find(s => s.deviceId === devId);
    if (!sItem) return '';
    const ag = agents.find(a => a.id === sItem.agentId);
    return ag ? ag.name : '';
  };

  const getDeviceAgentId = (devId) => {
    const sItem = agentSaleItems.find(s => s.deviceId === devId);
    return sItem ? sItem.agentId : '';
  };

  const getDeviceSalePrice = (devId) => {
    const sItem = agentSaleItems.find(s => s.deviceId === devId);
    return sItem ? sItem.sellingPrice : 0;
  };

  const getDevicePurchaseDate = (devId) => {
    const pItem = purchaseItems.find(p => p.deviceId === devId);
    return pItem ? new Date(pItem.purchasedAt) : new Date(0);
  };

  const getDeviceInstallDate = (devId) => {
    const inst = installations.find(i => i.deviceId === devId);
    return inst ? new Date(inst.installedAt) : null;
  };

  // Actions
  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device? It will be soft-deleted and archived in the deleted logs.')) return;
    try {
      const res = await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Device soft-deleted and moved to archives.');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to delete device', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleRestoreDevice = async (id) => {
    if (!window.confirm('Restore this device back to your active inventory?')) return;
    try {
      const res = await fetch(`${API_URL}/devices/deleted/restore/${id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Device successfully restored to stock!');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to restore device', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Open Install Wizard for Parceled
  const handleOpenInstallModal = (dev) => {
    setInstallDeviceId(dev.id);
    const saleItem = agentSaleItems.find(s => s.deviceId === dev.id);
    if (saleItem) {
      setInstallCustomerName(saleItem.customerName || '');
      setInstallCustomerPhone(saleItem.customerPhone || '');
    } else {
      setInstallCustomerName('');
      setInstallCustomerPhone('');
    }
    setInstallAlternatePhone('');
    setInstallCarNumber('');
    setInstallChassisNumber('');
    setInstallRemarks('');
    setInstallDate(new Date().toISOString().split('T')[0]);
    setShowInstallModal(true);
  };

  const handleCompleteInstallSubmit = async (e) => {
    e.preventDefault();
    if (!installCustomerName || !installCustomerPhone || !installCarNumber || !installChassisNumber) {
      triggerAlert('Please fill out all required fields to complete installation', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/installations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          deviceId: installDeviceId,
          customerName: installCustomerName,
          customerPhone: installCustomerPhone,
          alternatePhone: installAlternatePhone,
          carNumber: installCarNumber,
          chassisNumber: installChassisNumber,
          installedAt: installDate,
          remarks: installRemarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Installation completed successfully!');
        setShowInstallModal(false);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to complete installation', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleToggleSensitive = () => {
    const val = !showSensitive;
    setShowSensitive(val);
    localStorage.setItem('showSensitive', val);
  };

  // Filtering and Sorting logic
  const filteredDevices = devices.filter(dev => {
    const query = search.toLowerCase();
    const matchSearch = dev.id.includes(query) || dev.serialNumber.toLowerCase().includes(query);

    const matchStatus = statusFilter === 'ALL' || dev.status === statusFilter;

    const compId = getDeviceCompanyId(dev.id);
    const matchCompany = companyFilter === 'ALL' || compId === companyFilter;

    const agId = getDeviceAgentId(dev.id);
    const matchAgent = agentFilter === 'ALL' || agId === agentFilter;

    const pDate = getDevicePurchaseDate(dev.id);
    let matchStart = true;
    if (startDate) {
      matchStart = pDate >= new Date(startDate);
    }
    let matchEnd = true;
    if (endDate) {
      const endLimit = new Date(endDate);
      endLimit.setHours(23, 59, 59, 999);
      matchEnd = pDate <= endLimit;
    }

    return matchSearch && matchStatus && matchCompany && matchAgent && matchStart && matchEnd;
  });

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'id') {
      valA = a.id;
      valB = b.id;
    } else if (sortBy === 'serialNumber') {
      valA = a.serialNumber;
      valB = b.serialNumber;
    } else if (sortBy === 'purchasedAt') {
      valA = getDevicePurchaseDate(a.id);
      valB = getDevicePurchaseDate(b.id);
    } else if (sortBy === 'purchasePrice') {
      valA = a.purchasePrice;
      valB = b.purchasePrice;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRequestSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  // Export CSV devices
  const handleExportCSV = () => {
    const headers = ['IMEI', 'Serial Number', 'Supplier', 'Status', 'Current Owner', 'Purchase Cost', 'Sold price', 'Purchase Date', 'Installed Date'];
    const rows = sortedDevices.map(d => [
      d.id,
      d.serialNumber,
      getDeviceCompany(d.id),
      d.status,
      d.currentOwner,
      d.purchasePrice,
      getDeviceSalePrice(d.id),
      formatDate(getDevicePurchaseDate(d.id)),
      formatDate(getDeviceInstallDate(d.id))
    ]);
    exportToExcel(headers, rows, 'Devices_Inventory.csv');
  };

  // Lifecycle Mix Calculation
  const totalCount = devices.length || 1;
  const stockCount = devices.filter(d => d.status === 'IN_STOCK').length;
  const partnerCount = devices.filter(d => d.status === 'SOLD_TO_AGENT').length;
  const installedCount = devices.filter(d => d.status === 'INSTALLED').length;

  const stockPct = ((stockCount / totalCount) * 100).toFixed(1);
  const partnerPct = ((partnerCount / totalCount) * 100).toFixed(1);
  const installedPct = ((installedCount / totalCount) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Inventory Management</p>
          <h1 className="page-title">Devices Registry</h1>
          <p className="card-subtitle">Complete registry tracking of all tracker devices, purchase records, sold channels, and installations.</p>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Dashboard
        </button>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
          {alert.msg}
        </div>
      )}

      {/* Lifecycle Mix bar */}
      <section className="card-section" style={{ margin: 0 }}>
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 className="card-title">Device Lifecycle Mix</h2>
          <p className="card-subtitle">Real-time status mix of your tracker distribution pipeline.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', height: '20px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ width: `${stockPct}%`, background: 'var(--primary)', transition: 'width 0.4s ease' }} title={`In Stock: ${stockCount}`} />
            <div style={{ width: `${partnerPct}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} title={`Sold/Parceled: ${partnerCount}`} />
            <div style={{ width: `${installedPct}%`, background: '#10b981', transition: 'width 0.4s ease' }} title={`Installed: ${installedCount}`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />
              In Stock: <span style={{ fontWeight: 600 }}>{stockCount}</span> ({stockPct}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              Parceled to Partners: <span style={{ fontWeight: 600 }}>{partnerCount}</span> ({partnerPct}%)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              Installed: <span style={{ fontWeight: 600 }}>{installedCount}</span> ({installedPct}%)
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          className={`btn ${activeTab === 'registry' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('registry')}
        >
          Active inventory registry
        </button>
        <button 
          className={`btn ${activeTab === 'deleted' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('deleted')}
        >
          Deleted logs archive
        </button>
      </div>

      {activeTab === 'registry' && (
        <section className="card-section">
          {/* Controls & Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
                <label className="form-label">Search IMEI / Serial</label>
                <input 
                  placeholder="Enter IMEI or Serial Number..."
                  className="form-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ minWidth: '150px' }}>
                <label className="form-label">Status Filter</label>
                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All status</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="SOLD_TO_AGENT">Parceled</option>
                  <option value="INSTALLED">Installed</option>
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '150px' }}>
                <label className="form-label">Supplier Company</label>
                <select className="form-select" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
                  <option value="ALL">All suppliers</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: '150px' }}>
                <label className="form-label">Partner Assignee</label>
                <select className="form-select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
                  <option value="ALL">All partners</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Purchased From</label>
                  <input type="date" className="form-input" style={{ padding: '6px 12px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Purchased To</label>
                  <input type="date" className="form-input" style={{ padding: '6px 12px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={handleToggleSensitive}>
                  {showSensitive ? 'Hide Purchase & Costs' : 'Show purchase, cost & profit'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setLayoutMode(layoutMode === 'table' ? 'cards' : 'table')}>
                  {layoutMode === 'table' ? 'Cards view' : 'Table view'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p style={{ marginTop: '24px' }}>Loading active devices registry...</p>
          ) : layoutMode === 'table' ? (
            <div className="table-wrapper" style={{ marginTop: '24px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleRequestSort('id')}>
                      IMEI / Device ID {sortBy === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleRequestSort('serialNumber')}>
                      Serial Number {sortBy === 'serialNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Product Supplier</th>
                    <th>Pipeline Status</th>
                    <th>Current Assignee</th>
                    {showSensitive && (
                      <th style={{ cursor: 'pointer' }} onClick={() => handleRequestSort('purchasePrice')}>
                        Purchase Cost {sortBy === 'purchasePrice' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                    )}
                    {showSensitive && <th>Sold Price</th>}
                    <th style={{ cursor: 'pointer' }} onClick={() => handleRequestSort('purchasedAt')}>
                      Purchase Date {sortBy === 'purchasedAt' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Install Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDevices.length === 0 ? (
                    <tr>
                      <td colSpan={showSensitive ? 10 : 8} style={{ textAlign: 'center' }}>
                        No inventory trackers match active filters
                      </td>
                    </tr>
                  ) : (
                    sortedDevices.map((dev) => {
                      const pDate = getDevicePurchaseDate(dev.id);
                      const iDate = getDeviceInstallDate(dev.id);
                      const sItem = agentSaleItems.find(s => s.deviceId === dev.id);
                      return (
                        <tr key={dev.id}>
                          <td style={{ fontWeight: 600 }}>{dev.id}</td>
                          <td>{dev.serialNumber}</td>
                          <td>{getDeviceCompany(dev.id)}</td>
                          <td>
                            <span className={`badge ${
                              dev.status === 'IN_STOCK' ? 'badge-active' :
                              dev.status === 'SOLD_TO_AGENT' ? 'badge-warning' : 'badge-disabled'
                            }`} style={{
                              background: dev.status === 'SOLD_TO_AGENT' ? '#f59e0b' : dev.status === 'INSTALLED' ? '#10b981' : ''
                            }}>
                              {dev.status === 'SOLD_TO_AGENT' ? 'PARCELED' : dev.status}
                            </span>
                          </td>
                          <td>{dev.currentOwner || 'Company'}</td>
                          {showSensitive && <td>{formatCurrency(dev.purchasePrice)}</td>}
                          {showSensitive && <td>{dev.status !== 'IN_STOCK' ? formatCurrency(getDeviceSalePrice(dev.id)) : '—'}</td>}
                          <td>{formatDate(pDate)}</td>
                          <td>{iDate ? formatDate(iDate) : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {dev.status === 'SOLD_TO_AGENT' && sItem && sItem.saleType === 'PARCELED' && hasPerm('INSTALL') && (
                                <button 
                                  onClick={() => handleOpenInstallModal(dev)}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                >
                                  Complete Install
                                </button>
                              )}
                              {hasPerm('COMPANY_DEVICE_DELETE') && (
                                <button 
                                  onClick={() => handleDeleteDevice(dev.id)}
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-danger)' }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Cards View Mode */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
              {sortedDevices.length === 0 ? (
                <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-muted)' }}>
                  No inventory trackers match active filters
                </p>
              ) : (
                sortedDevices.map((dev) => {
                  const pDate = getDevicePurchaseDate(dev.id);
                  const iDate = getDeviceInstallDate(dev.id);
                  const sItem = agentSaleItems.find(s => s.deviceId === dev.id);
                  return (
                    <div key={dev.id} className="form-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IMEI</span>
                          <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{dev.id}</h4>
                        </div>
                        <span className={`badge ${
                          dev.status === 'IN_STOCK' ? 'badge-active' :
                          dev.status === 'SOLD_TO_AGENT' ? 'badge-warning' : 'badge-disabled'
                        }`} style={{
                          background: dev.status === 'SOLD_TO_AGENT' ? '#f59e0b' : dev.status === 'INSTALLED' ? '#10b981' : ''
                        }}>
                          {dev.status === 'SOLD_TO_AGENT' ? 'PARCELED' : dev.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Serial Number:</span>
                          <div>{dev.serialNumber}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Supplier:</span>
                          <div>{getDeviceCompany(dev.id)}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Assignee:</span>
                          <div>{dev.currentOwner || 'Company'}</div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Purchased At:</span>
                          <div>{formatDate(pDate)}</div>
                        </div>
                      </div>

                      {showSensitive && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Purchase Cost:</span>
                            <div style={{ fontWeight: 600 }}>{formatCurrency(dev.purchasePrice)}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Sold price:</span>
                            <div style={{ fontWeight: 600 }}>{dev.status !== 'IN_STOCK' ? formatCurrency(getDeviceSalePrice(dev.id)) : '—'}</div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: 'auto' }}>
                        {dev.status === 'SOLD_TO_AGENT' && sItem && sItem.saleType === 'PARCELED' && hasPerm('INSTALL') && (
                          <button 
                            onClick={() => handleOpenInstallModal(dev)}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          >
                            Complete Install
                          </button>
                        )}
                        {hasPerm('COMPANY_DEVICE_DELETE') && (
                          <button 
                            onClick={() => handleDeleteDevice(dev.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-danger)' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'deleted' && (
        <section className="card-section">
          <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 className="card-title">Historic Soft-Deleted Archive Logs</h2>
            <p className="card-subtitle">List of soft-deleted trackers. Restoring returns them to your active inventory database.</p>
          </div>

          {loading ? (
            <p>Loading deleted logs...</p>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>IMEI</th>
                    <th>Serial Number</th>
                    <th>Supplier</th>
                    {showSensitive && <th>Purchase Price</th>}
                    <th>Deleted Date</th>
                    <th>Deleted By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedDevices.length === 0 ? (
                    <tr>
                      <td colSpan={showSensitive ? 7 : 6} style={{ textAlign: 'center' }}>
                        No deleted devices found in database archive
                      </td>
                    </tr>
                  ) : (
                    deletedDevices.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.deviceId}</td>
                        <td>{d.serialNumber}</td>
                        <td>{getCompanyName(d.companyId)}</td>
                        {showSensitive && <td>{formatCurrency(d.purchasePrice)}</td>}
                        <td>{new Date(d.deletedAt).toLocaleString('en-IN')}</td>
                        <td>{getUserName(d.deletedByUserId)}</td>
                        <td>
                          {hasPerm('COMPANY_DEVICE_ADD') && (
                            <button 
                              onClick={() => handleRestoreDevice(d.id)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Complete Install Modal */}
      {showInstallModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCompleteInstallSubmit} className="form-card" style={{ padding: '30px', maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Complete Vehicle Installation
            </h3>
            
            <div className="form-group">
              <label className="form-label">IMEI / Device ID</label>
              <input className="form-input" disabled value={installDeviceId} />
            </div>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input required className="form-input" value={installCustomerName} onChange={e => setInstallCustomerName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone *</label>
                <input required className="form-input" value={installCustomerPhone} onChange={e => setInstallCustomerPhone(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Car / Vehicle Number *</label>
                <input required placeholder="e.g. DL-1CA-1234" className="form-input" value={installCarNumber} onChange={e => setInstallCarNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Chassis Number *</label>
                <input required placeholder="Last 5 or full chassis" className="form-input" value={installChassisNumber} onChange={e => setInstallChassisNumber(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Alternate Phone</label>
                <input className="form-input" value={installAlternatePhone} onChange={e => setInstallAlternatePhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Installation Date</label>
                <input type="date" className="form-input" value={installDate} onChange={e => setInstallDate(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks / Notes</label>
              <input className="form-input" placeholder="Installer name, location notes..." value={installRemarks} onChange={e => setInstallRemarks(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowInstallModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Complete Install
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. INSTALLATIONS VIEW
// ==========================================
function InstallationsView({ hasPerm, setPath, user }) {
  const [installations, setInstallations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentSaleItems, setAgentSaleItems] = useState([]);
  const [actorUsers, setActorUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ installed: 0, pending: 0, thisMonth: 0 });

  // Wizard States
  const [activeStep, setActiveStep] = useState(1); // 1: Pick Device, 2: Complete details
  const [wizardAgentFilter, setWizardAgentFilter] = useState('');
  const [wizardCompanyFilter, setWizardCompanyFilter] = useState('');
  const [selectedSaleItem, setSelectedSaleItem] = useState(null);
  const [wizardPage, setWizardPage] = useState(1);

  // Wizard Step 2 inputs
  const [carNumber, setCarNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [installedAt, setInstalledAt] = useState(new Date().toISOString().split('T')[0]);
  const [alternatePhone, setAlternatePhone] = useState('');
  const [remarks, setRemarks] = useState('');

  // Registry Filters
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [installedByFilter, setInstalledByFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Registry Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal
  const [selectedDetailInst, setSelectedDetailInst] = useState(null);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/installations`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setInstallations(data.installations || []);
        setDevices(data.devices || []);
        setAgents(data.agents || []);
        setAgentSaleItems(data.agentSaleItems || []);
        setActorUsers(data.actorUsers || []);
        setCompanies(data.companies || []);

        // Compute Stats
        const instCount = data.installations.length;
        
        // Pending: SOLD_TO_AGENT and saleType === 'INSTALLED'
        const pendingCount = data.agentSaleItems.filter(s => {
          const d = data.devices.find(dev => dev.id === s.deviceId);
          return d && d.status === 'SOLD_TO_AGENT' && s.saleType === 'INSTALLED';
        }).length;

        // This Month
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCount = data.installations.filter(inst => new Date(inst.installedAt) >= firstOfMonth).length;

        setStats({ installed: instCount, pending: pendingCount, thisMonth: thisMonthCount });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 5000);
  };

  const getAgentName = (agId) => {
    const ag = agents.find(a => a.id === agId);
    return ag ? ag.name : 'Direct / Unknown';
  };

  const getUserName = (userId) => {
    const u = actorUsers.find(ac => ac.id === userId);
    return u ? u.name : 'Unknown User';
  };

  const getCompanyName = (compId) => {
    const c = companies.find(comp => comp.id === compId);
    return c ? c.name : '';
  };

  // Filter pending sales for Step 1
  const pendingSoldSales = agentSaleItems.filter(s => {
    const dev = devices.find(d => d.id === s.deviceId);
    if (!dev || dev.status !== 'SOLD_TO_AGENT') return false;
    if (s.saleType !== 'INSTALLED') return false; // Parceled are completed in inventory

    if (wizardAgentFilter && s.agentId !== wizardAgentFilter) return false;
    if (wizardCompanyFilter && s.companyId !== wizardCompanyFilter) return false;

    return true;
  });

  // Paginated wizard devices
  const wizardPageSize = 5;
  const totalWizardPages = Math.ceil(pendingSoldSales.length / wizardPageSize) || 1;
  const paginatedWizardSales = pendingSoldSales.slice(
    (wizardPage - 1) * wizardPageSize,
    wizardPage * wizardPageSize
  );

  const handleStep1Continue = () => {
    if (!selectedSaleItem) {
      triggerAlert('Please select a device to install', 'danger');
      return;
    }
    // Get chassis/car pre-fills if already in sale record
    setCarNumber(selectedSaleItem.carNumber || '');
    setChassisNumber(selectedSaleItem.chassisNumber || '');
    setActiveStep(2);
  };

  const handleCompleteInstallation = async (e) => {
    e.preventDefault();
    if (!selectedSaleItem) return;

    try {
      const res = await fetch(`${API_URL}/installations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          deviceId: selectedSaleItem.deviceId,
          customerName: selectedSaleItem.customerName,
          customerPhone: selectedSaleItem.customerPhone,
          alternatePhone,
          carNumber,
          chassisNumber,
          installedAt,
          remarks
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Installation completed successfully!');
        setSelectedSaleItem(null);
        setCarNumber('');
        setChassisNumber('');
        setAlternatePhone('');
        setRemarks('');
        setActiveStep(1);
        setWizardPage(1);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to complete installation', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Registry filter
  const filteredInstallations = installations.filter(inst => {
    const matchesAgent = !agentFilter || inst.agentId === agentFilter;
    const matchesUser = !installedByFilter || inst.userId === installedByFilter;

    let matchesDate = true;
    if (fromDate) {
      const fDate = new Date(fromDate);
      fDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && new Date(inst.installedAt) >= fDate;
    }
    if (toDate) {
      const tDate = new Date(toDate);
      tDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(inst.installedAt) <= tDate;
    }

    const query = search.toLowerCase();
    const dev = devices.find(d => d.id === inst.deviceId) || {};
    const matchesSearch = !search ||
      inst.deviceId.includes(query) ||
      inst.customerName.toLowerCase().includes(query) ||
      inst.customerPhone.includes(query) ||
      inst.carNumber.toLowerCase().includes(query) ||
      inst.chassisNumber.toLowerCase().includes(query) ||
      getAgentName(inst.agentId).toLowerCase().includes(query) ||
      getUserName(inst.userId).toLowerCase().includes(query) ||
      (dev.serialNumber && dev.serialNumber.toLowerCase().includes(query));

    return matchesAgent && matchesUser && matchesDate && matchesSearch;
  });

  // Registry Pagination
  const totalRegistryPages = Math.ceil(filteredInstallations.length / itemsPerPage) || 1;
  const paginatedRegistry = filteredInstallations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportRegistry = () => {
    const headers = ['Device IMEI', 'Serial Number', 'Customer Name', 'Customer Phone', 'Partner', 'Car Number', 'Chassis Number', 'Installed Date', 'Installed By'];
    const rows = filteredInstallations.map(inst => {
      const dev = devices.find(d => d.id === inst.deviceId) || {};
      return [
        inst.deviceId,
        dev.serialNumber || '',
        inst.customerName,
        inst.customerPhone,
        getAgentName(inst.agentId),
        inst.carNumber,
        inst.chassisNumber,
        formatDate(inst.installedAt),
        getUserName(inst.userId)
      ];
    });
    exportToExcel(headers, rows, 'Installation_Registry.csv');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Customer Installations</p>
          <h1 className="page-title">Installations</h1>
          <p className="card-subtitle">Mark devices as installed after partner sale. Parceled devices are completed in Device inventory.</p>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Dashboard
        </button>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
          {alert.msg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-label">INSTALLED</span>
          <span className="stat-value">{stats.installed}</span>
          <span className="stat-desc">Completed installations</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">PENDING</span>
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-desc">Sold to partner, awaiting install</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">THIS MONTH</span>
          <span className="stat-value">{stats.thisMonth}</span>
          <span className="stat-desc">New installations</span>
        </div>
      </div>

      {/* Complete pending installation (Wizard) */}
      {hasPerm('INSTALL') && (
        <div className="card-section">
          <div className="card-title-group">
            <h2 className="card-title">Complete pending installation</h2>
            <p className="card-subtitle">Devices sold to a partner with customer details — two steps to mark installed.</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            {/* Wizard Steps indicator */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ fontWeight: activeStep === 1 ? '700' : '400', color: activeStep === 1 ? 'var(--text)' : 'var(--text-muted)' }}>
                1. PICK DEVICE
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
              <span style={{ fontWeight: activeStep === 2 ? '700' : '400', color: activeStep === 2 ? 'var(--text)' : 'var(--text-muted)' }}>
                2. COMPLETE
              </span>
            </div>

            {activeStep === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <select 
                    className="form-select"
                    value={wizardAgentFilter}
                    onChange={e => { setWizardAgentFilter(e.target.value); setWizardPage(1); setSelectedSaleItem(null); }}
                  >
                    <option value="">Filter by partner (All)</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select 
                    className="form-select"
                    value={wizardCompanyFilter}
                    onChange={e => { setWizardCompanyFilter(e.target.value); setWizardPage(1); setSelectedSaleItem(null); }}
                  >
                    <option value="">Company filter (optional)</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Device IMEI / Serial</th>
                        <th>Customer / Phone</th>
                        <th>Partner</th>
                        <th>Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSoldSales.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center' }}>No pending devices matching filters</td>
                        </tr>
                      ) : (
                        paginatedWizardSales.map((sale, idx) => {
                          const dev = devices.find(d => d.id === sale.deviceId) || {};
                          const isSelected = selectedSaleItem && selectedSaleItem.id === sale.id;
                          return (
                            <tr 
                              key={idx} 
                              onClick={() => setSelectedSaleItem(sale)}
                              style={{ 
                                cursor: 'pointer', 
                                background: isSelected ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent' 
                              }}
                            >
                              <td>
                                <div style={{ fontWeight: 600 }}>{sale.deviceId}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.serialNumber}</div>
                              </td>
                              <td>
                                <div>{sale.customerName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customerPhone}</div>
                              </td>
                              <td>{getAgentName(sale.agentId)}</td>
                              <td>
                                <input 
                                  type="radio" 
                                  checked={isSelected}
                                  onChange={() => setSelectedSaleItem(sale)}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Showing {pendingSoldSales.length === 0 ? 0 : (wizardPage - 1) * wizardPageSize + 1}–
                    {Math.min(wizardPage * wizardPageSize, pendingSoldSales.length)} of {pendingSoldSales.length} devices
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={wizardPage === 1}
                      onClick={() => setWizardPage(wizardPage - 1)}
                    >
                      Prev
                    </button>
                    <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>Page {wizardPage} / {totalWizardPages}</span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={wizardPage === totalWizardPages}
                      onClick={() => setWizardPage(wizardPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleStep1Continue} 
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end', marginTop: '16px' }}
                >
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleCompleteInstallation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 600 }}>Selected Device Details</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>IMEI: {selectedSaleItem.deviceId}</p>
                  <p style={{ fontSize: '0.85rem' }}>Customer: {selectedSaleItem.customerName} ({selectedSaleItem.customerPhone})</p>
                  <p style={{ fontSize: '0.85rem' }}>Partner: {getAgentName(selectedSaleItem.agentId)}</p>
                </div>

                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Car number *</label>
                    <input 
                      required 
                      className="form-input"
                      value={carNumber}
                      onChange={e => setCarNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chassis number *</label>
                    <input 
                      required 
                      className="form-input"
                      value={chassisNumber}
                      onChange={e => setChassisNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Installation Date</label>
                    <input 
                      type="date"
                      className="form-input"
                      value={installedAt}
                      onChange={e => setInstalledAt(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input 
                      className="form-input"
                      value={alternatePhone}
                      onChange={e => setAlternatePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input 
                    className="form-input"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'between', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveStep(1)}
                  >
                    Back to Pick Device
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Complete Installation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Registry */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Installation registry</h2>
          <p className="card-subtitle">Filter by date range, partner, installed-by user, search, and export to Excel.</p>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
            <label className="form-label">Search installations</label>
            <input 
              placeholder="Search IMEI, customer, car, partner, installer..."
              className="form-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Partner</label>
            <select 
              className="form-select"
              value={agentFilter}
              onChange={e => { setAgentFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All partners</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Installed by</label>
            <select 
              className="form-select"
              value={installedByFilter}
              onChange={e => { setInstalledByFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All users</option>
              {actorUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.mobile})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label className="form-label">From date</label>
            <input 
              type="date"
              className="form-input"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label className="form-label">To date</label>
            <input 
              type="date"
              className="form-input"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button onClick={handleExportRegistry} className="btn btn-secondary">
            Export Excel
          </button>
        </div>

        {loading ? (
          <p style={{ marginTop: '20px' }}>Loading installations registry...</p>
        ) : (
          <div style={{ marginTop: '24px' }}>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Customer</th>
                    <th>Partner</th>
                    <th>Car</th>
                    <th>Installed</th>
                    <th>Installed by</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallations.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>No installations found matching filters</td>
                    </tr>
                  ) : (
                    paginatedRegistry.map((inst, index) => {
                      const dev = devices.find(d => d.id === inst.deviceId) || {};
                      return (
                        <tr key={index}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{inst.deviceId}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dev.serialNumber}</div>
                          </td>
                          <td>
                            <div>{inst.customerName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inst.customerPhone}</div>
                          </td>
                          <td>{getAgentName(inst.agentId)}</td>
                          <td>{inst.carNumber}</td>
                          <td>{formatDate(inst.installedAt)}</td>
                          <td>{getUserName(inst.userId)}</td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedDetailInst(inst)}
                            >
                              More
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination registry */}
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Showing {filteredInstallations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filteredInstallations.length)} of {filteredInstallations.length} installations
                </span>
                <select 
                  className="form-select" 
                  style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                  value={itemsPerPage}
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Prev
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>Page {currentPage} / {totalRegistryPages}</span>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === totalRegistryPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* More Details Modal */}
      {selectedDetailInst && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card-section" style={{ maxWidth: '500px', width: '90%', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 className="card-title">Installation Details</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', fontSize: '0.9rem' }}>
              <p><strong>Device IMEI:</strong> {selectedDetailInst.deviceId}</p>
              <p><strong>Customer Name:</strong> {selectedDetailInst.customerName}</p>
              <p><strong>Customer Phone:</strong> {selectedDetailInst.customerPhone}</p>
              {selectedDetailInst.alternatePhone && <p><strong>Alternate Phone:</strong> {selectedDetailInst.alternatePhone}</p>}
              <p><strong>Car Number:</strong> {selectedDetailInst.carNumber}</p>
              <p><strong>Chassis Number:</strong> {selectedDetailInst.chassisNumber}</p>
              <p><strong>Company:</strong> {getCompanyName(selectedDetailInst.companyId)}</p>
              <p><strong>Installed Date:</strong> {new Date(selectedDetailInst.installedAt).toLocaleString('en-IN')}</p>
              <p><strong>Installed By:</strong> {getUserName(selectedDetailInst.userId)}</p>
              {selectedDetailInst.remarks && <p><strong>Remarks:</strong> {selectedDetailInst.remarks}</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setSelectedDetailInst(null)} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. SECURITY / USER ACCESS CONTROL
// ==========================================
function UsersView({ hasPerm, setPath, isSetupMode = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstTimeSetupAllowed, setFirstTimeSetupAllowed] = useState(null);

  // Create User Form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Inline edit state
  const [editUserId, setEditUserId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editPerms, setEditPerms] = useState([]);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const availablePermissions = [
    'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS',
    'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS',
    'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.isFirstTimeSetup) {
          setFirstTimeSetupAllowed(true);
        } else {
          setFirstTimeSetupAllowed(false);
        }
      } else if (res.status === 401 || res.status === 403) {
        setFirstTimeSetupAllowed(false);
      }
    } catch (err) {
      console.error(err);
      setFirstTimeSetupAllowed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (msg, type = 'success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 5000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          mobile,
          password,
          role,
          permissions: selectedPermissions
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('New user security profile created!');
        setName('');
        setMobile('');
        setPassword('');
        setRole('USER');
        setSelectedPermissions([]);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to create user', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleToggleDisabled = async (userId, currentDisabled) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/disable`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ disabled: !currentDisabled })
      });
      if (res.ok) {
        triggerAlert('User security profile status toggled!');
        loadData();
      } else {
        const data = await res.json();
        triggerAlert(data.error || 'Operation failed', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleSaveRole = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: editRole, permissions: editPerms })
      });
      if (res.ok) {
        triggerAlert('Permissions updated successfully!');
        setEditUserId(null);
        loadData();
      } else {
        const data = await res.json();
        triggerAlert(data.error || 'Failed to save permissions', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const togglePermissionCheckbox = (perm, list, setter) => {
    if (list.includes(perm)) {
      setter(list.filter(p => p !== perm));
    } else {
      setter([...list, perm]);
    }
  };

  if (isSetupMode && loading) {
    return (
      <div className="form-card animate-fade-up" style={{ textAlign: 'center', padding: '40px' }}>
        <p className="card-subtitle">Checking system configuration status...</p>
      </div>
    );
  }

  if (isSetupMode && firstTimeSetupAllowed === false) {
    return (
      <div className="form-card animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
        <div>
          <h2 className="form-card-title" style={{ border: 'none', padding: 0, fontSize: '1.5rem', justifyContent: 'center', display: 'flex', color: 'var(--danger-text)' }}>Setup Locked</h2>
          <p className="card-subtitle" style={{ marginTop: '10px' }}>An administrator account has already been registered on this system. First-time setup is disabled.</p>
        </div>
        <button type="button" onClick={() => setPath('/login')} className="btn btn-primary" style={{ width: '100%' }}>
          Go to Login
        </button>
      </div>
    );
  }

  if (isSetupMode) {
    return (
      <form className="form-card animate-fade-up" onSubmit={handleCreateUser}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center', marginBottom: '10px' }}>
          <h2 className="form-card-title" style={{ border: 'none', padding: 0, fontSize: '1.75rem', justifyContent: 'center', display: 'flex' }}>First-Time Setup</h2>
          <p className="card-subtitle">Create the primary administrator account to get started.</p>
        </div>

        {alert.show && (
          <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
            {alert.msg}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            required 
            placeholder="Enter full name" 
            className="form-input" 
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile/Username</label>
          <input 
            type="text" 
            required 
            placeholder="Enter mobile number" 
            className="form-input" 
            value={mobile}
            onChange={e => setMobile(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            required 
            placeholder="Enter secure password" 
            className="form-input" 
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
          Register Administrator
        </button>

        <button type="button" onClick={() => setPath('/login')} className="btn btn-secondary" style={{ width: '100%' }}>
          Back to Login
        </button>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">User Access Control</p>
          <h1 className="page-title">User Management</h1>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {alert.show && (
        <div className={`alert alert-${alert.type === 'danger' ? 'danger' : 'success'}`}>
          {alert.msg}
        </div>
      )}

      {/* Form: Create user */}
      {hasPerm('USERS') && (
        <section className="card-section" style={{ margin: 0 }}>
          <div className="card-title-group">
            <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Create New User</h2>
            <p className="card-subtitle">Add users with mobile number, password, role, and permission controls.</p>
          </div>
          <form className="mt-6" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }} onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Username/Mobile</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={mobile}
                onChange={e => setMobile(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                required 
                className="form-input" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select 
                className="form-select"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Permissions</label>
              <div className="permissions-checkbox-group" style={{ marginTop: '8px' }}>
                {availablePermissions.map(perm => (
                  <label key={perm} className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selectedPermissions.includes(perm)}
                      onChange={() => togglePermissionCheckbox(perm, selectedPermissions, setSelectedPermissions)}
                    />
                    {perm.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
              Create User
            </button>
          </form>
        </section>
      )}

      {/* Users table */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Active Security Profiles</h2>
        </div>

        {loading ? (
          <p>Loading security list...</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name || '-'}</td>
                    <td>{u.mobile}</td>
                    <td>{u.role}</td>
                    <td>
                      {u.role === 'ADMIN' ? (
                        <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>All access</span>
                      ) : (
                        u.permissions.join(', ') || 'No permissions'
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${!u.disabled ? 'installed' : ''}`} style={{ border: 'none' }}>
                        {u.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="user-action-cell">
                        <button 
                          className={`btn ${u.disabled ? 'btn-primary' : 'btn-secondary'}`} 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                          onClick={() => handleToggleDisabled(u.id, u.disabled)}
                        >
                          {u.disabled ? 'Enable' : 'Disable'}
                        </button>

                        {/* Expand permission editor */}
                        {editUserId === u.id ? (
                          <div className="form-card" style={{ padding: '16px', gap: '12px', marginTop: '8px' }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Role</label>
                              <select 
                                className="form-select" 
                                style={{ padding: '6px 10px' }}
                                value={editRole}
                                onChange={e => setEditRole(e.target.value)}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Edit Permissions</label>
                              <div className="permissions-checkbox-group" style={{ gridTemplateColumns: '1fr', padding: '10px' }}>
                                {availablePermissions.map(perm => (
                                  <label key={perm} className="checkbox-label" style={{ fontSize: '0.7rem' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={editPerms.includes(perm)}
                                      onChange={() => togglePermissionCheckbox(perm, editPerms, setEditPerms)}
                                    />
                                    {perm}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                onClick={() => handleSaveRole(u.id)}
                              >
                                Save Role
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                onClick={() => setEditUserId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', alignSelf: 'flex-start' }}
                            onClick={() => {
                              setEditUserId(u.id);
                              setEditRole(u.role);
                              setEditPerms(u.permissions);
                            }}
                          >
                            Edit Permissions
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 9. REPORTS & PROFIT CARD VIEW
// ==========================================
function ReportsView({ hasPerm, setPath, user }) {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [range, setRange] = useState('month'); // 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom'
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [companyId, setCompanyId] = useState('ALL');

  // Installations Registry filter inside Reports
  const [installSearch, setInstallSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch companies for select filter
      const compRes = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData.companies || []);
      }

      // Build reports URL with query filters
      const queryParams = new URLSearchParams();
      queryParams.append('range', range);
      if (range === 'custom') {
        if (startDateStr) queryParams.append('startDateStr', startDateStr);
        if (endDateStr) queryParams.append('endDateStr', endDateStr);
      }
      if (companyId && companyId !== 'ALL') {
        queryParams.append('companyId', companyId);
      }

      const res = await fetch(`${API_URL}/reports?${queryParams.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range, startDateStr, endDateStr, companyId]);

  if (loading && !data) return <p style={{ padding: '24px' }}>Loading reports...</p>;
  if (!data) return <p style={{ padding: '24px' }}>Error loading reports dashboard.</p>;

  // Helper for trend chart max limit resolution
  const trends = data.dailyTrends || [];
  const maxVal = Math.max(...trends.map(t => Math.max(t.sales, t.purchases)), 1000);

  // Local filter for installations list inside timeframe
  const filteredInsts = (data.recentInstallations || []).filter(inst => {
    if (!installSearch) return true;
    const s = installSearch.toLowerCase();
    return inst.deviceId.toLowerCase().includes(s) || 
           inst.customerName.toLowerCase().includes(s) || 
           (inst.carNumber && inst.carNumber.toLowerCase().includes(s));
  });

  const handleExportInstallations = () => {
    const headers = ['Device ID', 'Customer Name', 'Contact Phone', 'Car Number', 'Chassis Number', 'Installed Date', 'Remarks'];
    const rows = filteredInsts.map(inst => [
      inst.deviceId,
      inst.customerName,
      inst.customerPhone,
      inst.carNumber,
      inst.chassisNumber,
      formatDate(inst.installedAt),
      inst.remarks
    ]);
    exportToExcel(headers, rows, 'Range_Installations_Report.csv');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Reports</p>
          <h1 className="page-title">Business Snapshots</h1>
          <p className="card-subtitle">Period snapshots for today, this week, and this month — plus interactive range filters, daily trend charts, and installation listings.</p>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Dashboard
        </button>
      </div>

      {/* Snapshots Grid */}
      <section className="card-section" style={{ margin: 0 }}>
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 className="card-title">Timeframe Summaries</h2>
          <p className="card-subtitle">Lifetime snapshots for today, this week, and this month.</p>
        </div>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Card Today */}
          <div className="form-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="page-category" style={{ margin: 0 }}>Today</p>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>{new Date().toLocaleDateString('en-IN')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.today.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.today.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.25rem', color: data.today.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.today.profit)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {data.today.installations} installation(s) completed
              </div>
            </div>
          </div>

          {/* Card This Week */}
          <div className="form-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="page-category" style={{ margin: 0 }}>This Week</p>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Monday — Today</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.week.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.week.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.25rem', color: data.week.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.week.profit)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {data.week.installations} installation(s) completed
              </div>
            </div>
          </div>

          {/* Card This Month */}
          <div className="form-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className="page-category" style={{ margin: 0 }}>This Month</p>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>1st — Today</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.month.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(data.month.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '12px 16px', border: '1px solid var(--border)', gap: '2px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.25rem', color: data.month.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.month.profit)}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {data.month.installations} installation(s) completed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Filters Panel */}
      <section className="card-section" style={{ margin: 0 }}>
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 className="card-title">Interactive Filtered Analysis</h2>
          <p className="card-subtitle">Customize the reporting date range and product supplier company filters to audit trends.</p>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Period timeframe</label>
            <select className="form-select" value={range} onChange={e => setRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="custom">Custom date range</option>
            </select>
          </div>

          {range === 'custom' && (
            <>
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={startDateStr} onChange={e => setStartDateStr(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={endDateStr} onChange={e => setEndDateStr(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label className="form-label">Supplier Company Filter</label>
            <select className="form-select" value={companyId} onChange={e => setCompanyId(e.target.value)}>
              <option value="ALL">All suppliers</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button onClick={loadData} className="btn btn-primary">Apply Filters</button>
        </div>

        {/* Range summary stats */}
        <div className="stats-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
          <div className="stat-card">
            <span className="stat-label">RANGE PURCHASES</span>
            <span className="stat-value">{formatCurrency(data.rangeTotals.purchases)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">RANGE SALES</span>
            <span className="stat-value">{formatCurrency(data.rangeTotals.sales)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">RANGE PROFIT</span>
            <span className="stat-value" style={{ color: data.rangeTotals.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {formatCurrency(data.rangeTotals.profit)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">INSTALLATIONS</span>
            <span className="stat-value">{data.rangeTotals.installationsCount}</span>
          </div>
        </div>

        {/* Collections in Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          <div className="form-card" style={{ padding: '20px' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Supplier Payments Collection
            </h4>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {formatCurrency(data.companyCollections)}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total paid to supplier companies in this timeframe. Outstanding lifetime company due: <span style={{ fontWeight: 600 }}>{formatCurrency(data.pendingCompany)}</span>
            </p>
          </div>
          <div className="form-card" style={{ padding: '20px' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Sub-dealer collections
            </h4>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {formatCurrency(data.agentCollections)}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Total collected from partners in this timeframe. Outstanding lifetime partner due: <span style={{ fontWeight: 600, color: 'var(--danger-text)' }}>{formatCurrency(data.pendingPayments)}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Custom CSS Trend Chart */}
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '16px' }}>Daily Activity trends</h3>
          {trends.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
              No data points available for trend analysis
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', overflowX: 'auto' }}>
                {trends.map((t, idx) => {
                  const saleHeight = ((t.sales / maxVal) * 100) || 2;
                  const purchHeight = ((t.purchases / maxVal) * 100) || 2;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, minWidth: '40px', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px', width: '100%', justifyContent: 'center' }}>
                        {/* Purchase column */}
                        <div 
                          style={{ width: '8px', height: `${purchHeight}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0' }} 
                          title={`${t.date} Purchases: ₹${t.purchases}`}
                        />
                        {/* Sales column */}
                        <div 
                          style={{ width: '8px', height: `${saleHeight}%`, background: '#f59e0b', borderRadius: '4px 4px 0 0' }} 
                          title={`${t.date} Sales: ₹${t.sales} (Profit: ₹${t.profit})`}
                        />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.date}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }} />
                  Purchases
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} />
                  Sales
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Installations registry inside filtered timeframe */}
      <section className="card-section">
        <div className="card-title-group" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 className="card-title">Installation Registry for Selected timeframe</h2>
          <p className="card-subtitle">List of vehicle tracker installations completed during the active filter timeframe.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
          <input 
            placeholder="Search installations by IMEI or Customer Name..."
            className="form-input"
            style={{ flexGrow: 1 }}
            value={installSearch}
            onChange={e => setInstallSearch(e.target.value)}
          />
          <button onClick={handleExportInstallations} className="btn btn-secondary">
            Export Excel
          </button>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Device IMEI</th>
                <th>Customer details</th>
                <th>Phone Number</th>
                <th>Vehicle / Car No.</th>
                <th>Chassis No.</th>
                <th>Installed Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No installations found matching date-range and search</td>
                </tr>
              ) : (
                filteredInsts.map((inst, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{inst.deviceId}</td>
                    <td>{inst.customerName}</td>
                    <td>{inst.customerPhone}</td>
                    <td>{inst.carNumber}</td>
                    <td>{inst.chassisNumber}</td>
                    <td>{formatDate(inst.installedAt)}</td>
                    <td>{inst.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
