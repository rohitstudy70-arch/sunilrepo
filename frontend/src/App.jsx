import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

const fileToB64 = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
  });

const today = () => new Date().toISOString().split('T')[0];

const exportToCSV = (headers, rows, filename) => {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
  };
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl text-sm font-medium shadow-lg transition-all transform animate-fade-up ${
      type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
    }`}>
      {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [path, setPath] = useState('/');
  const [companyDetailId, setCompanyDetailId] = useState(null);
  const [agentDetailId, setAgentDetailId] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Theme Night Mode (sync across all pages)
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  // Security Mask toggle (masked purchase prices/profits)
  const [maskData, setMaskData] = useState(localStorage.getItem('mask_data') !== 'false');

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const toggleMask = () => {
    const newVal = !maskData;
    setMaskData(newVal);
    localStorage.setItem('mask_data', String(newVal));
    showToast(newVal ? 'Financial values hidden' : 'Financial values visible');
  };

  const toggleTheme = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    localStorage.setItem('theme', newVal ? 'dark' : 'light');
    showToast(newVal ? 'Switched to Night Mode' : 'Switched to Day Mode');
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Token -> fetch user details
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchMe();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        doLogout();
      }
    } catch {
      doLogout();
    }
  };

  const doLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setPath('/login');
  };

  const hasPerm = (perm) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(perm);
  };

  // Route guard
  useEffect(() => {
    if (!token && path !== '/users') setPath('/login');
    else if (token && path === '/login') setPath('/');
  }, [token, path]);

  const nav = (p) => { 
    setPath(p); 
    setCompanyDetailId(null); 
    setAgentDetailId(null); 
    window.scrollTo(0, 0);
  };

  // Helper formatting currencies
  const fmt = (num) => {
    if (maskData) return '₹••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!token) {
    return (
      <div className={`app-shell${isDark ? ' dark' : ''}`}>
        <LoginPage onLogin={setToken} showToast={showToast} nav={nav} />
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  let page;
  if (path === '/') {
    page = <DashboardPage user={user} nav={nav} hasPerm={hasPerm} isDark={isDark} toggleTheme={toggleTheme} />;
  } else if (path === '/companies' && !companyDetailId) {
    page = (
      <CompaniesPage 
        user={user} 
        hasPerm={hasPerm} 
        nav={nav} 
        onDetail={setCompanyDetailId} 
        showToast={showToast} 
        maskData={maskData} 
        toggleMask={toggleMask} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/companies' && companyDetailId) {
    page = (
      <CompanyDetailPage 
        id={companyDetailId} 
        nav={nav} 
        hasPerm={hasPerm} 
        showToast={showToast} 
        maskData={maskData} 
        toggleMask={toggleMask} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/agents' && !agentDetailId) {
    page = (
      <AgentsPage 
        user={user} 
        hasPerm={hasPerm} 
        nav={nav} 
        onDetail={setAgentDetailId} 
        showToast={showToast} 
        maskData={maskData} 
        toggleMask={toggleMask} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/agents' && agentDetailId) {
    page = (
      <AgentDetailPage 
        id={agentDetailId} 
        nav={nav} 
        hasPerm={hasPerm} 
        showToast={showToast} 
        maskData={maskData} 
        toggleMask={toggleMask} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/devices') {
    page = (
      <DevicesPage 
        user={user}
        hasPerm={hasPerm} 
        nav={nav} 
        showToast={showToast} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        maskData={maskData} 
        toggleMask={toggleMask} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/installations') {
    page = (
      <InstallationsPage 
        user={user}
        hasPerm={hasPerm} 
        nav={nav} 
        showToast={showToast} 
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/reports') {
    page = (
      <ReportsPage 
        user={user}
        hasPerm={hasPerm} 
        nav={nav} 
        maskData={maskData}
        fmt={fmt}
        fmtDate={fmtDate}
      />
    );
  } else if (path === '/users') {
    page = (
      <UsersPage 
        user={user} 
        hasPerm={hasPerm} 
        nav={nav} 
        showToast={showToast} 
      />
    );
  } else {
    page = <DashboardPage user={user} nav={nav} hasPerm={hasPerm} isDark={isDark} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={`app-shell${isDark ? ' dark' : ''}`}>
      {/* HEADER — exact visual parity with original site */}
      <header className="border-b border-slate-200 bg-white/90 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/90 sticky top-0 z-50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Signed in as <span className="font-semibold text-slate-900 dark:text-slate-100">{user?.name || '...'}</span>
              </p>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{user?.role || 'USER'}</p>
            </div>
          </div>
          {/* Navigation links */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { p: '/', label: 'Dashboard' },
              hasPerm('COMPANY') && { p: '/companies', label: 'Companies' },
              hasPerm('AGENTS') && { p: '/agents', label: 'Partners' },
              hasPerm('INVENTORY') && { p: '/devices', label: 'Devices' },
              hasPerm('INSTALL') && { p: '/installations', label: 'Installs' },
              hasPerm('REPORTS') && { p: '/reports', label: 'Reports' },
              hasPerm('USERS') && { p: '/users', label: 'Users' },
            ].filter(Boolean).map(item => (
              <button
                key={item.p}
                onClick={() => nav(item.p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  path === item.p
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isDark ? '☀️ Day' : '🌙 Night'}
            </button>
            <button
              onClick={doLogout}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* PAGE CONTAINER */}
      <div className="app-content">
        {page}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────

function LoginPage({ onLogin, showToast, nav }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        showToast(data.error || 'Invalid credentials', 'danger');
      }
    } catch {
      showToast('Network error', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm w-full max-w-sm dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 mb-1">Sign in</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white mb-2">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Use your mobile number or username. Blocked accounts cannot sign in.</p>
        
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Mobile / Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9761334377 or arshi@gps"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400 transition"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
          <button onClick={() => nav('/users')} className="text-sm underline text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
            First-time setup / manage users
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────

function DashboardPage({ user, nav, hasPerm, isDark, toggleTheme }) {
  const quickLinks = [
    { href: '/companies', title: 'Company Dashboard', badge: 'Company', desc: 'Add companies, record purchase devices, company payments, and view balances.', perm: 'COMPANY' },
    { href: '/agents', title: 'Partner Ledger', badge: 'Partners', desc: 'Track partners, sales, commissions, and performance summaries.', perm: 'AGENTS' },
    { href: '/installations', title: 'Installations', badge: 'Install', desc: 'Search and review customer installations with device and agent context.', perm: 'INSTALL' },
    { href: '/devices', title: 'Device Inventory', badge: 'Inventory', desc: 'Manage stock, inventory movements, and device purchase details.', perm: 'INVENTORY' },
    { href: '/users', title: 'User Management', badge: 'Security', desc: 'Create users, assign permission sets, and disable blocked accounts.', perm: 'USERS' },
    { href: '/reports', title: 'Reports', badge: 'Reports', desc: 'View summary reports for sales, purchases, profit, and pending balances.', perm: 'REPORTS' },
  ];

  const allowed = quickLinks.filter(l => hasPerm(l.perm));

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Operational dashboard</p>
            <h1 className="text-4xl font-semibold mt-1">Welcome back, {user?.name || 'sunil'}</h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          </button>
        </div>

        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none transition">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Quick Links</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Open workflows for company activity, agent operations, device inventory, installations, user management, and reports.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
            {allowed.map((l) => (
              <button
                key={l.href}
                onClick={() => nav(l.href)}
                className="group block rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left text-slate-950 transition hover:border-slate-400 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-950/80"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold group-hover:text-slate-950 dark:group-hover:text-white">{l.title}</h3>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">{l.badge}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{l.desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPANIES PAGE
// ─────────────────────────────────────────────────────────────

function CompaniesPage({ hasPerm, nav, onDetail, showToast, maskData, toggleMask, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [deletedDevices, setDeletedDevices] = useState([]);
  
  const [search, setSearch] = useState('');
  const [deletedSearch, setDeletedSearch] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tabs for action cards
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' | 'company' | 'type' | 'payment'

  // Form States
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddr, setCAddr] = useState('');
  const [cBasePrice, setCBasePrice] = useState('');

  const [pCompany, setPCompany] = useState('');
  const [pDevice, setPDevice] = useState('');
  const [pSerial, setPSerial] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDate, setPDate] = useState(today());
  const [pImage, setPImage] = useState(null);
  
  const [pyCompany, setPyCompany] = useState('');
  const [pyAmount, setPyAmount] = useState('');
  const [pyDate, setPyDate] = useState(today());
  const [pyImage, setPyImage] = useState(null);

  const [tCompany, setTCompany] = useState('');
  const [tName, setTName] = useState('');
  const [tBasePrice, setTBasePrice] = useState('');

  // Bulk Purchase CSV state
  const [bulkCsvFile, setBulkCsvFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());

      const br = await fetch(`${API_URL}/companies/purchase/batches`, { headers: getHeaders() });
      if (br.ok) {
        const bd = await br.json();
        setBatches(bd.batches || []);
      }

      const dr = await fetch(`${API_URL}/devices/deleted`, { headers: getHeaders() });
      if (dr.ok) {
        const dd = await dr.json();
        setDeletedDevices(dd.deletedDeviceRecords || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companies = data?.companies || [];
  const summaries = data?.summaries || [];

  // Filter company balance sheet
  const filteredSummaries = summaries.filter(s => {
    const matchSearch = s.company.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company.phone.includes(search) ||
      s.company.id.toLowerCase().includes(search.toLowerCase());
    const matchDue = !filterDueOnly || s.totalDue > 0;
    return matchSearch && matchDue;
  });

  const totalDevices = filteredSummaries.reduce((sum, s) => sum + s.devicesCount, 0);
  const totalPurchase = filteredSummaries.reduce((sum, s) => sum + s.totalPurchaseValue, 0);
  const totalPaid = filteredSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalDue = filteredSummaries.reduce((sum, s) => sum + s.totalDue, 0);

  // Submit company
  const submitCompany = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/companies`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ name: cName, phone: cPhone, address: cAddr, basePrice: Number(cBasePrice) }),
    });
    if (res.ok) { 
      showToast('Company created successfully'); 
      setCName(''); setCPhone(''); setCAddr(''); setCBasePrice('');
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error adding company', 'danger'); 
    }
  };

  // Submit device purchase
  const submitPurchase = async (e) => {
    e.preventDefault();
    let image = '';
    if (pImage) image = await fileToB64(pImage);
    const res = await fetch(`${API_URL}/companies/purchase`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ 
        companyId: pCompany, 
        deviceId: pDevice, 
        serialNumber: pSerial, 
        purchasePrice: Number(pPrice), 
        purchasedAt: pDate, 
        image 
      }),
    });
    if (res.ok) { 
      showToast('Device purchase recorded'); 
      setPCompany(''); setPDevice(''); setPSerial(''); setPPrice(''); setPDate(today()); setPImage(null); 
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error adding purchase', 'danger'); 
    }
  };

  // Bulk Purchase CSV
  const submitBulkPurchase = async (e) => {
    e.preventDefault();
    if (!bulkCsvFile || !pCompany) {
      showToast('Please select a company and upload a CSV file', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target.result;
      try {
        const res = await fetch(`${API_URL}/companies/purchase/bulk`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ companyId: pCompany, csvText })
        });
        const d = await res.json();
        if (res.ok) {
          showToast(`Successfully imported ${d.count} devices!`);
          setBulkCsvFile(null);
          load();
        } else {
          showToast(d.error || 'Failed bulk upload', 'danger');
        }
      } catch {
        showToast('Server network error during upload', 'danger');
      }
    };
    reader.readAsText(bulkCsvFile);
  };

  // Revert Purchase Batch
  const handleRevertBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to revert this import? All active devices in this batch will be permanently removed.')) return;
    try {
      const res = await fetch(`${API_URL}/companies/purchase/revert/${batchId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const d = await res.json();
      if (res.ok) {
        showToast('Import batch successfully reverted!');
        load();
      } else {
        showToast(d.error || 'Failed to revert batch', 'danger');
      }
    } catch {
      showToast('Server network error', 'danger');
    }
  };

  // Submit payment
  const submitPayment = async (e) => {
    e.preventDefault();
    let receiptImage = '';
    if (pyImage) receiptImage = await fileToB64(pyImage);
    const res = await fetch(`${API_URL}/companies/payment`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ companyId: pyCompany, amount: Number(pyAmount), paymentDate: pyDate, receiptImage }),
    });
    if (res.ok) { 
      showToast('Payment recorded'); 
      setPyCompany(''); setPyAmount(''); setPyDate(today()); setPyImage(null); 
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error recording payment', 'danger'); 
    }
  };

  // Submit device type
  const submitDeviceType = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/companies/types`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ companyId: tCompany, name: tName, basePrice: Number(tBasePrice) }),
    });
    if (res.ok) {
      showToast('Device type added successfully');
      setTCompany(''); setTName(''); setTBasePrice('');
      load();
    } else {
      const d = await res.json();
      showToast(d.error || 'Error adding device type', 'danger');
    }
  };

  const handleRestoreDeleted = async (id) => {
    if (!window.confirm('Restore this device back into stock?')) return;
    try {
      const res = await fetch(`${API_URL}/devices/deleted/restore/${id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Device restored successfully!');
        load();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to restore', 'danger');
      }
    } catch {
      showToast('Restore request failed', 'danger');
    }
  };

  // Export balance sheet CSV
  const handleExportSheet = () => {
    const headers = ['Company', 'Phone', 'Address', 'Devices Purchased', 'Total Purchase', 'Total Paid', 'Remaining Due'];
    const rows = filteredSummaries.map(s => [
      s.company.name,
      s.company.phone,
      s.company.address,
      s.devicesCount,
      maskData ? '••••' : s.totalPurchaseValue,
      s.totalPaid,
      s.totalDue
    ]);
    exportToCSV(headers, rows, `company_balances_${today()}.csv`);
  };

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Company ledger</p>
            <h1 className="text-4xl font-semibold">Companies</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage suppliers, record device purchases and payments, and review balances.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMask}
              className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title="Toggle Mask Private Financial Data"
            >
              {maskData ? '👁️ Show Prices' : '🔒 Hide Prices'}
            </button>
            <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Dashboard
            </button>
          </div>
        </div>

        {/* Summary metrics section */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Registered Suppliers</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{companies.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Devices Purchased</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{totalDevices}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Paid To Suppliers</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{maskData ? '₹••••' : fmt(totalPaid)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Outstanding Due</p>
            <p className="text-3xl font-semibold text-red-600 dark:text-red-400 mt-2">{fmt(totalDue)}</p>
          </div>
        </div>

        {/* Action Panel Tab Selector */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
            <button 
              onClick={() => setActiveTab('purchase')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'purchase' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              Purchase Device
            </button>
            <button 
              onClick={() => setActiveTab('company')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'company' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              New Company
            </button>
            <button 
              onClick={() => setActiveTab('type')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'type' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              Device Type
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'payment' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              Record Payment
            </button>
          </div>

          {/* Tab Content forms */}
          {activeTab === 'purchase' && hasPerm('COMPANY_DEVICE_ADD') && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Purchase Device</h3>
                  <p className="text-sm text-slate-500">Record a single purchased device or batch CSV import.</p>
                </div>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Single Form */}
                <form onSubmit={submitPurchase} className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Single Device</h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Supplier Company *</label>
                    <select required value={pCompany} onChange={e => setPCompany(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                      <option value="">Select company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Device ID (IMEI) *</label>
                      <input required placeholder="15 digit IMEI" value={pDevice} onChange={e => setPDevice(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Serial Number *</label>
                      <input required placeholder="Serial No." value={pSerial} onChange={e => setPSerial(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Purchase Price *</label>
                      <input required type="number" placeholder="Use 0 for base price" value={pPrice} onChange={e => setPPrice(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Purchase Date *</label>
                      <input type="date" value={pDate} onChange={e => setPDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Device Photo (Optional)</label>
                    <input type="file" accept="image/*" onChange={e => setPImage(e.target.files[0])}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                    Add Purchase
                  </button>
                </form>

                {/* Bulk Form */}
                <form onSubmit={submitBulkPurchase} className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8 pt-6 md:pt-0">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Bulk CSV Import</h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Select Supplier *</label>
                    <select required value={pCompany} onChange={e => setPCompany(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                      <option value="">Select company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Upload CSV File *</label>
                    <input type="file" required accept=".csv" onChange={e => setBulkCsvFile(e.target.files[0])}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Required CSV Columns:</p>
                    <p>• imei / deviceid / device id (15 digits)</p>
                    <p>• serial / serialnumber</p>
                    <p>Optional: price, date, type</p>
                  </div>
                  <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                    Upload CSV
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'company' && hasPerm('COMPANY_CREATE') && (
            <form onSubmit={submitCompany} className="space-y-4 max-w-xl animate-fade-in">
              <h3 className="text-lg font-semibold">New Company</h3>
              <p className="text-sm text-slate-500">Contact details and default base pricing.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Company Name *</label>
                  <input required placeholder="e.g. ROSMERTA" value={cName} onChange={e => setCName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number *</label>
                  <input required placeholder="Mobile / Landline" value={cPhone} onChange={e => setCPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Base Price *</label>
                  <input required type="number" placeholder="Default purchase price" value={cBasePrice} onChange={e => setCBasePrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Address *</label>
                  <input required placeholder="Office Address" value={cAddr} onChange={e => setCAddr(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Create Company
              </button>
            </form>
          )}

          {activeTab === 'type' && hasPerm('COMPANY_CREATE') && (
            <form onSubmit={submitDeviceType} className="space-y-4 max-w-xl animate-fade-in">
              <h3 className="text-lg font-semibold">Device Type</h3>
              <p className="text-sm text-slate-500">Configure type-specific purchase pricing per company.</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Company *</label>
                <select required value={tCompany} onChange={e => setTCompany(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Type Name *</label>
                  <input required placeholder="e.g. AIS140" value={tName} onChange={e => setTName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Default Purchase Price *</label>
                  <input required type="number" placeholder="Base Type Price" value={tBasePrice} onChange={e => setTBasePrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Add Device Type
              </button>
            </form>
          )}

          {activeTab === 'payment' && hasPerm('COMPANY_PAYMENT') && (
            <form onSubmit={submitPayment} className="space-y-4 max-w-xl animate-fade-in">
              <h3 className="text-lg font-semibold">Company Payment</h3>
              <p className="text-sm text-slate-500">Record a payment made to a supplier company.</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Supplier Company *</label>
                <select required value={pyCompany} onChange={e => setPyCompany(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Amount Paid (INR) *</label>
                  <input required type="number" placeholder="Amount" value={pyAmount} onChange={e => setPyAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Date *</label>
                  <input type="date" value={pyDate} onChange={e => setPyDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Receipt Screenshot *</label>
                <input required type="file" accept="image/*" onChange={e => setPyImage(e.target.files[0])}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400" />
              </div>
              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Record Payment
              </button>
            </form>
          )}
        </div>

        {/* Historic import batches */}
        {batches.length > 0 && (
          <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Historic Import History</h2>
              <p className="text-sm text-slate-500">Each CSV upload batch is saved. Revert deletes all imported devices if still in stock.</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Uploaded At</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Imported Count</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {batches.map(b => {
                    const comp = companies.find(c => c.id === b.companyId);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-300">
                        <td className="px-6 py-4 font-mono text-xs">{fmtDate(b.createdAt)}</td>
                        <td className="px-6 py-4 font-semibold">{comp?.name || 'Unknown'}</td>
                        <td className="px-6 py-4">{b.imported} Devices</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            b.status === 'REVERTED' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {b.status !== 'REVERTED' && (
                            <button onClick={() => handleRevertBatch(b.id)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition">
                              Revert
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Deleted devices section */}
        {deletedDevices.length > 0 && (
          <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Deleted Device History</h2>
              <p className="text-sm text-slate-500">Stock devices permanently deleted. Search and restore back into active inventory.</p>
            </div>
            <div className="flex gap-4">
              <input 
                placeholder="Search IMEI, serial, deleted by..."
                value={deletedSearch}
                onChange={e => setDeletedSearch(e.target.value)}
                className="w-full max-w-sm rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold font-semibold">
                  <tr>
                    <th className="px-6 py-4">IMEI</th>
                    <th className="px-6 py-4">Serial</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Deleted Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {deletedDevices
                    .filter(d => 
                      d.deviceId.toLowerCase().includes(deletedSearch.toLowerCase()) ||
                      d.serialNumber.toLowerCase().includes(deletedSearch.toLowerCase())
                    )
                    .map(d => {
                      const comp = companies.find(c => c.id === d.companyId);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-300">
                          <td className="px-6 py-4 font-mono text-xs">{d.deviceId}</td>
                          <td className="px-6 py-4">{d.serialNumber}</td>
                          <td className="px-6 py-4">{comp?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{fmtDate(d.deletedAt)}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleRestoreDeleted(d.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition">
                              Restore Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Company Balance Sheet Table */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none transition">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Company Balance Sheet</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Summarized balances calculated from device purchase history and payments.</p>
            </div>
            <button onClick={handleExportSheet} className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Export Excel
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="dueOnly"
                  checked={filterDueOnly}
                  onChange={e => setFilterDueOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 outline-none"
                />
                <label htmlFor="dueOnly" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Due balances only
                </label>
              </div>
              <input
                placeholder="Search company..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-64"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Devices Purchased</th>
                    <th className="px-6 py-4">Total Purchase</th>
                    <th className="px-6 py-4">Total Paid</th>
                    <th className="px-6 py-4">Remaining Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSummaries.map(s => (
                    <tr key={s.company.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        <button
                          onClick={() => onDetail(s.company.id)}
                          className="text-left text-slate-950 hover:underline dark:text-white"
                        >
                          {s.company.name}
                        </button>
                        <div className="text-xs text-slate-400 font-normal mt-1">{s.company.phone} · {s.company.address}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{s.devicesCount}</td>
                      <td className="px-6 py-4">{fmt(s.totalPurchaseValue)}</td>
                      <td className="px-6 py-4">{fmt(s.totalPaid)}</td>
                      <td className={`px-6 py-4 font-semibold ${s.totalDue > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {fmt(s.totalDue)}
                      </td>
                    </tr>
                  ))}
                  {filteredSummaries.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No records matching search.</td></tr>
                  )}
                  {/* Totals row */}
                  {filteredSummaries.length > 0 && (
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                      <td className="px-6 py-4">Totals</td>
                      <td className="px-6 py-4 font-mono">{totalDevices}</td>
                      <td className="px-6 py-4">{fmt(totalPurchase)}</td>
                      <td className="px-6 py-4">{fmt(totalPaid)}</td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400">{fmt(totalDue)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPANY DETAIL PAGE
// ─────────────────────────────────────────────────────────────

function CompanyDetailPage({ id, nav, hasPerm, showToast, maskData, toggleMask, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Device Type forms
  const [typeName, setTypeName] = useState('');
  const [typePrice, setTypePrice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/companies/${id}`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const addDeviceType = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/companies/types`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ companyId: id, name: typeName, basePrice: Number(typePrice) }),
    });
    if (res.ok) {
      showToast('Device type added successfully');
      setTypeName(''); setTypePrice('');
      load();
    } else {
      const d = await res.json();
      showToast(d.error || 'Error', 'danger');
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div className="p-8 text-center text-slate-400">Company not found.</div>;

  const { company, purchaseItems = [], payments = [], deviceTypes = [] } = data;

  const filteredItems = purchaseItems.filter(p =>
    p.deviceId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Supplier Account Details</p>
            <h1 className="text-4xl font-semibold mt-1">{company.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{company.phone} · {company.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMask}
              className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              {maskData ? '👁️' : '🔒'}
            </button>
            <button onClick={() => nav('/companies')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Back to Companies
            </button>
          </div>
        </div>

        {/* Dynamic sub panels */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Add custom Device type for company */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold mb-1">Add Device Type</h3>
            <p className="text-xs text-slate-500 mb-4">Set up a base hardware type and purchase cost.</p>
            <form onSubmit={addDeviceType} className="space-y-4">
              <input required placeholder="Device Type Name (e.g. AIS140)" value={typeName} onChange={e => setTypeName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              <input required type="number" placeholder="Base Purchase Price (INR)" value={typePrice} onChange={e => setTypePrice(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              <button type="submit" className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Create Type
              </button>
            </form>
          </div>

          {/* Current Device Types List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Configured Device Types</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {deviceTypes.map(t => (
                <div key={t.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 flex justify-between items-center">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <span className="text-slate-500 text-xs font-mono">{fmt(t.basePrice)}</span>
                </div>
              ))}
              {deviceTypes.length === 0 && (
                <div className="sm:col-span-2 text-center py-6 text-xs text-slate-400">No device types added. Using company base price.</div>
              )}
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Purchased Devices Registry</h2>
            <input
              placeholder="Search devices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64"
            />
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Device IMEI (ID)</th>
                  <th className="px-6 py-4">Purchase Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Purchased</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map(p => (
                  <tr key={p.id || p.deviceId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">{p.deviceId}</td>
                    <td className="px-6 py-4">{fmt(p.purchasePrice)}</td>
                    <td className="px-6 py-4">
                      {/* Check device status from lookup or standard badges */}
                      <span className="rounded-full bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 px-3 py-1 text-xs font-semibold">
                        IN STOCK
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{fmtDate(p.purchasedAt)}</td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No purchases found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payments Table */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <h2 className="text-xl font-semibold">Payment Outflows</h2>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Amount Paid</th>
                  <th className="px-6 py-4">Date Recorded</th>
                  <th className="px-6 py-4">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{fmt(p.amount)}</td>
                    <td className="px-6 py-4 text-xs font-mono">{fmtDate(p.paymentDate)}</td>
                    <td className="px-6 py-4 font-semibold">
                      {p.receiptImage ? (
                        <a href={p.receiptImage} target="_blank" rel="noreferrer" className="text-slate-950 hover:underline dark:text-white font-semibold">
                          View Receipt
                        </a>
                      ) : 'None'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No payment records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// AGENTS PAGE
// ─────────────────────────────────────────────────────────────

function AgentsPage({ hasPerm, nav, onDetail, showToast, maskData, toggleMask, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  
  const [search, setSearch] = useState('');
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [loading, setLoading] = useState(true);

  // Tabs for action cards
  const [activeTab, setActiveTab] = useState('sale'); // 'sale' | 'agent' | 'payment'

  // Form States
  const [aName, setAName] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aShop, setAShop] = useState('');
  const [aPrices, setAPrices] = useState({}); // selling price for each company id

  const [sAgent, setSAgent] = useState('');
  const [sDevSearch, setSDevSearch] = useState('');
  const [sDevId, setSDevId] = useState('');
  const [sCost, setSCost] = useState(0);
  const [sPrice, setSPrice] = useState('');
  const [sDate, setSDate] = useState(today());
  const [sSaleType, setSSaleType] = useState('INSTALLED'); // INSTALLED | PARCELED
  const [sCustName, setSCustName] = useState('');
  const [sCustPhone, setSCustPhone] = useState('');
  const [sCarNo, setSCarNo] = useState('');
  const [sChassisNo, setSCassisNo] = useState('');
  const [sRemarks, setSRemarks] = useState('');

  const [pyAgent, setPyAgent] = useState('');
  const [pyAmount, setPyAmount] = useState('');
  const [pyDate, setPyDate] = useState(today());
  const [pyImage, setPyImage] = useState(null);
  const [pyMethod, setPyMethod] = useState('CASH');
  const [pyNote, setPyNote] = useState('');

  const [devDropdown, setDevDropdown] = useState([]);
  const [bulkCsvFile, setBulkCsvFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());

      const br = await fetch(`${API_URL}/agents/sale/batches`, { headers: getHeaders() });
      if (br.ok) {
        const bd = await br.json();
        setBatches(bd.batches || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const agents = data?.agents || [];
  const summaries = data?.summaries || [];
  const devices = data?.devices || [];
  const companies = data?.companies || [];

  const handleDevSearch = (val) => {
    setSDevSearch(val);
    setSDevId('');
    if (val.length > 0) {
      const stock = devices.filter(d => d.status === 'IN_STOCK');
      setDevDropdown(stock.filter(d =>
        d.id.toLowerCase().includes(val.toLowerCase()) ||
        d.serialNumber.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10));
    } else {
      setDevDropdown([]);
    }
  };

  const selectDev = (d) => {
    setSDevSearch(d.id);
    setSDevId(d.id);
    setSCost(d.purchasePrice);
    
    // Resolve selling price based on agent selling price setup for this company
    const selectedAgentObj = agents.find(a => a.id === sAgent);
    const resolvedPrice = selectedAgentObj?.defaultPrices?.[d.companyId] || d.purchasePrice;
    setSPrice(resolvedPrice);

    setDevDropdown([]);
  };

  // Submit agent
  const submitAgent = async (e) => {
    e.preventDefault();
    const payload = { name: aName, phone: aPhone, shopName: aShop };
    Object.keys(aPrices).forEach(cid => {
      payload[`salePrice_company_${cid}`] = Number(aPrices[cid]);
    });

    const res = await fetch(`${API_URL}/agents`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) { 
      showToast('Partner added successfully'); 
      setAName(''); setAPhone(''); setAShop(''); setAPrices({});
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error adding agent', 'danger'); 
    }
  };

  // Submit sale
  const submitSale = async (e) => {
    e.preventDefault();
    if (!sDevId) {
      showToast('Please select a valid device from the search dropdown', 'danger');
      return;
    }
    const res = await fetch(`${API_URL}/agents/sale`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ 
        agentId: sAgent, 
        deviceId: sDevId, 
        sellingPrice: Number(sPrice), 
        soldAt: sDate,
        saleType: sSaleType,
        customerName: sCustName,
        customerPhone: sCustPhone,
        carNumber: sCarNo,
        chassisNumber: sChassisNo,
        remarks: sRemarks
      }),
    });
    if (res.ok) { 
      showToast('Agent sale recorded successfully'); 
      setSAgent(''); setSDevSearch(''); setSDevId(''); setSCost(0); setSPrice(''); setSSaleType('INSTALLED');
      setSCustName(''); setSCustPhone(''); setSCarNo(''); setSCassisNo(''); setSRemarks('');
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error recording sale', 'danger'); 
    }
  };

  // Submit bulk CSV sale upload
  const submitBulkSale = async (e) => {
    e.preventDefault();
    if (!bulkCsvFile || !sAgent) {
      showToast('Please select a partner and upload a CSV file', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target.result;
      try {
        const res = await fetch(`${API_URL}/agents/sale/bulk`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ agentId: sAgent, csvText, saleType: sSaleType })
        });
        const d = await res.json();
        if (res.ok) {
          showToast(`Successfully uploaded ${d.count} sales!`);
          setBulkCsvFile(null);
          load();
        } else {
          showToast(d.error || 'Failed bulk upload', 'danger');
        }
      } catch {
        showToast('Server network error', 'danger');
      }
    };
    reader.readAsText(bulkCsvFile);
  };

  // Revert Partner Sale Batch
  const handleRevertSaleBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to revert this sales batch? Devices will be returned to stock.')) return;
    try {
      const res = await fetch(`${API_URL}/agents/sale/revert/${batchId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const d = await res.json();
      if (res.ok) {
        showToast('Sales batch successfully reverted!');
        load();
      } else {
        showToast(d.error || 'Failed to revert sales batch', 'danger');
      }
    } catch {
      showToast('Server network error', 'danger');
    }
  };

  // Submit payment
  const submitPayment = async (e) => {
    e.preventDefault();
    let receiptImage = '';
    if (pyImage) receiptImage = await fileToB64(pyImage);
    const res = await fetch(`${API_URL}/agents/payment`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ 
        agentId: pyAgent, 
        amount: Number(pyAmount), 
        paymentDate: pyDate, 
        receiptImage,
        paymentMethod: pyMethod,
        note: pyNote
      }),
    });
    if (res.ok) { 
      showToast('Payment from partner recorded'); 
      setPyAgent(''); setPyAmount(''); setPyDate(today()); setPyImage(null); setPyNote(''); setPyMethod('CASH');
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Error recording payment', 'danger'); 
    }
  };

  // Filter agent summaries
  const filteredSummaries = summaries.filter(s => {
    const matchSearch = s.agent.name.toLowerCase().includes(search.toLowerCase()) ||
      s.agent.shopName?.toLowerCase().includes(search.toLowerCase());
    const matchPending = !filterPendingOnly || s.pendingAmount > 0;
    const matchSelectedAgent = !selectedAgentId || s.agent.id === selectedAgentId;
    return matchSearch && matchPending && matchSelectedAgent;
  });

  const totalSold = filteredSummaries.reduce((sum, s) => sum + s.devicesSold, 0);
  const totalSales = filteredSummaries.reduce((sum, s) => sum + s.totalSales, 0);
  const totalReceived = filteredSummaries.reduce((sum, s) => sum + s.totalReceived, 0);
  const totalPending = filteredSummaries.reduce((sum, s) => sum + s.pendingAmount, 0);
  const totalProfit = filteredSummaries.reduce((sum, s) => sum + s.profitGenerated, 0);

  // Export agent performance CSV
  const handleExportPerformance = () => {
    const headers = ['Partner Name', 'Shop', 'Phone', 'Devices Sold', 'Total Sales', 'Total Received', 'Pending Balance', 'Profit Generated'];
    const rows = filteredSummaries.map(s => [
      s.agent.name,
      s.agent.shopName,
      s.agent.phone,
      s.devicesSold,
      s.totalSales,
      s.totalReceived,
      s.pendingAmount,
      maskData ? '••••' : s.profitGenerated
    ]);
    exportToCSV(headers, rows, `partner_performance_${today()}.csv`);
  };

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Partner ledger</p>
            <h1 className="text-4xl font-semibold">Partners</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage dealers, record device sales and payments, and review balances.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMask}
              className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              {maskData ? '👁️' : '🔒'}
            </button>
            <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Dashboard
            </button>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Registered Partners</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{agents.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Devices Sold</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{totalSold}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Revenue</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-2">{fmt(totalSales)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Outstanding Pending</p>
            <p className="text-3xl font-semibold text-red-600 dark:text-red-400 mt-2">{fmt(totalPending)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Net Profit</p>
            <p className="text-3xl font-semibold text-green-600 dark:text-green-400 mt-2">{fmt(totalProfit)}</p>
          </div>
        </div>

        {/* Action Panel Tab Selector */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
            <button 
              onClick={() => setActiveTab('sale')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'sale' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              Record Partner Sale
            </button>
            <button 
              onClick={() => setActiveTab('agent')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'agent' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              New Partner
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'payment' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              Record Payment
            </button>
          </div>

          {/* Tab Content forms */}
          {activeTab === 'sale' && hasPerm('AGENT_SALE') && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-semibold">Record Partner Sale</h3>
                <p className="text-sm text-slate-500">Assign stock devices to dealers and capture customer context.</p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {/* Single Form */}
                <form onSubmit={submitSale} className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Single Sale</h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Which Partner? *</label>
                    <select required value={sAgent} onChange={e => setSAgent(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                      <option value="">Select agent</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Device Sale Mode *</label>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setSSaleType('INSTALLED')}
                        className={`flex-1 rounded-xl py-3 text-sm font-semibold border ${sSaleType === 'INSTALLED' ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                      >
                        Installed
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSSaleType('PARCELED')}
                        className={`flex-1 rounded-xl py-3 text-sm font-semibold border ${sSaleType === 'PARCELED' ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                      >
                        Parceled Only
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Search Device (In Stock) *</label>
                    <input type="text" placeholder="Search device ID or serial"
                      value={sDevSearch} onChange={e => handleDevSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    {devDropdown.length > 0 && (
                      <div className="absolute z-20 w-full rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden mt-1 dark:border-slate-800 dark:bg-slate-900">
                        {devDropdown.map(d => (
                          <button key={d.id} type="button" onClick={() => selectDev(d)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-100 dark:border-slate-850">
                            IMEI: {d.id} (S/N: {d.serialNumber})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Cost Price (Auto-filled)</label>
                      <input type="number" placeholder="Cost Price" disabled value={sCost || ''}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm text-slate-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Selling Price *</label>
                      <input required type="number" placeholder="Selling Price" value={sPrice} onChange={e => setSPrice(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                    </div>
                  </div>

                  {sSaleType === 'INSTALLED' && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-4 bg-slate-50 dark:bg-slate-950 space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</h5>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input required placeholder="Customer Name" value={sCustName} onChange={e => setSCustName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-sm outline-none" />
                        <input required placeholder="Customer Phone" value={sCustPhone} onChange={e => setSCustPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-sm outline-none" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input required placeholder="Car Number" value={sCarNo} onChange={e => setSCarNo(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-sm outline-none" />
                        <input required placeholder="Chassis Number" value={sChassisNo} onChange={e => setSCassisNo(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-sm outline-none" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Sold Date *</label>
                    <input type="date" value={sDate} onChange={e => setSDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Remarks</label>
                    <input placeholder="Add details..." value={sRemarks} onChange={e => setSRemarks(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                    Record Sale
                  </button>
                </form>

                {/* Bulk Form */}
                <form onSubmit={submitBulkSale} className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8 pt-6 md:pt-0">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Bulk Sales Import</h4>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Partner *</label>
                    <select required value={sAgent} onChange={e => setSAgent(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                      <option value="">Select agent</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Import Mode *</label>
                    <select required value={sSaleType} onChange={e => setSSaleType(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                      <option value="INSTALLED">Installed Sales</option>
                      <option value="PARCELED">Parceled Sales</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Upload CSV File *</label>
                    <input type="file" required accept=".csv" onChange={e => setBulkCsvFile(e.target.files[0])}
                      className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Required CSV Columns:</p>
                    <p>• imei / deviceid / device id</p>
                    <p>• price / sellingprice</p>
                    <p>For Installed mode: customer, phone, car, chassis</p>
                  </div>
                  <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                    Upload CSV Sales
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'agent' && hasPerm('AGENT_CREATE') && (
            <form onSubmit={submitAgent} className="space-y-4 max-w-xl animate-fade-in">
              <h3 className="text-lg font-semibold">New Partner</h3>
              <p className="text-sm text-slate-500">Contact details and per-company default selling prices.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Partner Name *</label>
                  <input required placeholder="e.g. AJEET" value={aName} onChange={e => setAName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Phone Number *</label>
                  <input required placeholder="10 digit Mobile" value={aPhone} onChange={e => setAPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Shop / Location *</label>
                <input required placeholder="Shop Name / Address" value={aShop} onChange={e => setAShop(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-4 bg-slate-50 dark:bg-slate-950 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Per-Company Selling Prices</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {companies.map(c => (
                    <div key={c.id}>
                      <label className="text-xs text-slate-650 dark:text-slate-405 mb-1 block">{c.name} price</label>
                      <input 
                        type="number"
                        placeholder="Price"
                        value={aPrices[c.id] || ''}
                        onChange={e => setAPrices({...aPrices, [c.id]: e.target.value})}
                        className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Create Partner
              </button>
            </form>
          )}

          {activeTab === 'payment' && hasPerm('AGENT_PAYMENT') && (
            <form onSubmit={submitPayment} className="space-y-4 max-w-xl animate-fade-in">
              <h3 className="text-lg font-semibold">Record Agent Payment</h3>
              <p className="text-sm text-slate-500">Record payments received from partners.</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Select Partner *</label>
                <select required value={pyAgent} onChange={e => setPyAgent(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Amount (INR) *</label>
                  <input required type="number" placeholder="Amount" value={pyAmount} onChange={e => setPyAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Method *</label>
                  <select value={pyMethod} onChange={e => setPyMethod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400">
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK TRANSFER</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Payment Date *</label>
                  <input type="date" value={pyDate} onChange={e => setPyDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Receipt Receipt Image</label>
                  <input type="file" accept="image/*" onChange={e => setPyImage(e.target.files[0])}
                    className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Transaction Note</label>
                <input placeholder="Receipt reference..." value={pyNote} onChange={e => setPyNote(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Record Payment
              </button>
            </form>
          )}
        </div>

        {/* Bulk Sales batches uploads */}
        {batches.length > 0 && (
          <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Bulk Sale Upload History</h2>
              <p className="text-sm text-slate-500">Each CSV upload sale batch is saved. Revert returns all parceled/installed devices back to stock.</p>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Uploaded At</th>
                    <th className="px-6 py-4">Partner</th>
                    <th className="px-6 py-4">Sales Counts</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {batches.map(b => {
                    const agent = agents.find(a => a.id === b.agentId);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-300">
                        <td className="px-6 py-4 font-mono text-xs">{fmtDate(b.createdAt)}</td>
                        <td className="px-6 py-4 font-semibold">{agent?.name || 'Unknown'}</td>
                        <td className="px-6 py-4">{b.imported} (Installed: {b.installed}, Parceled: {b.parceled})</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            b.status === 'REVERTED' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {b.status !== 'REVERTED' && (
                            <button onClick={() => handleRevertSaleBatch(b.id)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition">
                              Revert
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Partner Performance Summary */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none transition">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Partner Performance</h2>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Choose a partner to review sales, collections, and pending balances.</p>
            </div>
            <button onClick={handleExportPerformance} className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Export Excel
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between font-semibold">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="pendingOnly"
                    checked={filterPendingOnly}
                    onChange={e => setFilterPendingOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 outline-none"
                  />
                  <label htmlFor="pendingOnly" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    Pending balances only
                  </label>
                </div>
                
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">All Partners</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <input
                placeholder="Search partner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-64"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Partner</th>
                    <th className="px-6 py-4">Devices Sold</th>
                    <th className="px-6 py-4">Total Sales</th>
                    <th className="px-6 py-4">Total Received</th>
                    <th className="px-6 py-4">Pending Balance</th>
                    <th className="px-6 py-4">Profit Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSummaries.map(s => (
                    <tr key={s.agent.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        <button
                          onClick={() => onDetail(s.agent.id)}
                          className="text-left text-slate-950 hover:underline dark:text-white"
                        >
                          {s.agent.name}
                        </button>
                        <div className="text-xs text-slate-400 font-normal mt-1">Shop: {s.agent.shopName} · Phone: {s.agent.phone}</div>
                      </td>
                      <td className="px-6 py-4 font-mono">{s.devicesSold}</td>
                      <td className="px-6 py-4">{fmt(s.totalSales)}</td>
                      <td className="px-6 py-4">{fmt(s.totalReceived)}</td>
                      <td className={`px-6 py-4 font-semibold ${s.pendingAmount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {fmt(s.pendingAmount)}
                      </td>
                      <td className="px-6 py-4 text-green-600 dark:text-green-400">{fmt(s.profitGenerated)}</td>
                    </tr>
                  ))}
                  {filteredSummaries.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No records matching search.</td></tr>
                  )}
                  {/* Totals row */}
                  {filteredSummaries.length > 0 && (
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                      <td className="px-6 py-4">Totals</td>
                      <td className="px-6 py-4 font-mono">{totalSold}</td>
                      <td className="px-6 py-4">{fmt(totalSales)}</td>
                      <td className="px-6 py-4">{fmt(totalReceived)}</td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400">{fmt(totalPending)}</td>
                      <td className="px-6 py-4 text-green-600 dark:text-green-400">{fmt(totalProfit)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// AGENT DETAIL PAGE
// ─────────────────────────────────────────────────────────────

function AgentDetailPage({ id, nav, hasPerm, showToast, maskData, toggleMask, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/${id}`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Loader />;
  if (!data) return <div className="p-8 text-center text-slate-400">Partner not found.</div>;

  const { agent, soldDevices = [], payments = [] } = data;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Partner Details</p>
            <h1 className="text-4xl font-semibold mt-1">{agent.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{agent.phone} · Shop: {agent.shopName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMask}
              className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              {maskData ? '👁️' : '🔒'}
            </button>
            <button onClick={() => nav('/agents')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Back to Partners
            </button>
          </div>
        </div>

        {/* Sales Table */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <h2 className="text-xl font-semibold">Sales History</h2>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Device IMEI</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Cost Price</th>
                  <th className="px-6 py-4">Selling Price</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {soldDevices.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">{s.deviceId}</td>
                    <td className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">{s.saleType}</td>
                    <td className="px-6 py-4 font-mono">{fmt(s.costPrice)}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{fmt(s.sellingPrice)}</td>
                    <td className="px-6 py-4 font-semibold">
                      {s.customerName ? (
                        <>
                          {s.customerName}
                          <div className="text-xs text-slate-450 font-normal">{s.customerPhone} · {s.carNumber}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{fmtDate(s.soldAt)}</td>
                  </tr>
                ))}
                {soldDevices.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No sale records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payments Table */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition">
          <h2 className="text-xl font-semibold">Payments Received</h2>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date Recorded</th>
                  <th className="px-6 py-4">Note</th>
                  <th className="px-6 py-4">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{fmt(p.amount)}</td>
                    <td className="px-6 py-4 text-xs font-semibold">{p.paymentMethod}</td>
                    <td className="px-6 py-4 text-xs font-mono">{fmtDate(p.paymentDate)}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{p.note || '—'}</td>
                    <td className="px-6 py-4 font-semibold">
                      {p.receiptImage ? (
                        <a href={p.receiptImage} target="_blank" rel="noreferrer" className="text-slate-950 hover:underline dark:text-white font-semibold">
                          View Receipt
                        </a>
                      ) : 'None'}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No payment history.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// DEVICES INVENTORY PAGE
// ─────────────────────────────────────────────────────────────

function DevicesPage({ user, hasPerm, nav, showToast, isDark, toggleTheme, maskData, toggleMask, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [selectedDevice, setSelectedDevice] = useState(null); // Detail modal

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/devices`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;

  const devices = data?.devices || [];
  const companies = data?.companies || [];
  const agents = data?.agents || [];
  const purchaseItems = data?.purchaseItems || [];
  const agentSaleItems = data?.agentSaleItems || [];
  const installations = data?.installations || [];

  const filtered = devices.filter(d => {
    const pi = purchaseItems.find(p => p.deviceId === d.id);
    const si = agentSaleItems.find(s => s.deviceId === d.id);
    const matchSearch = !search ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.currentOwner?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchCompany = !filterCompany || pi?.companyId === filterCompany;
    const matchAgent = !filterAgent || si?.agentId === filterAgent;

    return matchSearch && matchStatus && matchCompany && matchAgent;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Quick stats
  const totalCount = devices.length;
  const inStockCount = devices.filter(d => d.status === 'IN_STOCK').length;
  const withPartnerCount = devices.filter(d => d.status === 'SOLD_TO_AGENT').length;
  const installedCount = devices.filter(d => d.status === 'INSTALLED').length;

  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Delete device permanently from stock? This action is irreversible.')) return;
    try {
      const res = await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const d = await res.json();
      if (res.ok) {
        showToast('Device deleted successfully');
        setSelectedDevice(null);
        load();
      } else {
        showToast(d.error || 'Failed to delete device', 'danger');
      }
    } catch {
      showToast('Delete request failed', 'danger');
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Inventory Management</p>
            <h1 className="text-4xl font-semibold mt-1">Device Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">{totalCount} total tracked devices · {inStockCount} in stock · {withPartnerCount} with partner · {installedCount} installed</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
            >
              {isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            </button>
            <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Dashboard
            </button>
          </div>
        </div>

        {/* View Toggles & Status filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'IN_STOCK', 'SOLD_TO_AGENT', 'INSTALLED'].map(st => (
              <button 
                key={st}
                onClick={() => { setFilterStatus(st); setPage(1); }}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  filterStatus === st 
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All status' : st === 'IN_STOCK' ? 'In Stock' : st === 'SOLD_TO_AGENT' ? 'With Partner' : 'Installed'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('cards')}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${viewMode === 'cards' ? 'bg-slate-200 text-slate-950 dark:bg-slate-800 dark:text-white' : 'text-slate-400'}`}
            >
              Cards Grid
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${viewMode === 'table' ? 'bg-slate-200 text-slate-950 dark:bg-slate-800 dark:text-white' : 'text-slate-400'}`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Search Filter Panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">Search Query</label>
            <input 
              placeholder="IMEI, serial, customer..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">Supplier Company</label>
            <select 
              value={filterCompany}
              onChange={e => { setFilterCompany(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none"
            >
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-semibold block">Partner Dealer</label>
            <select 
              value={filterAgent}
              onChange={e => { setFilterAgent(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-sm outline-none"
            >
              <option value="">All Partners</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => { setSearch(''); setFilterStatus('ALL'); setFilterCompany(''); setFilterAgent(''); setPage(1); }}
              className="w-full rounded-xl border border-slate-350 bg-slate-100 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-850 py-2.5 text-xs font-semibold tracking-wider transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* View Mode content */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {paged.map(d => {
              const pi = purchaseItems.find(p => p.deviceId === d.id);
              const si = agentSaleItems.find(p => p.deviceId === d.id);
              const comp = companies.find(c => c.id === pi?.companyId);
              const agent = agents.find(c => c.id === si?.agentId);
              return (
                <div 
                  key={d.id} 
                  onClick={() => setSelectedDevice(d)}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/70 transition cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-950 flex-shrink-0">
                      {d.image ? (
                        <img src={d.image} alt={d.id} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-xs">NO IMG</div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400 font-bold font-mono">{d.id}</p>
                      <h2 className="text-lg font-semibold text-slate-950 dark:text-white leading-tight mt-1">{d.serialNumber || '—'}</h2>
                      <p className="text-xs text-slate-500 font-medium">Owner: {d.currentOwner || 'Company'}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-semibold uppercase ${
                        d.status === 'IN_STOCK' ? 'text-green-600' : d.status === 'SOLD_TO_AGENT' ? 'text-amber-600' : 'text-blue-600'
                      }`}>{d.status.replace(/_/g, ' ')}</span>
                    </div>
                    {comp && (
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{comp.name}</span>
                      </div>
                    )}
                    {agent && (
                      <div className="flex justify-between">
                        <span>Dealer:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{agent.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-2 mt-2 font-mono">
                      <span>Cost: {fmt(d.purchasePrice)}</span>
                      {si && <span>Sale: {fmt(si.sellingPrice)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Device ID (IMEI)</th>
                  <th className="px-6 py-4">Serial</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Dealer</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Cost Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map(d => {
                  const pi = purchaseItems.find(p => p.deviceId === d.id);
                  const si = agentSaleItems.find(p => p.deviceId === d.id);
                  const comp = companies.find(c => c.id === pi?.companyId);
                  const agent = agents.find(c => c.id === si?.agentId);
                  return (
                    <tr 
                      key={d.id} 
                      onClick={() => setSelectedDevice(d)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition cursor-pointer font-medium"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold">{d.id}</td>
                      <td className="px-6 py-4">{d.serialNumber}</td>
                      <td className="px-6 py-4 uppercase text-xs font-semibold tracking-wider">{d.status.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4">{comp?.name || '—'}</td>
                      <td className="px-6 py-4">{agent?.name || '—'}</td>
                      <td className="px-6 py-4 text-xs font-semibold">{d.currentOwner || 'Company'}</td>
                      <td className="px-6 py-4">{fmt(d.purchasePrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-slate-500 font-semibold pt-4">
            <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} devices</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 disabled:opacity-40 transition">Prev</button>
              <span className="px-3 py-2">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 disabled:opacity-40 transition">Next</button>
            </div>
          </div>
        )}

        {/* Device Detail Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 relative">
              <button 
                onClick={() => setSelectedDevice(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
              
              <h3 className="text-xl font-semibold border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Device Technical Registry</h3>
              
              <div className="grid gap-6 sm:grid-cols-2 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Device ID (IMEI)</span>
                    <span className="font-mono font-semibold text-slate-950 dark:text-white">{selectedDevice.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Serial Number</span>
                    <span className="font-semibold text-slate-950 dark:text-white">{selectedDevice.serialNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Status</span>
                    <span className="uppercase font-semibold text-xs tracking-wider text-slate-900 dark:text-white">{selectedDevice.status}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Current Owner / Location</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{selectedDevice.currentOwner || 'Company Stock'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Supplier Purchase Price</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">{fmt(selectedDevice.purchasePrice)}</span>
                  </div>
                  
                  {/* Lookup and display purchase detail */}
                  {(() => {
                    const pi = purchaseItems.find(p => p.deviceId === selectedDevice.id);
                    const comp = companies.find(c => c.id === pi?.companyId);
                    if (!pi) return null;
                    return (
                      <>
                        <div>
                          <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Supplier Company</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{comp?.name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Purchased Date</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono">{fmtDate(pi.purchasedAt)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Lookup and display agent sale details if sold */}
              {(() => {
                const si = agentSaleItems.find(s => s.deviceId === selectedDevice.id);
                const agentObj = agents.find(a => a.id === si?.agentId);
                const installObj = installations.find(i => i.deviceId === selectedDevice.id);
                if (!si) return null;
                return (
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Partner Sale & Customer Details</h4>
                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Dealer Partner</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{agentObj?.name || '—'} (Shop: {agentObj?.shopName})</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Dealer Selling Price</span>
                        <span className="font-semibold text-slate-900 dark:text-white font-mono">{fmt(si.sellingPrice)}</span>
                      </div>
                      {si.customerName && (
                        <div>
                          <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Customer Name</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{si.customerName} (Phone: {si.customerPhone})</span>
                        </div>
                      )}
                      {si.carNumber && (
                        <div>
                          <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Car / Chassis Number</span>
                          <span className="font-semibold text-slate-900 dark:text-white">Car: {si.carNumber} <br/>Chassis: {si.chassisNumber}</span>
                        </div>
                      )}
                      {installObj && (
                        <div>
                          <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Installation Registry Date</span>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono">{fmtDate(installObj.installedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                {user?.role === 'ADMIN' && selectedDevice.status === 'IN_STOCK' && (
                  <button 
                    onClick={() => handleDeleteDevice(selectedDevice.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-650 hover:bg-red-100 transition dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    Delete Device
                  </button>
                )}
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition ml-auto"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTALLATIONS PAGE
// ─────────────────────────────────────────────────────────────

function InstallationsPage({ hasPerm, nav, showToast, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Complete pending installations stepper states
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedDeviceSearch, setSelectedDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null); // the selected device object
  
  // Client forms
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [installedDate, setInstalledDate] = useState(today());

  const [devDropdown, setDevDropdown] = useState([]);

  // Pagination for pending list
  const [pendingPage, setPendingPage] = useState(1);
  const PENDING_PER_PAGE = 6;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/installations`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader />;

  const installations = data?.installations || [];
  const devices = data?.devices || [];
  const agents = data?.agents || [];
  const agentSaleItems = data?.agentSaleItems || [];

  // Filter device candidates for complete installation (sold to agent but not installed)
  const pendingCandidates = devices.filter(d => {
    if (d.status !== 'SOLD_TO_AGENT') return false;
    const saleItem = agentSaleItems.find(s => s.deviceId === d.id);
    if (!saleItem) return false;
    
    const matchAgent = !selectedAgentId || saleItem.agentId === selectedAgentId;
    const matchSearch = !selectedDeviceSearch || 
      d.id.toLowerCase().includes(selectedDeviceSearch.toLowerCase()) || 
      d.serialNumber.toLowerCase().includes(selectedDeviceSearch.toLowerCase());
    return matchAgent && matchSearch;
  });

  const totalPendingPages = Math.ceil(pendingCandidates.length / PENDING_PER_PAGE);
  const pagedPending = pendingCandidates.slice((pendingPage - 1) * PENDING_PER_PAGE, pendingPage * PENDING_PER_PAGE);

  const handleDeviceSelection = (d) => {
    setSelectedDevice(d);
    
    // Auto-prepopulate customer detail from the sale record if it exists!
    const saleItem = agentSaleItems.find(s => s.deviceId === d.id);
    if (saleItem) {
      setCustName(saleItem.customerName || '');
      setCustPhone(saleItem.customerPhone || '');
      setCarNumber(saleItem.carNumber || '');
      setChassisNumber(saleItem.chassisNumber || '');
    }
  };

  const handleRecordInstallation = async (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      showToast('Please pick a device from the pending installation list first.', 'danger');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/installations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          customerName: custName,
          customerPhone: custPhone,
          carNumber,
          chassisNumber,
          installedAt: installedDate
        })
      });
      const d = await res.json();
      if (res.ok) {
        showToast('Installation logged successfully! Device status changed to INSTALLED.');
        setSelectedDevice(null);
        setSelectedDeviceSearch('');
        setCustName(''); setCustPhone(''); setCarNumber(''); setChassisNumber(''); setInstalledDate(today());
        load();
      } else {
        showToast(d.error || 'Failed recording installation', 'danger');
      }
    } catch {
      showToast('Server network error', 'danger');
    }
  };

  // Filter final installation registry table
  const filteredInstallations = installations.filter(i => {
    const matchSearch = !search ||
      i.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      i.customerPhone?.includes(search) ||
      i.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
      i.carNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchAgent = !filterAgent || i.agentId === filterAgent;
    return matchSearch && matchAgent;
  });

  // Export installations sheet
  const handleExportInstallations = () => {
    const headers = ['Device IMEI', 'Customer Name', 'Customer Phone', 'Partner Dealer', 'Car Number', 'Chassis Number', 'Installed At'];
    const rows = filteredInstallations.map(i => {
      const partner = agents.find(a => a.id === i.agentId);
      return [
        i.deviceId,
        i.customerName,
        i.customerPhone,
        partner?.name || 'Unknown',
        i.carNumber,
        i.chassisNumber,
        new Date(i.installedAt).toLocaleDateString('en-IN')
      ];
    });
    exportToCSV(headers, rows, `installations_registry_${today()}.csv`);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Customer installations</p>
            <h1 className="text-4xl font-semibold">Installations</h1>
            <p className="text-sm text-slate-650 dark:text-slate-405 mt-1">Record and log devices marked as installed after a partner sale.</p>
          </div>
          <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
            Dashboard
          </button>
        </div>

        {/* Complete Pending installations Stepper */}
        {hasPerm('INSTALL') && (
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition grid gap-6 md:grid-cols-2">
            
            {/* Step 1: Pick Device */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold">1. Select Device from Pending ({pendingCandidates.length})</h3>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Step 1 of 2</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={selectedAgentId} onChange={e => { setSelectedAgentId(e.target.value); setPendingPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs outline-none">
                  <option value="">Filter by Partner</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input 
                  placeholder="Search IMEI or Serial..." 
                  value={selectedDeviceSearch}
                  onChange={e => { setSelectedDeviceSearch(e.target.value); setPendingPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2 text-xs outline-none"
                />
              </div>
              
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {pagedPending.map(d => {
                  const saleItem = agentSaleItems.find(s => s.deviceId === d.id);
                  const partner = agents.find(a => a.id === saleItem?.agentId);
                  return (
                    <button 
                      key={d.id}
                      type="button"
                      onClick={() => handleDeviceSelection(d)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-1 ${
                        selectedDevice?.id === d.id 
                          ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-md' 
                          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-mono font-semibold">{d.id}</span>
                        <span className="text-[10px] uppercase tracking-wider opacity-60">S/N: {d.serialNumber}</span>
                      </div>
                      <span className="text-xs font-semibold mt-1 opacity-95">Dealer Partner: {partner?.name || 'Unknown'}</span>
                    </button>
                  );
                })}
                {pagedPending.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">No pending installations found for filters.</div>
                )}
              </div>

              {/* Pagination for pending */}
              {totalPendingPages > 1 && (
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold border-t border-slate-250 dark:border-slate-800 pt-3">
                  <span>Showing {(pendingPage - 1) * PENDING_PER_PAGE + 1}–{Math.min(pendingPage * PENDING_PER_PAGE, pendingCandidates.length)} of {pendingCandidates.length}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage === 1} className="underline disabled:opacity-40">Prev</button>
                    <button type="button" onClick={() => setPendingPage(p => Math.min(totalPendingPages, p + 1))} disabled={pendingPage === totalPendingPages} className="underline disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Complete Details Form */}
            <form onSubmit={handleRecordInstallation} className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-6 pt-4 md:pt-0">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold">2. Complete Installation Details</h3>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Step 2 of 2</span>
              </div>
              
              {selectedDevice ? (
                <div className="bg-slate-100 dark:bg-slate-950 p-3.5 rounded-2xl text-xs font-mono space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">Active Device Selected:</p>
                  <p>IMEI: {selectedDevice.id}</p>
                  <p>Serial: {selectedDevice.serialNumber}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 p-4 rounded-2xl text-xs text-amber-800 dark:text-amber-400 font-medium">
                  Please pick an IMEI from the left list to enable the details form.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Customer Name *</label>
                  <input required placeholder="Name" disabled={!selectedDevice} value={custName} onChange={e => setCustName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2.5 text-xs outline-none disabled:opacity-60" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Customer Phone *</label>
                  <input required placeholder="Phone" disabled={!selectedDevice} value={custPhone} onChange={e => setCustPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2.5 text-xs outline-none disabled:opacity-60" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Car Number *</label>
                  <input required placeholder="e.g. UP15ET7631" disabled={!selectedDevice} value={carNumber} onChange={e => setCarNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2.5 text-xs outline-none disabled:opacity-60" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Chassis Number *</label>
                  <input required placeholder="Chassis No." disabled={!selectedDevice} value={chassisNumber} onChange={e => setChassisNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2.5 text-xs outline-none disabled:opacity-60" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Date Installed *</label>
                <input type="date" disabled={!selectedDevice} value={installedDate} onChange={e => setInstalledDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-3 py-2.5 text-xs outline-none disabled:opacity-60" />
              </div>
              <button 
                type="submit" 
                disabled={!selectedDevice}
                className="w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                Complete Pending Installation
              </button>
            </form>
          </section>
        )}

        {/* Installation Registry Database */}
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none transition">
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Installation Registry</h2>
              <p className="text-sm text-slate-650 dark:text-slate-405">Review, search, and export logged customer installation records.</p>
            </div>
            <button onClick={handleExportInstallations} className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Export Excel
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between font-semibold">
              <div className="flex flex-wrap items-center gap-4">
                <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="">All Partners</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{filteredInstallations.length} records matching</div>
              </div>
              <input
                placeholder="Search device, name, phone, car..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:w-64"
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Device IMEI</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Partner</th>
                    <th className="px-6 py-4">Car Number</th>
                    <th className="px-6 py-4">Installed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInstallations.map(inst => {
                    const agent = agents.find(a => a.id === inst.agentId);
                    return (
                      <tr key={inst.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-6 py-4 font-mono text-xs font-semibold">{inst.deviceId}</td>
                        <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{inst.customerName}</td>
                        <td className="px-6 py-4">{inst.customerPhone}</td>
                        <td className="px-6 py-4">{agent?.name || '—'}</td>
                        <td className="px-6 py-4 font-semibold">{inst.carNumber}</td>
                        <td className="px-6 py-4 text-xs font-mono">{fmtDate(inst.installedAt)}</td>
                      </tr>
                    );
                  })}
                  {filteredInstallations.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No installations registry log matches found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// REPORTS PAGE
// ─────────────────────────────────────────────────────────────

function ReportsPage({ hasPerm, nav, maskData, fmt, fmtDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today());
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (startDate) params.append('startDateStr', startDate);
      if (endDate) params.append('endDateStr', endDate);
      if (companyId) params.append('companyId', companyId);
      
      const res = await fetch(`${API_URL}/reports?${params}`, { headers: getHeaders() });
      if (res.ok) setData(await res.json());

      const cr = await fetch(`${API_URL}/companies`, { headers: getHeaders() });
      if (cr.ok) {
        const cd = await cr.json();
        setCompanies(cd.companies || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [range, companyId]);

  const setRangePreset = (preset) => {
    setRange(preset);
    // Auto populate dates based on preset
    const now = new Date();
    if (preset === 'today') {
      setStartDate(today());
      setEndDate(today());
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.setDate(diff));
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today());
    } else if (preset === 'this_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(today());
    }
  };

  if (loading) return <Loader />;

  const { today: t, week: w, month: m, rangeTotals = {}, recentInstallations = [], dailyTrends = [] } = data || {};

  const handleExportInstallations = () => {
    const headers = ['Device', 'Customer Name', 'Customer Phone', 'Car Number', 'Installed At'];
    const rows = recentInstallations.map(i => [
      i.deviceId,
      i.customerName,
      i.customerPhone,
      i.carNumber,
      new Date(i.installedAt).toLocaleDateString('en-IN')
    ]);
    exportToCSV(headers, rows, `installations_report_${today()}.csv`);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Reports Dashboard</p>
            <h1 className="text-4xl font-semibold">Business Summary</h1>
            <p className="text-sm text-slate-500 mt-1">Lump sum metrics, range trends, daily snapshots, and CSV ledger reports.</p>
          </div>
          <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
            Dashboard
          </button>
        </div>

        {/* Snapshot columns */}
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition">
          <h2 className="text-xl font-semibold mb-4">Report Periods</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: 'Today', data: t },
              { label: 'This Week', data: w },
              { label: 'This Month', data: m },
            ].map(({ label, data: pd }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-6 space-y-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 font-bold">{label}</p>
                <div className="space-y-2 font-semibold">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Purchases:</span>
                    <span>{fmt(pd?.purchases)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sales:</span>
                    <span>{fmt(pd?.sales)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span className="text-slate-500">Profit:</span>
                    <span className="text-green-600 dark:text-green-400">{fmt(pd?.profit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Installations:</span>
                    <span className="font-mono">{pd?.installations || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Collections summary */}
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition">
          <h2 className="text-xl font-semibold mb-4">Collections & Outstanding Balances</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block">Company Payments Paid</span>
              <span className="text-2xl font-bold text-slate-950 dark:text-white block mt-2">{fmt(rangeTotals.companyCollections)}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block">Partner Collections Received</span>
              <span className="text-2xl font-bold text-slate-950 dark:text-white block mt-2">{fmt(rangeTotals.agentCollections)}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block">Pending Supplier Dues</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400 block mt-2">{fmt(rangeTotals.pendingCompany)}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-150 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase block">Partner Outstanding Due</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400 block mt-2">{fmt(rangeTotals.pendingPartners)}</span>
            </div>
          </div>
        </section>

        {/* Custom Trends Chart (HTML + CSS line/bar representation) */}
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Daily Trends</h2>
            <p className="text-xs text-slate-500">Visualization of purchases, sales, and profits across selected range.</p>
          </div>

          <div className="flex flex-wrap gap-2 py-2">
            {['today', 'this_week', 'this_month'].map(pr => (
              <button 
                key={pr} 
                onClick={() => setRangePreset(pr)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  range === pr 
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {pr.replace(/_/g, ' ')}
              </button>
            ))}
            
            <select value={companyId} onChange={e => setCompanyId(e.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-1 text-xs outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ml-auto">
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Simple visual bar chart using SVG or styled divs */}
          <div className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-6 flex items-end gap-2 overflow-x-auto relative">
            {dailyTrends.map((t, idx) => {
              const maxVal = Math.max(...dailyTrends.map(d => Math.max(d.sales, d.purchases, 100)));
              const salesHeight = (t.sales / maxVal) * 150;
              const purchHeight = (t.purchases / maxVal) * 150;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-[36px] group relative cursor-pointer">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-lg p-2 text-[10px] hidden group-hover:block z-10 whitespace-nowrap shadow-md">
                    <p className="font-semibold">{t.date}</p>
                    <p>Sales: {fmt(t.sales)}</p>
                    <p>Cost: {fmt(t.purchases)}</p>
                    <p>Profit: {fmt(t.profit)}</p>
                  </div>
                  
                  <div className="flex gap-1 items-end h-[160px] border-b border-slate-200 dark:border-slate-800 w-full justify-center">
                    {/* Purchases Bar */}
                    <div style={{ height: `${purchHeight}px` }} className="w-2.5 bg-red-400 rounded-t-sm" />
                    {/* Sales Bar */}
                    <div style={{ height: `${salesHeight}px` }} className="w-2.5 bg-green-500 rounded-t-sm" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono font-bold">{t.date}</span>
                </div>
              );
            })}
            {dailyTrends.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-semibold">No trend data available for current date range filters.</div>
            )}
          </div>
          <div className="flex gap-4 text-xs font-semibold justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-400 rounded-sm" />
              <span>Purchases (Cost)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Dealer Sales (Revenue)</span>
            </div>
          </div>
        </section>

        {/* Recent installations report list */}
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
            <div>
              <h2 className="text-xl font-semibold">Range Installations</h2>
              <p className="text-sm text-slate-500">{recentInstallations.length} total logged installations within period.</p>
            </div>
            {recentInstallations.length > 0 && (
              <button onClick={handleExportInstallations} className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                Export Installations
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Device ID (IMEI)</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Car Number</th>
                  <th className="px-6 py-4">Log Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInstallations.map((inst, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">{inst.deviceId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{inst.customerName}</td>
                    <td className="px-6 py-4">{inst.customerPhone}</td>
                    <td className="px-6 py-4 font-semibold">{inst.carNumber}</td>
                    <td className="px-6 py-4 text-xs font-mono">{fmtDate(inst.installedAt)}</td>
                  </tr>
                ))}
                {recentInstallations.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No installations recorded during this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────────────────────

const ALL_PERMS = [
  'COMPANY', 'COMPANY_CREATE', 'COMPANY_DEVICE_ADD', 'COMPANY_PAYMENT', 'COMPANY_DETAILS',
  'AGENTS', 'AGENT_CREATE', 'AGENT_SALE', 'AGENT_PAYMENT', 'AGENT_DETAILS',
  'INVENTORY', 'INSTALL', 'USERS', 'REPORTS'
];

function UsersPage({ user, hasPerm, nav, showToast }) {
  const [users, setUsers] = useState([]);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [uName, setUName] = useState('');
  const [uMobile, setUMobile] = useState('');
  const [uPwd, setUPwd] = useState('');
  const [uRole, setURole] = useState('USER');
  const [uPerms, setUPerms] = useState([]);

  // Edit user access states
  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState('USER');
  const [editPerms, setEditPerms] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setIsFirstTime(data.isFirstTimeSetup || false);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePerm = (p) => {
    setUPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleEditPerm = (p) => {
    setEditPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const submitUser = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST', 
      headers: getHeaders(),
      body: JSON.stringify({ name: uName, mobile: uMobile, password: uPwd, role: uRole, permissions: uPerms }),
    });
    if (res.ok) { 
      showToast('User created successfully'); 
      setUName(''); setUMobile(''); setUPwd(''); setURole('USER'); setUPerms([]); 
      load(); 
    } else { 
      const d = await res.json(); 
      showToast(d.error || 'Failed adding user', 'danger'); 
    }
  };

  const toggleDisable = async (uid, disabled) => {
    if (!window.confirm(`Are you sure you want to ${disabled ? 'enable' : 'disable'} this account?`)) return;
    try {
      const res = await fetch(`${API_URL}/users/${uid}/disable`, {
        method: 'PUT', 
        headers: getHeaders(),
        body: JSON.stringify({ disabled: !disabled }),
      });
      if (res.ok) { 
        showToast(!disabled ? 'User disabled' : 'User enabled'); 
        load(); 
      } else { 
        const d = await res.json(); 
        showToast(d.error || 'Request failed', 'danger'); 
      }
    } catch {
      showToast('Server update error', 'danger');
    }
  };

  const startEditAccess = (u) => {
    setEditingUserId(u.id);
    setEditRole(u.role);
    setEditPerms(u.permissions || []);
  };

  const saveEditedAccess = async (e, uid) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/users/${uid}/role`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ role: editRole, permissions: editPerms })
      });
      if (res.ok) {
        showToast('Permissions updated successfully!');
        setEditingUserId(null);
        load();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed update', 'danger');
      }
    } catch {
      showToast('Server error during update', 'danger');
    }
  };

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 px-6 py-8 transition-colors text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">User Access Control</p>
            <h1 className="text-4xl font-semibold">User Management</h1>
          </div>
          {!isFirstTime && (
            <button onClick={() => nav('/')} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
              Dashboard
            </button>
          )}
        </div>

        {/* Create Form */}
        {(isFirstTime || hasPerm('USERS')) && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition">
            <h2 className="text-2xl font-semibold">{isFirstTime ? 'Create First Admin Account' : 'Create New User'}</h2>
            <p className="mt-2 text-sm text-slate-650 dark:text-slate-400">Setup profiles with custom permission sets. Blocked accounts cannot sign in.</p>
            
            <form onSubmit={submitUser} className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</span>
                  <input required placeholder="Name" value={uName} onChange={e => setUName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-900 dark:text-white" />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number *</span>
                  <input required placeholder="Used as username login" value={uMobile} onChange={e => setUMobile(e.target.value)}
                    className="w-full rounded-2xl border border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-900 dark:text-white" />
                </label>
                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password *</span>
                  <input required type="password" placeholder="Min 6 characters" value={uPwd} onChange={e => setUPwd(e.target.value)}
                    className="w-full rounded-2xl border border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-900 dark:text-white" />
                </label>
              </div>

              {!isFirstTime && (
                <div className="grid gap-6 md:grid-cols-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">System Role</label>
                    <select value={uRole} onChange={e => setURole(e.target.value)}
                      className="rounded-2xl border border-slate-350 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-900">
                      <option value="USER">Standard User</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  
                  {uRole === 'USER' && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Permission Set</label>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_PERMS.map(p => (
                          <label key={p} className="inline-flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={uPerms.includes(p)} 
                              onChange={() => togglePerm(p)}
                              className="h-4 w-4 rounded border-slate-350 text-slate-900"
                            />
                            {p.replace(/_/g, ' ')}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition">
                {isFirstTime ? 'Create Administrator Account' : 'Save User Account'}
              </button>
            </form>
          </section>
        )}

        {/* Directory List */}
        {!isFirstTime && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Users Directory</h2>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 font-semibold font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-xs tracking-wider uppercase">Permissions</th>
                    <th className="px-6 py-4">Status</th>
                    {hasPerm('USERS') && <th className="px-6 py-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">{u.name}</td>
                      <td className="px-6 py-4 font-mono">{u.mobile}</td>
                      <td className="px-6 py-4 font-semibold">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm truncate text-xs font-semibold text-slate-500">
                        {u.role === 'ADMIN' ? 'All Permissions Granted' : (u.permissions || []).join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                          u.disabled ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                        }`}>
                          {u.disabled ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      {hasPerm('USERS') && (
                        <td className="px-6 py-4 space-y-2">
                          {u.id !== user?.id && editingUserId !== u.id && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startEditAccess(u)}
                                className="rounded-full border border-slate-300 px-3.5 py-1 text-xs font-semibold hover:bg-slate-100 transition"
                              >
                                Edit Access
                              </button>
                              <button 
                                onClick={() => toggleDisable(u.id, u.disabled)}
                                className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition ${
                                  u.disabled 
                                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-950 dark:bg-green-950/20' 
                                    : 'border-red-350 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-950 dark:bg-red-950/20'
                                }`}
                              >
                                {u.disabled ? 'Unblock' : 'Block'}
                              </button>
                            </div>
                          )}

                          {editingUserId === u.id && (
                            <form onSubmit={(e) => saveEditedAccess(e, u.id)} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 space-y-4 animate-fade-in max-w-sm">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">System Role</label>
                                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                                  className="w-full rounded-xl border border-slate-350 bg-white px-3 py-2 text-xs outline-none">
                                  <option value="USER">USER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              </div>
                              {editRole === 'USER' && (
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">Permissions</label>
                                  <div className="grid gap-1.5 grid-cols-2">
                                    {ALL_PERMS.map(p => (
                                      <label key={p} className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-tight cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          checked={editPerms.includes(p)}
                                          onChange={() => toggleEditPerm(p)}
                                          className="h-3.5 w-3.5 rounded border-slate-355"
                                        />
                                        {p.replace(/_/g, ' ')}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <button type="submit" className="rounded-full bg-slate-950 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800">
                                  Save Set
                                </button>
                                <button type="button" onClick={() => setEditingUserId(null)} className="rounded-full border border-slate-350 px-4 py-2 text-xs font-semibold hover:bg-slate-100">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-950 rounded-full animate-spin dark:border-slate-800 dark:border-t-white" />
    </div>
  );
}
