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
function CompaniesView({ hasPerm, setPath, setCompanyDetailId }) {
  const [companies, setCompanies] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  const [purchaseCompId, setPurchaseCompId] = useState('');
  const [purchaseDevId, setPurchaseDevId] = useState('');
  const [purchaseSerial, setPurchaseSerial] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchasedAt, setPurchasedAt] = useState('');
  const [purchaseImageFile, setPurchaseImageFile] = useState(null);

  const [payCompId, setPayCompId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payReceiptFile, setPayReceiptFile] = useState(null);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies);
        setSummaries(data.summaries);
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

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: companyName, phone: companyPhone, address: companyAddress })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Company added successfully!');
        setCompanyName('');
        setCompanyPhone('');
        setCompanyAddress('');
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
        setPurchasePrice('');
        setPurchasedAt('');
        setPurchaseImageFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to add purchase', 'danger');
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
        setPayDate('');
        setPayReceiptFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record payment', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const filteredSummaries = summaries.filter(s => 
    s.company.name.toLowerCase().includes(search.toLowerCase()) || 
    s.company.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Company Ledger</p>
          <h1 className="page-title">Company Summary</h1>
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

      {/* Forms Grid */}
      <div className="form-grid-three">
        {/* Form 1: Create Company */}
        {hasPerm('COMPANY_CREATE') && (
          <form className="form-card" onSubmit={handleCreateCompany}>
            <h2 className="form-card-title">Create Company</h2>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Company name" 
                className="form-input" 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Phone" 
                className="form-input" 
                value={companyPhone}
                onChange={e => setCompanyPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Address" 
                className="form-input" 
                value={companyAddress}
                onChange={e => setCompanyAddress(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Company</button>
          </form>
        )}

        {/* Form 2: Purchase Device */}
        {hasPerm('COMPANY_DEVICE_ADD') && (
          <form className="form-card" onSubmit={handleAddPurchase}>
            <h2 className="form-card-title">Purchase Device</h2>
            <div className="form-group">
              <select 
                required 
                className="form-select"
                value={purchaseCompId}
                onChange={e => setPurchaseCompId(e.target.value)}
              >
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Device ID" 
                className="form-input" 
                value={purchaseDevId}
                onChange={e => setPurchaseDevId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Serial number" 
                className="form-input" 
                value={purchaseSerial}
                onChange={e => setPurchaseSerial(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="number" 
                required 
                placeholder="Purchase price" 
                className="form-input" 
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="date" 
                className="form-input" 
                value={purchasedAt}
                onChange={e => setPurchasedAt(e.target.value)}
              />
            </div>
            <div className="form-group">
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Purchase</button>
          </form>
        )}

        {/* Form 3: Company Payment */}
        {hasPerm('COMPANY_PAYMENT') && (
          <form className="form-card" onSubmit={handleAddPayment}>
            <h2 className="form-card-title">Company Payment</h2>
            <div className="form-group">
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
              <input 
                type="number" 
                required 
                placeholder="Payment amount" 
                className="form-input" 
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
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
            <div className="form-group">
              <input 
                type="date" 
                className="form-input" 
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Payment</button>
          </form>
        )}
      </div>

      {/* Balance Sheet */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Company Balance Sheet</h2>
          <p className="card-subtitle">Each company balance is calculated from purchase items and company payments.</p>
        </div>

        <div className="search-filter-bar">
          <div className="header-user-info" style={{ flexGrow: 1 }}>
            <p className="user-name" style={{ fontWeight: 600 }}>Search companies</p>
            <p className="card-subtitle">Filter the balance sheet by company name or ID.</p>
          </div>
          <div className="autocomplete-wrapper" style={{ minWidth: '320px' }}>
            <input 
              type="text" 
              placeholder="Search company..." 
              className="form-input" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading table data...</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Devices Purchased</th>
                  <th>Total Purchase</th>
                  <th>Total Paid</th>
                  <th>Remaining Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No matching records found</td>
                  </tr>
                ) : (
                  filteredSummaries.map((sum, index) => (
                    <tr key={index}>
                      <td>
                        <a 
                          href="#" 
                          className="table-link" 
                          onClick={(e) => { e.preventDefault(); setCompanyDetailId(sum.company.id); }}
                        >
                          {sum.company.name}
                        </a>
                      </td>
                      <td>{sum.devicesPurchased}</td>
                      <td>{formatCurrency(sum.totalPurchaseAmount)}</td>
                      <td>{formatCurrency(sum.totalPaid)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(sum.remainingDue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
function AgentsView({ hasPerm, setPath, setAgentDetailId }) {
  const [agents, setAgents] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // AutoComplete Suggestion for Device selection in Sale Form
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  // Form states
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentShop, setAgentShop] = useState('');

  const [saleAgentId, setSaleAgentId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [soldAt, setSoldAt] = useState('');

  const [payAgentId, setPayAgentId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payReceiptFile, setPayReceiptFile] = useState(null);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
        setSummaries(data.summaries);
        setDevices(data.devices || []);
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

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: agentName, phone: agentPhone, shopName: agentShop })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Agent added successfully!');
        setAgentName('');
        setAgentPhone('');
        setAgentShop('');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to add agent', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      triggerAlert('Please select a device from the suggestions', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/agents/sale`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          agentId: saleAgentId,
          deviceId: selectedDevice.id,
          sellingPrice: Number(salePrice),
          soldAt: soldAt || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Agent sale recorded successfully!');
        setSaleAgentId('');
        setSelectedDevice(null);
        setDeviceSearch('');
        setSalePrice('');
        setSoldAt('');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record sale', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  const handleRecordPayment = async (e) => {
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
          receiptImage: base64Receipt,
          paymentDate: payDate || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Agent payment recorded successfully!');
        setPayAgentId('');
        setPayAmount('');
        setPayDate('');
        setPayReceiptFile(null);
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record payment', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Autocomplete filtering of IN_STOCK devices
  const inStockDevices = devices.filter(d => d.status === 'IN_STOCK');
  const filteredDevices = inStockDevices.filter(d => 
    d.id.includes(deviceSearch) || d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  const filteredSummaries = summaries.filter(s => 
    s.agent.name.toLowerCase().includes(search.toLowerCase()) || 
    s.agent.shopName.toLowerCase().includes(search.toLowerCase()) || 
    s.agent.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Agent Ledger</p>
          <h1 className="page-title">Agent Summary</h1>
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

      {/* Forms Grid */}
      <div className="form-grid-three">
        {/* Form 1: Create Agent */}
        {hasPerm('AGENT_CREATE') && (
          <form className="form-card" onSubmit={handleCreateAgent}>
            <h2 className="form-card-title">Create Agent</h2>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Agent name" 
                className="form-input" 
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Phone" 
                className="form-input" 
                value={agentPhone}
                onChange={e => setAgentPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Shop name" 
                className="form-input" 
                value={agentShop}
                onChange={e => setAgentShop(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Agent</button>
          </form>
        )}

        {/* Form 2: Agent Sale */}
        {hasPerm('AGENT_SALE') && (
          <form className="form-card" onSubmit={handleRecordSale}>
            <h2 className="form-card-title">Agent Sale</h2>
            <div className="form-group">
              <select 
                required 
                className="form-select"
                value={saleAgentId}
                onChange={e => setSaleAgentId(e.target.value)}
              >
                <option value="">Select agent</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group autocomplete-wrapper">
              <input 
                type="text" 
                required 
                placeholder="Search device ID or serial" 
                className="form-input"
                value={deviceSearch}
                onChange={e => {
                  setDeviceSearch(e.target.value);
                  setSelectedDevice(null);
                  setShowDeviceDropdown(true);
                }}
                onFocus={() => setShowDeviceDropdown(true)}
              />
              {showDeviceDropdown && deviceSearch && (
                <div className="autocomplete-dropdown">
                  {filteredDevices.length === 0 ? (
                    <div className="autocomplete-item" style={{ color: 'var(--text-muted)' }}>No IN_STOCK devices</div>
                  ) : (
                    filteredDevices.slice(0, 5).map(dev => (
                      <div 
                        key={dev.id} 
                        className="autocomplete-item"
                        onClick={() => {
                          setSelectedDevice(dev);
                          setDeviceSearch(`${dev.id} (${dev.serialNumber})`);
                          setSalePrice(dev.purchasePrice); // Autofill CP as starting SP
                          setShowDeviceDropdown(false);
                        }}
                      >
                        {dev.serialNumber} <span>ID: {dev.id}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Cost Price (Calculated)</label>
              <input 
                type="number" 
                disabled 
                placeholder="Cost price" 
                className="form-input"
                style={{ backgroundColor: 'var(--bg-app)' }}
                value={selectedDevice ? selectedDevice.purchasePrice : ''}
              />
            </div>
            <div className="form-group">
              <input 
                type="number" 
                required 
                placeholder="Selling price" 
                className="form-input" 
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="date" 
                className="form-input" 
                value={soldAt}
                onChange={e => setSoldAt(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Record Sale</button>
          </form>
        )}

        {/* Form 3: Agent Payment */}
        {hasPerm('AGENT_PAYMENT') && (
          <form className="form-card" onSubmit={handleRecordPayment}>
            <h2 className="form-card-title">Agent Payment</h2>
            <div className="form-group">
              <select 
                required 
                className="form-select"
                value={payAgentId}
                onChange={e => setPayAgentId(e.target.value)}
              >
                <option value="">Select agent</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <input 
                type="number" 
                required 
                placeholder="Payment amount" 
                className="form-input" 
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
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
            <div className="form-group">
              <input 
                type="date" 
                className="form-input" 
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Record Payment</button>
          </form>
        )}
      </div>

      {/* Performance Grid */}
      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Agent Performance</h2>
          <p className="card-subtitle">Every agent summary is computed from sales, payments, and profit per device.</p>
        </div>

        <div className="search-filter-bar">
          <div className="header-user-info" style={{ flexGrow: 1 }}>
            <p className="user-name" style={{ fontWeight: 600 }}>Search agents</p>
            <p className="card-subtitle">Filter by agent name, shop name, or ID.</p>
          </div>
          <div className="autocomplete-wrapper" style={{ minWidth: '320px' }}>
            <input 
              type="text" 
              placeholder="Search agent..." 
              className="form-input" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading agent summaries...</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Devices Sold</th>
                  <th>Total Sales</th>
                  <th>Total Received</th>
                  <th>Pending Amount</th>
                  <th>Profit Generated</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No agents found</td>
                  </tr>
                ) : (
                  filteredSummaries.map((sum, index) => (
                    <tr key={index}>
                      <td>
                        <a 
                          href="#" 
                          className="table-link" 
                          onClick={(e) => { e.preventDefault(); setAgentDetailId(sum.agent.id); }}
                        >
                          {sum.agent.name}
                        </a>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sum.agent.shopName}</div>
                      </td>
                      <td>{sum.devicesSold}</td>
                      <td>{formatCurrency(sum.totalSales)}</td>
                      <td>{formatCurrency(sum.totalReceived)}</td>
                      <td style={{ color: sum.pendingAmount > 0 ? 'var(--danger-text)' : 'inherit', fontWeight: sum.pendingAmount > 0 ? 600 : 'normal' }}>
                        {formatCurrency(sum.pendingAmount)}
                      </td>
                      <td style={{ color: sum.profitGenerated > 0 ? 'var(--success-text)' : 'inherit', fontWeight: 600 }}>
                        {formatCurrency(sum.profitGenerated)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
function DevicesView({ hasPerm, setPath }) {
  const [devices, setDevices] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [agentSaleItems, setAgentSaleItems] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Sort Logic
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

  const filteredDevices = devices.filter(dev => {
    // 1. Search Query
    const query = search.toLowerCase();
    const matchSearch = dev.id.includes(query) || dev.serialNumber.toLowerCase().includes(query);

    // 2. Status Filter
    const matchStatus = statusFilter === 'ALL' || dev.status === statusFilter;

    // 3. Company Filter
    const matchCompany = companyFilter === 'ALL' || getDeviceCompanyId(dev.id) === companyFilter;

    // 4. Agent Filter
    const matchAgent = agentFilter === 'ALL' || getDeviceAgentId(dev.id) === agentFilter;

    // 5. Date Filter (on purchase date)
    const pDate = getDevicePurchaseDate(dev.id);
    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && pDate >= new Date(startDate);
    }
    if (endDate) {
      matchDate = matchDate && pDate <= new Date(endDate);
    }

    return matchSearch && matchStatus && matchCompany && matchAgent && matchDate;
  });

  // Sorting logic
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let valA = a.id;
    let valB = b.id;

    if (sortBy === 'status') {
      valA = a.status;
      valB = b.status;
    } else if (sortBy === 'date') {
      valA = getDevicePurchaseDate(a.id);
      valB = getDevicePurchaseDate(b.id);
    } else if (sortBy === 'company') {
      valA = getDeviceCompany(a.id);
      valB = getDeviceCompany(b.id);
    } else if (sortBy === 'agent') {
      valA = getDeviceAgent(a.id);
      valB = getDeviceAgent(b.id);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Inventory</p>
          <h1 className="page-title">Device Inventory</h1>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      <div className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Inventory & Details</h2>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="mt-4" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <input 
              placeholder="Search by device id or serial" 
              className="form-input" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select 
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="SOLD_TO_AGENT">Sold To Agent</option>
              <option value="INSTALLED">Installed</option>
            </select>
            <select 
              className="form-select"
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
            >
              <option value="ALL">All companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <select 
              className="form-select"
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
            >
              <option value="ALL">All agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            
            <div style={{ display: 'flex', itemsCenter: 'center', gap: '8px' }}>
              <input 
                type="date" 
                className="form-input" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="form-input" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="form-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="id">Sort by ID</option>
                <option value="status">Sort by Status</option>
                <option value="date">Sort by Purchase Date</option>
                <option value="company">Sort by Company</option>
                <option value="agent">Sort by Agent</option>
              </select>
              <select 
                className="form-select"
                style={{ width: '90px' }}
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Device Grid */}
        {loading ? (
          <p style={{ marginTop: '24px' }}>Loading devices...</p>
        ) : (
          <div className="device-grid" style={{ marginTop: '32px' }}>
            {sortedDevices.length === 0 ? (
              <div className="col-span-full" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No devices match current filters.
              </div>
            ) : (
              sortedDevices.map(dev => (
                <div key={dev.id} className="device-card">
                  <div className="device-card-header">
                    <div className="device-image-thumb">
                      {dev.image ? (
                        <img src={dev.image} alt={dev.id} />
                      ) : (
                        <span className="device-avatar-placeholder">{dev.serialNumber.slice(-2)}</span>
                      )}
                    </div>
                    <div className="device-title-info">
                      <p className="device-id-tag">ID: {dev.id}</p>
                      <h2 className="device-serial">{dev.serialNumber}</h2>
                      {dev.status !== 'IN_STOCK' && (
                        <p className="device-owner">Owner: {dev.currentOwner}</p>
                      )}
                    </div>
                  </div>
                  <div className="device-details-grid">
                    <div className="device-details-item">
                      <span>Purchase Price</span>
                      <p>{formatCurrency(dev.purchasePrice)}</p>
                    </div>
                    <div className="device-details-item">
                      <span>Status</span>
                      <div>
                        <span className={`status-badge ${dev.status === 'INSTALLED' ? 'installed' : dev.status === 'SOLD_TO_AGENT' ? 'sold' : ''}`}>
                          {dev.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="device-details-item">
                      <span>Company</span>
                      <p>{getDeviceCompany(dev.id) || '-'}</p>
                    </div>
                    {dev.status !== 'IN_STOCK' && (
                      <div className="device-details-item">
                        <span>Agent</span>
                        <p>{getDeviceAgent(dev.id) || '-'}</p>
                      </div>
                    )}
                    {dev.status !== 'IN_STOCK' && (
                      <div className="device-details-item">
                        <span>Sale Price</span>
                        <p>{formatCurrency(getDeviceSalePrice(dev.id))}</p>
                      </div>
                    )}
                    {dev.status === 'INSTALLED' && (
                      <div className="device-details-item">
                        <span>Installed At</span>
                        <p>{formatDate(getDeviceInstallDate(dev.id))}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. INSTALLATIONS VIEW
// ==========================================
function InstallationsView({ hasPerm, setPath }) {
  const [installations, setInstallations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentSaleItems, setAgentSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  // Form States
  const [instAgentId, setInstAgentId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [installedAt, setInstalledAt] = useState('');

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

  const handleSaveInstallation = async (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      triggerAlert('Please select a sold device from the suggestions', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/installations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          agentId: instAgentId,
          deviceId: selectedDevice.id,
          customerName: custName,
          customerPhone: custPhone,
          carNumber,
          chassisNumber,
          installedAt: installedAt || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerAlert('Installation details recorded successfully!');
        setInstAgentId('');
        setSelectedDevice(null);
        setDeviceSearch('');
        setCustName('');
        setCustPhone('');
        setCarNumber('');
        setChassisNumber('');
        setInstalledAt('');
        loadData();
      } else {
        triggerAlert(data.error || 'Failed to record installation', 'danger');
      }
    } catch (err) {
      triggerAlert('Network error', 'danger');
    }
  };

  // Autocomplete: Find devices that are SOLD_TO_AGENT. If agent selected, only show devices sold to that specific agent!
  const soldDevices = devices.filter(d => {
    const matchesSoldState = d.status === 'SOLD_TO_AGENT';
    if (!matchesSoldState) return false;
    if (!instAgentId) return true;
    
    // Check if this device is sold to the selected agent
    const sItem = agentSaleItems.find(s => s.deviceId === d.id);
    return sItem && sItem.agentId === instAgentId;
  });

  const filteredSoldDevices = soldDevices.filter(d => 
    d.id.includes(deviceSearch) || d.serialNumber.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  const getAgentName = (agId) => {
    const ag = agents.find(a => a.id === agId);
    return ag ? ag.name : 'Direct / Unknown';
  };

  // Filter Installations Table
  const filteredInstallations = installations.filter(inst => {
    const matchesAgent = !agentFilter || inst.agentId === agentFilter;
    const query = search.toLowerCase();
    const matchesSearch = 
      inst.deviceId.includes(query) || 
      inst.customerName.toLowerCase().includes(query) || 
      inst.customerPhone.includes(query) || 
      inst.carNumber.toLowerCase().includes(query) || 
      inst.chassisNumber.toLowerCase().includes(query);

    return matchesAgent && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Customer Installations</p>
          <h1 className="page-title">Installation Tracking</h1>
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

      {/* Record Installation Form */}
      {hasPerm('INSTALL') && (
        <div className="card-section">
          <div className="card-title-group">
            <h2 className="card-title">Record Installation</h2>
          </div>
          <form className="mt-6" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(2, 1fr)' }} onSubmit={handleSaveInstallation}>
            <div className="form-group">
              <select 
                className="form-select"
                value={instAgentId}
                onChange={e => {
                  setInstAgentId(e.target.value);
                  setSelectedDevice(null);
                  setDeviceSearch('');
                }}
              >
                <option value="">Select agent (Optional)</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            
            <div className="form-group autocomplete-wrapper">
              <input 
                type="text" 
                required 
                placeholder="Search sold device ID or serial" 
                className="form-input"
                value={deviceSearch}
                onChange={e => {
                  setDeviceSearch(e.target.value);
                  setSelectedDevice(null);
                  setShowDeviceDropdown(true);
                }}
                onFocus={() => setShowDeviceDropdown(true)}
              />
              {showDeviceDropdown && deviceSearch && (
                <div className="autocomplete-dropdown">
                  {filteredSoldDevices.length === 0 ? (
                    <div className="autocomplete-item" style={{ color: 'var(--text-muted)' }}>No SOLD devices found</div>
                  ) : (
                    filteredSoldDevices.slice(0, 5).map(dev => (
                      <div 
                        key={dev.id} 
                        className="autocomplete-item"
                        onClick={() => {
                          setSelectedDevice(dev);
                          setDeviceSearch(`${dev.id} (${dev.serialNumber})`);
                          setShowDeviceDropdown(false);
                          
                          // Auto fill customer name from device owner if available
                          if (dev.currentOwner && dev.currentOwner !== getAgentName(instAgentId)) {
                            // If owner exists, use it
                          }
                        }}
                      >
                        {dev.serialNumber} <span>ID: {dev.id}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Customer name" 
                className="form-input" 
                value={custName}
                onChange={e => setCustName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Customer phone" 
                className="form-input" 
                value={custPhone}
                onChange={e => setCustPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Car number" 
                className="form-input" 
                value={carNumber}
                onChange={e => setCarNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                required 
                placeholder="Chassis number" 
                className="form-input" 
                value={chassisNumber}
                onChange={e => setChassisNumber(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <input 
                type="date" 
                className="form-input" 
                value={installedAt}
                onChange={e => setInstalledAt(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
              Save Installation
            </button>
          </form>
        </div>
      )}

      {/* Installations Dashboard */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Final Customer Details</h2>
          <p className="card-subtitle">Search and trace installations by device, customer phone, car number, chassis number, or agent.</p>
        </div>

        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Search</label>
            <input 
              placeholder="Search by device, customer, phone, car, chassis" 
              className="form-input" 
              style={{ marginTop: '8px' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter</label>
            <select 
              className="form-select" 
              style={{ marginTop: '8px' }}
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
            >
              <option value="">All agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="stat-card" style={{ padding: '16px 24px', justifyContent: 'center' }}>
            <span className="stat-label">Results</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{filteredInstallations.length}</span>
            <p className="card-subtitle" style={{ fontSize: '0.75rem', marginTop: '2px' }}>matching installations</p>
          </div>
        </div>

        {loading ? (
          <p>Loading installations ledger...</p>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Agent</th>
                  <th>Car Number</th>
                  <th>Installed At</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallations.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No installations tracked</td>
                  </tr>
                ) : (
                  filteredInstallations.map((inst, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{inst.deviceId}</td>
                      <td>{inst.customerName}</td>
                      <td>{inst.customerPhone}</td>
                      <td>{getAgentName(inst.agentId)}</td>
                      <td>{inst.carNumber}</td>
                      <td>{formatDate(inst.installedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// 8. SECURITY / USER ACCESS CONTROL
// ==========================================
function UsersView({ hasPerm, setPath, isSetupMode = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
function ReportsView({ hasPerm, setPath }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/reports`, { headers: getHeaders() });
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
    loadReports();
  }, []);

  if (loading) return <p>Loading reports...</p>;
  if (!data) return <p>Error loading reports dashboard.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <p className="page-category">Reports</p>
          <h1 className="page-title">Daily / Weekly / Monthly Summary</h1>
        </div>
        <button onClick={() => setPath('/')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {/* Period summaries */}
      <section className="card-section" style={{ margin: 0 }}>
        <div className="card-title-group">
          <h2 className="card-title">Report Timeframes</h2>
          <p className="card-subtitle">Track purchases, sales, collections, and profit for today, this week, and this month.</p>
        </div>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Card: Today */}
          <div className="form-card" style={{ padding: '24px' }}>
            <p className="page-category">Today</p>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{new Date().toLocaleDateString('en-IN')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.today.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.today.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.5rem', color: data.today.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.today.profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: This Week */}
          <div className="form-card" style={{ padding: '24px' }}>
            <p className="page-category">This Week</p>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Monday — Today</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.week.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.week.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.5rem', color: data.week.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.week.profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: This Month */}
          <div className="form-card" style={{ padding: '24px' }}>
            <p className="page-category">This Month</p>
            <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>1st — Today</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Purchases</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.month.purchases)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Sales</span>
                <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(data.month.sales)}</span>
              </div>
              <div className="stat-card" style={{ padding: '16px', border: '1px solid var(--border-color)', gap: '4px' }}>
                <span className="stat-label" style={{ fontSize: '0.65rem' }}>Profit</span>
                <span className="stat-value" style={{ fontSize: '1.5rem', color: data.month.profit >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(data.month.profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections ledger */}
      <section className="card-section" style={{ margin: 0 }}>
        <div className="card-title-group">
          <h2 className="card-title">Collections & Pending</h2>
          <p className="card-subtitle">Balance the company and agent collections against open amounts in the selected timeframe.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Company Collections</span>
            <span className="stat-value">{formatCurrency(data.companyCollections)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Agent Collections</span>
            <span className="stat-value">{formatCurrency(data.agentCollections)}</span>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--danger)' }}>
            <span className="stat-label">Pending Payments</span>
            <span className="stat-value" style={{ color: 'var(--danger-text)' }}>{formatCurrency(data.pendingPayments)}</span>
          </div>
        </div>
      </section>

      {/* Recent Installations */}
      <section className="card-section">
        <div className="card-title-group">
          <h2 className="card-title">Recent Installations</h2>
          <p className="card-subtitle">Latest installed devices with customer and agent details.</p>
        </div>
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Car Number</th>
                <th>Installed At</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInstallations.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No recent installations found</td>
                </tr>
              ) : (
                data.recentInstallations.map((inst, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600 }}>{inst.deviceId}</td>
                    <td>{inst.customerName}</td>
                    <td>{inst.customerPhone}</td>
                    <td>{inst.carNumber}</td>
                    <td>{formatDate(inst.installedAt)}</td>
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
