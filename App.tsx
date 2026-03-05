
import React, { useState, useEffect } from 'react';
import { Role, View, Staff, InventoryItem, Invoice, Candidate, JobSheet, AttendanceRecord, PurchaseOrder, StockTransfer, Vendor, AuthUser, LoginCredentials } from './types.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import HRModule from './components/HRModule.tsx';
import InventoryModule from './components/InventoryModule.tsx';
import AccountsModule from './components/AccountsModule.tsx';
import BranchModule from './components/BranchModule.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import LandingPage from './components/LandingPage.tsx';
import { Shield, ShieldCheck, Lock, ArrowRight, Sparkles, Zap, Building2, UserCircle, Box, Receipt, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { MOCK_STAFF, MOCK_INVENTORY, MOCK_INVOICES, MOCK_CANDIDATES, MOCK_JOB_SHEETS, MOCK_PURCHASES, MOCK_VENDORS, PERMISSIONS_MATRIX } from './constants.ts';
import { authService } from './src/services/authService.ts';
import { dbService } from './services/db.ts';

const Login: React.FC<{ onLogin: (user: AuthUser) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('MASTER_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const roleMenuRef = React.useRef<HTMLDivElement>(null);

  const roleLabel = (r: Role) => {
    if (r === 'MASTER_ADMIN') return 'Head Office';
    if (r === 'STORE_MANAGER') return 'Store Manager';
    if (r === 'INVENTORY_LEAD') return 'Inventory Lead';
    return 'Sales Head';
  };

  const toggleRoleMenu = () => {
    const itemCount = 4;
    const itemHeight = 40;
    const desired = itemCount * itemHeight;
    const rect = roleMenuRef.current?.getBoundingClientRect();
    const below = rect ? (window.innerHeight - rect.bottom) : 0;
    setOpenUp(below < desired + 24);
    setShowRoleMenu(prev => !prev);
  };

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!roleMenuRef.current) return;
      if (!roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoleMenu(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // resolve stores for store-scoped login
  const getStores = (): Array<{ id: string; name: string }> => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('crm_stores') : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: '1', name: 'Downtown Branch' },
      { id: '2', name: 'Northgate Branch' },
      { id: '3', name: 'Head Office' }
    ];
  };
  const [storeId, setStoreId] = useState<string>('');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const base = authService.apiBase ? authService.apiBase() : '';
        const url = base ? `${base}/stores` : '/stores';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (mounted) setStores(data);
          return;
        }
      } catch {}
      if (mounted) setStores(getStores());
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const creds: LoginCredentials = { email, password, role, storeId: role === 'MASTER_ADMIN' ? undefined : (storeId || undefined) };
      const user = await authService.login(creds);
      onLogin(user);
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f65b13]/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f65b13]/10 blur-[120px] rounded-full -ml-20 -mb-20"></div>
      
      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <button 
            onClick={onBack}
            className="mb-8 text-[10px] font-black text-[#f65b13] uppercase tracking-widest hover:underline flex items-center mx-auto"
          >
            <ArrowRight className="w-3 h-3 rotate-180 mr-2" />
            Back to Home
          </button>
          <div className="inline-flex p-4 bg-gradient-to-br from-[#f65b13] to-[#ff844b] rounded-[2rem] shadow-2xl shadow-[#f65b13]/20 mb-6 ring-1 ring-white/20">
            <Zap className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">TECH WIZARDRY</h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.3em]">Command Ecosystem v3.0</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white text-center">Access Portal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="p-2 bg-[#f65b13]/20 rounded-xl mr-4">
                  <UserCircle className="w-5 h-5 text-[#f65b13]" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tech2wizard.com" 
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                  required
                />
              </div>
              {role !== 'MASTER_ADMIN' && (
                <div className="flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="p-2 bg-[#f65b13]/20 rounded-xl mr-4">
                    <Building2 className="w-5 h-5 text-[#f65b13]" />
                  </div>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  >
                    <option value="" disabled>Select Branch</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="p-2 bg-[#f65b13]/20 rounded-xl mr-4">
                  <Lock className="w-5 h-5 text-[#f65b13]" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-slate-500 hover:text-[#f65b13] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div ref={roleMenuRef} className="relative flex items-center p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="p-2 bg-[#f65b13]/20 rounded-xl mr-4">
                  <ShieldCheck className="w-5 h-5 text-[#f65b13]" />
                </div>
                <button 
                  type="button"
                  onClick={toggleRoleMenu}
                  className="flex-1 text-left bg-transparent text-white text-sm focus:outline-none truncate"
                >
                  {roleLabel(role)}
                </button>
                <ChevronDown className="w-4 h-4 text-white/70" />
                {showRoleMenu && (
                  <div className={`absolute left-0 right-0 ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'} bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto`}>
                    {(['MASTER_ADMIN','STORE_MANAGER','INVENTORY_LEAD','SALES_HEAD'] as Role[]).map(r => (
                      <button 
                        type="button" 
                        key={r}
                        onClick={() => { setRole(r); setShowRoleMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-800"
                      >
                        {roleLabel(r)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
              <div className="flex items-center justify-between">
                <button 
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 text-[10px] font-black text-[#f65b13] uppercase tracking-widest hover:underline flex items-center"
                >
                  <ArrowRight className="w-3 h-3 rotate-180 mr-2" />
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#f65b13] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading ? 'Authorizing…' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC<{ initialView?: View }> = ({ initialView }) => {
  const getSaved = (key: string, fallback: any) => {
    if (typeof window === 'undefined') return fallback;
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;
    try { return JSON.parse(saved); } catch { return saved; }
  };

  const [role, setRole] = useState<Role | null>(() => {
    const existing = authService.getCurrentUser();
    if (existing) return existing.role;
    if (typeof window === 'undefined') return null;
    const r = window.localStorage.getItem('crm_user_role');
    return r ? (r as Role) : null;
  });

  const [showLogin, setShowLogin] = useState(false);
  
  const [currentView, setCurrentView] = useState<View>(() => {
    if (initialView) return initialView;
    if (typeof window === 'undefined') return 'DASHBOARD';
    const saved = window.localStorage.getItem('crm_current_view') as View;
    return saved || 'DASHBOARD';
  });

  const DEV = process.env.NODE_ENV !== 'production';
  const [staffList, setStaffList] = useState<Staff[]>(() => getSaved('crm_staff', DEV ? MOCK_STAFF : []));
  const [candidates, setCandidates] = useState<Candidate[]>(() => getSaved('crm_candidates', DEV ? MOCK_CANDIDATES : []));
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getSaved('crm_inventory', DEV ? MOCK_INVENTORY : []));
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(() => getSaved('crm_inventory_categories', DEV ? ['Parts', 'Accessories', 'Tools', 'Devices', 'General'] : []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => getSaved('crm_invoices', DEV ? MOCK_INVOICES : []));
  const [jobSheets, setJobSheets] = useState<JobSheet[]>(() => getSaved('crm_jobsheets', DEV ? MOCK_JOB_SHEETS : []));
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(() => getSaved('crm_attendance', []));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => getSaved('crm_purchases', DEV ? MOCK_PURCHASES : []));
  const [vendors, setVendors] = useState<Vendor[]>(() => getSaved('crm_vendors', DEV ? MOCK_VENDORS : []));
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => getSaved('crm_transfers', DEV ? [
    { id: 'TRF-001', itemId: '101', itemName: 'iPhone 15 Screen', sku: 'PRT-IP15-SCR', quantity: 20, source: 'Head Office', destination: 'Downtown Branch', status: 'In-Transit', initiatedBy: 'MASTER_ADMIN', date: '2023-11-20' },
    { id: 'TRF-002', itemId: '102', itemName: 'Samsung S24 Battery', sku: 'PRT-S24-BAT', quantity: 15, source: 'Head Office', destination: 'Northgate Branch', status: 'Pending', initiatedBy: 'MASTER_ADMIN', date: '2023-11-22' }
  ] : []));
  const [returnLogs, setReturnLogs] = useState(() => getSaved('crm_returns', DEV ? [
    { id: 'RET-001', customerName: 'Sameer Khan', itemName: 'iPhone 15 Screen', sku: 'PRT-IP15-SCR', date: '2023-11-20', reason: 'Defective Digitizer', status: 'Processed', actionTaken: 'Replacement' },
    { id: 'RET-002', customerName: 'Anita Desai', itemName: 'USB-C Cable', sku: 'ACC-USBC-2M', date: '2023-11-22', reason: 'Wrong Length Ordered', status: 'Pending', actionTaken: 'Refund' }
  ] : []));
  const [stores, setStores] = useState(() => getSaved('crm_stores', DEV ? [
    { id: '1', name: 'Downtown Branch', address: '123 Main St, Cityville', phone: '(555) 123-4567', gst: 'GST-001', manager: 'Alice Johnson', active: true },
    { id: '2', name: 'Northgate Branch', address: '456 North Ave, Uptown', phone: '(555) 987-6543', gst: 'GST-002', manager: 'Open Position', active: true },
    { id: '3', name: 'Head Office', address: '789 Corporate Way, Tech Park', phone: '(555) 555-0100', gst: 'GST-HQ-01', manager: 'Admin', active: true },
  ] : []));
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const notifySuccess = (msg: string = 'Saved successfully') => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1500);
  };

  useEffect(() => {
    if (role) localStorage.setItem('crm_user_role', role);
    else localStorage.removeItem('crm_user_role');
  }, [role]);

  useEffect(() => {
    (async () => {
      await dbService.init();
      const [
        dbStaff,
        dbCandidates,
        dbInventory,
        dbInvoices,
        dbJobSheets,
        dbAttendance,
        dbPurchases,
        dbVendors,
        dbStores,
        dbTransfers,
        dbReturns
      ] = await Promise.all([
        dbService.getAll<Staff>('staff'),
        dbService.getAll<Candidate>('candidates'),
        dbService.getAll<InventoryItem>('inventory'),
        dbService.getAll<Invoice>('invoices'),
        dbService.getAll<JobSheet>('jobSheets'),
        dbService.getAll<AttendanceRecord>('attendance'),
        dbService.getAll<PurchaseOrder>('purchases'),
        dbService.getAll<Vendor>('vendors'),
        dbService.getAll<any>('stores'),
        dbService.getAll<StockTransfer>('stockTransfers'),
        dbService.getAll<any>('returnLogs')
      ]);
      if (dbStaff.length) setStaffList(dbStaff);
      if (dbCandidates.length) setCandidates(dbCandidates);
      if (dbInventory.length) setInventoryItems(dbInventory);
      if (dbInvoices.length) setInvoices(dbInvoices);
      if (dbJobSheets.length) setJobSheets(dbJobSheets);
      if (dbAttendance.length) setAttendanceData(dbAttendance);
      if (dbPurchases.length) setPurchaseOrders(dbPurchases);
      if (dbVendors.length) setVendors(dbVendors);
      if (dbStores.length) setStores(dbStores);
      if (dbTransfers.length) setStockTransfers(dbTransfers);
      if (dbReturns.length) setReturnLogs(dbReturns);
      setSyncEnabled(true);
    })();
  }, []);

  useEffect(() => { localStorage.setItem('crm_current_view', currentView); }, [currentView]);
  useEffect(() => localStorage.setItem('crm_staff', JSON.stringify(staffList)), [staffList]);
  useEffect(() => localStorage.setItem('crm_candidates', JSON.stringify(candidates)), [candidates]);
  useEffect(() => localStorage.setItem('crm_inventory', JSON.stringify(inventoryItems)), [inventoryItems]);
  useEffect(() => localStorage.setItem('crm_inventory_categories', JSON.stringify(inventoryCategories)), [inventoryCategories]);
  useEffect(() => localStorage.setItem('crm_invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('crm_jobsheets', JSON.stringify(jobSheets)), [jobSheets]);
  useEffect(() => localStorage.setItem('crm_attendance', JSON.stringify(attendanceData)), [attendanceData]);
  useEffect(() => localStorage.setItem('crm_purchases', JSON.stringify(purchaseOrders)), [purchaseOrders]);
  useEffect(() => localStorage.setItem('crm_vendors', JSON.stringify(vendors)), [vendors]);
  useEffect(() => localStorage.setItem('crm_stores', JSON.stringify(stores)), [stores]);
  useEffect(() => localStorage.setItem('crm_returns', JSON.stringify(returnLogs)), [returnLogs]);
  useEffect(() => localStorage.setItem('crm_transfers', JSON.stringify(stockTransfers)), [stockTransfers]);

  useEffect(() => { if (syncEnabled) dbService.putMany('staff', staffList); }, [staffList, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('candidates', candidates); }, [candidates, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('inventory', inventoryItems); }, [inventoryItems, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('invoices', invoices); }, [invoices, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('jobSheets', jobSheets); }, [jobSheets, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('attendance', attendanceData); }, [attendanceData, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('purchases', purchaseOrders); }, [purchaseOrders, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('vendors', vendors); }, [vendors, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('stores', stores); }, [stores, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('stockTransfers', stockTransfers); }, [stockTransfers, syncEnabled]);
  useEffect(() => { if (syncEnabled) dbService.putMany('returnLogs', returnLogs); }, [returnLogs, syncEnabled]);

  const handleLogin = (user: AuthUser) => {
    setRole(user.role);
    setShowLogin(false);
    if (!localStorage.getItem('crm_current_view')) {
      setCurrentView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    setRole(null);
    authService.logout();
    localStorage.removeItem('crm_user_role');
    localStorage.removeItem('crm_current_view');
    setCurrentView('DASHBOARD');
  };

  if (!role) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  const renderContent = () => {
    if (!role) return null;
    
    const permissions = PERMISSIONS_MATRIX[role] || { views: [] };
    const hasAccess = (view: View) => {
      if (permissions.all) return true;
      return permissions.views.includes(view);
    };

    if (!hasAccess(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="p-6 bg-rose-50 text-rose-500 rounded-[2rem] mb-6">
            <Shield className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Access Restricted</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
            Your current security clearance (Level: {role.replace('_', ' ')}) does not permit access to this module.
          </p>
          <button 
            onClick={() => setCurrentView('DASHBOARD')}
            className="px-8 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    const commonInventoryProps = { 
      role, 
      items: inventoryItems, 
      setItems: setInventoryItems,
      categories: inventoryCategories,
      setCategories: setInventoryCategories,
      staffList,
      returnLogs,
      setReturnLogs,
      stockTransfers,
      setStockTransfers,
      stores,
      vendors,
      setVendors,
      notifySuccess
    };
    const commonHRProps = { role, staffList, setStaffList, candidates, setCandidates, attendanceData, setAttendanceData, notifySuccess };
    const commonAccountsProps = { 
      role, 
      invoices, 
      setInvoices, 
      jobSheets, 
      setJobSheets, 
      staffList, 
      setStaffList,
      stores, 
      setStores,
      onViewChange: setCurrentView, 
      purchaseOrders, 
      setPurchaseOrders,
      inventoryItems,
      setInventoryItems,
      notifySuccess
    };
    const commonBranchProps = { role, stores, setStores, staffList, setStaffList, notifySuccess };

    switch (currentView) {
      case 'DASHBOARD': return <Dashboard role={role} invoices={invoices} />;
      case 'HR_ATTENDANCE': return <HRModule {...commonHRProps} view="ATTENDANCE" />;
      case 'HR_TIMING': return <HRModule {...commonHRProps} view="TIMING" />;
      case 'HR_STORE': return <HRModule {...commonHRProps} view="STAFF" />;
      case 'HR_CANDIDATES': return <HRModule {...commonHRProps} view="CANDIDATES" />;
      case 'HR_ONBOARDING': return <HRModule {...commonHRProps} view="ONBOARDING" />;
      case 'HR_STORE_ATTENDANCE': return <HRModule {...commonHRProps} view="STORE_ATTENDANCE" />;
      case 'HR_MAIN': return <HRModule {...commonHRProps} view="STAFF" />;
      case 'INVENTORY_MANAGEMENT': return <InventoryModule {...commonInventoryProps} view="INVENTORY_MANAGEMENT" />;
      case 'INVENTORY_CATEGORIES': return <InventoryModule {...commonInventoryProps} view="INVENTORY_CATEGORIES" />;
      case 'INVENTORY_STOCK_CONTROL': return <InventoryModule {...commonInventoryProps} view="INVENTORY_STOCK_CONTROL" />;
      case 'INVENTORY_VENDOR': return <InventoryModule {...commonInventoryProps} view="INVENTORY_VENDOR" />;
      case 'INVENTORY_TRANSFER': return <InventoryModule {...commonInventoryProps} view="INVENTORY_TRANSFER" />;
      case 'INVENTORY_STORE_STOCK': return <InventoryModule {...commonInventoryProps} view="INVENTORY_STORE_STOCK" />;
      case 'INVENTORY_PARTS_USAGE': return <InventoryModule {...commonInventoryProps} view="INVENTORY_PARTS_USAGE" />;
      case 'INVENTORY_TOOLS_TRACKING': return <InventoryModule {...commonInventoryProps} view="INVENTORY_TOOLS_TRACKING" />;
      case 'INVENTORY_RETURN_LOGS': return <InventoryModule {...commonInventoryProps} view="INVENTORY_RETURN_LOGS" />;
      case 'INVENTORY_MAIN': return <InventoryModule {...commonInventoryProps} view="INVENTORY_MAIN" />;
      case 'ACCOUNTS': return <AccountsModule {...commonAccountsProps} view="ACCOUNTS" />;
      case 'ACCOUNTS_JOB_SHEET': return <AccountsModule {...commonAccountsProps} view="ACCOUNTS_JOB_SHEET" />;
      case 'ACCOUNTS_CREATE_INVOICE': return <AccountsModule {...commonAccountsProps} view="ACCOUNTS_CREATE_INVOICE" />;
      case 'ACCOUNTS_SYNC': return <AccountsModule {...commonAccountsProps} view="ACCOUNTS_SYNC" />;
      case 'FINANCE_SALES': return <AccountsModule {...commonAccountsProps} view="FINANCE_SALES" />;
      case 'FINANCE_PURCHASES': return <AccountsModule {...commonAccountsProps} view="FINANCE_PURCHASES" />;
      case 'MANAGE_BRANCH_DETAILS': return <BranchModule {...commonBranchProps} view="MANAGE_BRANCH_DETAILS" />;
      case 'MANAGE_BRANCH_STAFF': return <BranchModule {...commonBranchProps} view="MANAGE_BRANCH_STAFF" />;
      case 'MANAGE_BRANCH_ACCESS': return <BranchModule {...commonBranchProps} view="MANAGE_BRANCH_ACCESS" />;
      case 'SETTINGS': return <SettingsModule role={role} notifySuccess={notifySuccess} />;
      default: return <Dashboard role={role} invoices={invoices} />;
    }
  };

  return (
    <Layout currentRole={role} currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout}>
      {renderContent()}
      {toast && (
        <div className="fixed right-6 bottom-6 z-[100]">
          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-black uppercase tracking-widest">
            {toast}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
