
import React, { useState, useRef, useEffect } from 'react';
import { Role, View } from '../types.ts';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Store, 
  CreditCard, 
  LogOut, 
  Menu,
  ShieldCheck,
  Shield,
  ChevronDown,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShoppingCart,
  Wrench,
  RotateCcw,
  Layers,
  ClipboardList,
  Receipt,
  ArrowRightLeft,
  Plus,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { PERMISSIONS_MATRIX } from '../constants.ts';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: Role;
  currentView: View;
  onChangeView: (view: View) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  view?: View;
  subItems?: MenuItem[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentRole, currentView, onChangeView, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId) 
        : [...prev, menuId]
    );
  };

  const getMenuItems = (): MenuItem[] => {
    const permissions = PERMISSIONS_MATRIX[currentRole] || { views: [] };
    const hasAccess = (view?: View) => {
      if (permissions.all) return true;
      if (!view) return true; // Groups might not have a view
      return permissions.views.includes(view);
    };

    const dashboard: MenuItem = { 
      id: 'DASHBOARD', 
      label: currentRole === 'MASTER_ADMIN' ? 'Dashboard' : 'Portal Dashboard', 
      icon: LayoutDashboard,
      view: 'DASHBOARD'
    };

    const hrMenu: MenuItem = {
      id: 'HR_GROUP',
      label: 'HR Management',
      icon: Users,
      subItems: ([
        { id: 'HR_ATTENDANCE', label: 'Attendance System', view: 'HR_ATTENDANCE' },
        { id: 'HR_TIMING', label: 'Attendance Timing', view: 'HR_TIMING', icon: Clock },
        { id: 'HR_STORE', label: 'Staff Roster', view: 'HR_STORE' },
        { id: 'HR_CANDIDATES', label: 'Candidates', view: 'HR_CANDIDATES' },
        { id: 'HR_ONBOARDING', label: 'Onboarding', view: 'HR_ONBOARDING' },
        { id: 'HR_STORE_ATTENDANCE', label: 'Store Attendance', view: 'HR_STORE_ATTENDANCE' },
      ] as MenuItem[]).filter(item => hasAccess(item.view))
    };

    const inventoryMenu: MenuItem = {
      id: 'INVENTORY_GROUP',
      label: 'Inventory Control',
      icon: Package,
      subItems: ([
        { id: 'INV_MGMT', label: 'Inventory Overview', view: 'INVENTORY_MANAGEMENT' },
        { id: 'INV_CATS', label: 'Categories', view: 'INVENTORY_CATEGORIES' },
        { id: 'INV_STOCK', label: 'Stock Alerts', view: 'INVENTORY_STOCK_CONTROL' },
        { id: 'INV_UPLOADS', label: 'Stock Uploads & Logs', view: 'INVENTORY_UPLOADS', icon: FileText },
        { id: 'INV_VENDOR', label: 'Vendor Management', view: 'INVENTORY_VENDOR' },
        { id: 'INV_TRANSFER', label: 'Transfer Stock', view: 'INVENTORY_TRANSFER' },
        { id: 'INV_STORE_STOCK', label: 'Store Stock', view: 'INVENTORY_STORE_STOCK' },
        { id: 'INV_PARTS', label: 'Parts Usage', view: 'INVENTORY_PARTS_USAGE' },
        { id: 'INV_TOOLS', label: 'Tools Tracking', view: 'INVENTORY_TOOLS_TRACKING' },
        { id: 'INV_RETURNS', label: 'Returns Logs', view: 'INVENTORY_RETURN_LOGS' },
        { id: 'INV_STORE_MAIN', label: 'Stock Levels', view: 'INVENTORY_MAIN' },
      ] as MenuItem[]).filter(item => hasAccess(item.view))
    };

    const accountsMenu: MenuItem = {
      id: 'ACCOUNTS_GROUP',
      label: 'Accounts & Finance',
      icon: CreditCard,
      subItems: ([
        { id: 'FIN_SALES', label: 'Sales Analytics', view: 'FINANCE_SALES', icon: TrendingUp },
        { id: 'FIN_PURCHASES', label: 'Purchase Orders', view: 'FINANCE_PURCHASES', icon: ShoppingCart },
        { id: 'ACC_JOB_SHEET', label: 'Job Sheets', view: 'ACCOUNTS_JOB_SHEET' },
        { id: 'ACC_CREATE', label: 'Create Invoice', view: 'ACCOUNTS_CREATE_INVOICE' },
        { id: 'ACC_SYNC', label: 'Data Sync', view: 'ACCOUNTS_SYNC' },
        { id: 'ACC_MAIN_STORE', label: 'Invoices', view: 'ACCOUNTS', icon: Receipt },
      ] as MenuItem[]).filter(item => hasAccess(item.view))
    };

    const branchMenu: MenuItem = {
      id: 'MANAGE_BRANCH_GROUP',
      label: 'Branch Operations',
      icon: Store,
      subItems: ([
        { id: 'BRANCH_DETAILS', label: 'Store Details', view: 'MANAGE_BRANCH_DETAILS' },
        { id: 'BRANCH_STAFF', label: 'Staff Assignment', view: 'MANAGE_BRANCH_STAFF' },
        { id: 'BRANCH_ACCESS', label: 'Access Control', view: 'MANAGE_BRANCH_ACCESS' },
      ] as MenuItem[]).filter(item => hasAccess(item.view))
    };

    const items = [dashboard, hrMenu, inventoryMenu, accountsMenu, branchMenu];

    // Filter out groups with no accessible sub-items and no direct view
    return items.filter(item => {
      if (item.view && hasAccess(item.view)) return true;
      if (item.subItems && item.subItems.length > 0) return true;
      return false;
    });
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isActive = item.view === currentView || (hasSubItems && item.subItems?.some(sub => sub.view === currentView || sub.subItems?.some(deepSub => deepSub.view === currentView)));
    const isExactActive = item.view === currentView;
    const paddingClass = depth === 0 ? 'px-4' : depth === 1 ? 'pl-12 pr-4' : 'pl-16 pr-4';
    const treeLineLeft = depth === 1 ? 'left-[26px]' : 'left-[30px]';

    return (
      <div key={item.id} className="relative">
        {depth > 0 && (
           <div className={`absolute ${treeLineLeft} top-0 bottom-0 w-px bg-slate-800 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-40'}`}></div>
        )}
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleMenu(item.id);
            } else if (item.view) {
              onChangeView(item.view);
              setIsMobileMenuOpen(false);
            }
          }}
          className={`
            group w-full flex items-center justify-between py-3 my-1 rounded-lg transition-all duration-300 ease-out text-sm relative overflow-hidden
            ${paddingClass}
            ${
                isExactActive && !hasSubItems
                ? 'bg-[#f65b13] text-white shadow-md shadow-[#f65b13]/20' 
                : isActive && hasSubItems 
                    ? 'text-[#f65b13]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          {isExactActive && !hasSubItems && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-l"></div>
          )}
          <div className={`flex items-center transition-transform duration-300 ${!hasSubItems && 'group-hover:translate-x-1'}`}>
            {item.icon && (
               <div className={`mr-3 transition-colors duration-300 ${isActive ? 'text-[#f65b13]' : 'text-slate-500 group-hover:text-white'}`}>
                 <item.icon className={`w-5 h-5 ${isExactActive ? 'text-white' : ''}`} />
               </div>
            )}
            {!item.icon && depth > 0 && (
               <div className={`
                 w-1.5 h-1.5 rounded-full mr-3 transition-all duration-300
                 ${isExactActive ? 'bg-white scale-125' : 'bg-slate-600 group-hover:bg-slate-400'}
               `} />
            )}
            <span className={`${isExactActive ? 'font-semibold' : 'font-medium'} tracking-wide`}>{item.label}</span>
          </div>
          {hasSubItems && (
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#f65b13]' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </div>
          )}
        </button>
        {hasSubItems && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-1 pb-2">
              {item.subItems?.map(subItem => renderMenuItem(subItem, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-72 bg-[#000000] text-white shadow-2xl z-20 border-r border-slate-800/60">
        <div className="px-6 py-6 border-b border-slate-800/60">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-[#f65b13] to-[#ff844b] rounded-xl shadow-lg shadow-[#f65b13]/20 ring-1 ring-white/10">
                    {currentRole === 'MASTER_ADMIN' ? <ShieldCheck className="w-6 h-6 text-white" /> : <Shield className="w-6 h-6 text-white" />}
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white leading-tight uppercase tracking-tighter">Tech Wizardry</h1>
                    <p className="text-[10px] font-medium text-[#f65b13] tracking-wider uppercase mt-0.5 font-black">
                        {currentRole === 'MASTER_ADMIN' ? 'Head Office' : 'Store Portal'}
                    </p>
                </div>
            </div>
            <div className="relative group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-[#f65b13] transition-colors" />
                <input type="text" placeholder="Search modules..." className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[#f65b13]/50 focus:ring-1 focus:ring-[#f65b13]/50 focus:bg-slate-900 transition-all shadow-inner"/>
            </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-1">
          <div className="px-2 mb-2 flex items-center justify-between">
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] font-black">Main Menu</span>
          </div>
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
        <div className="p-4 bg-[#080c17] border-t border-slate-800/60">
          <div onClick={() => onChangeView('SETTINGS')} className="flex items-center p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-[#f65b13]/40 hover:bg-slate-800 transition-all cursor-pointer group shadow-sm">
            <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f65b13] to-[#ff844b] flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {currentRole === 'MASTER_ADMIN' ? 'HQ' : 'SM'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#000000] rounded-full"></div>
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                  {currentRole.replace('_', ' ')}
                </p>
                <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 font-bold uppercase">
                  {currentRole === 'MASTER_ADMIN' ? 'Root Node' : 'Branch Node'}
                </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="p-1.5 text-slate-500 hover:text-[#f65b13] hover:bg-orange-50/10 rounded-lg transition-colors ml-1" title="Sign Out">
                <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              Developed by <a href="https://www.digitaladwords.co.in/" target="_blank" rel="noopener noreferrer" className="text-[#f65b13] hover:underline">Digital AdWords</a>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Header - Shared Mobile & Tablet */}
        <header className="flex md:hidden items-center justify-between bg-[#000000] text-white p-4 shadow-lg z-30 border-b border-slate-800">
          <div className="flex items-center space-x-2">
             <div className="p-1.5 bg-[#f65b13] rounded-lg">{currentRole === 'MASTER_ADMIN' ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}</div>
             <span className="font-bold text-lg tracking-tight uppercase tracking-tighter">Tech Wizardry</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-slate-800/80 rounded-lg hover:bg-slate-700 transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-[#000000] shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-[#f65b13] rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
                  <span className="font-bold text-lg uppercase">Menu</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map(item => renderMenuItem(item))}
                <div className="mt-8 pt-8 border-t border-slate-800">
                  <div className="flex items-center p-3 mb-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-[#f65b13] flex items-center justify-center text-white text-xs font-bold">
                      {currentRole === 'MASTER_ADMIN' ? 'HQ' : 'SM'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-white">
                        {currentRole.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">System Access</p>
                    </div>
                  </div>
                  <button onClick={onLogout} className="w-full flex items-center justify-center px-4 py-3 text-[#f65b13] bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition-all font-bold uppercase tracking-widest text-xs border border-[#f65b13]/20">
                    <LogOut className="w-5 h-5 mr-3" /> Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
            {/* Desktop Stats Header */}
            <div className="max-w-7xl mx-auto mb-6 md:mb-8 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
                      Protocol: {currentRole === 'MASTER_ADMIN' ? 'Root Administrator' : currentRole.replace('_', ' ')}
                    </h2>
                    <p className="text-[10px] md:text-sm text-slate-500 mt-1 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                 </div>
                 <div className="flex items-center space-x-2 md:space-x-4">
                     <div className="relative" ref={notificationRef}>
                        <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2 md:p-2.5 bg-white border rounded-xl text-slate-500 hover:text-[#f65b13] hover:border-[#f65b13]/20 hover:shadow-md transition-all ${showNotifications ? 'border-[#f65b13]/20 text-[#f65b13] ring-2 ring-[#f65b13]/5' : 'border-slate-200'}`}>
                            <Bell className="w-4 h-4 md:w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#f65b13] rounded-full border-2 border-white animate-pulse"></span>
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight">System Notifications</h3>
                                    <span className="text-[10px] bg-[#f65b13]/10 text-[#f65b13] px-2 py-0.5 rounded-full font-black uppercase">3 Active</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer">
                                        <div className="flex items-start">
                                            <div className="mt-0.5 p-1 bg-orange-50 rounded-full text-[#f65b13] mr-3"><AlertCircle className="w-3 h-3" /></div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Low Stock Alert</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Samsung Batteries below threshold</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold">10 mins ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-2 border-t border-slate-100 text-center">
                                    <button className="text-xs font-black text-[#f65b13] hover:text-[#000000] uppercase tracking-widest transition-colors">View Logs</button>
                                </div>
                            </div>
                        )}
                     </div>
                     <button onClick={() => onChangeView('SETTINGS')} className={`p-2 md:p-2.5 border rounded-xl text-slate-500 hover:text-[#f65b13] hover:border-[#f65b13]/20 hover:shadow-md transition-all ${currentView === 'SETTINGS' ? 'bg-orange-50 border-[#f65b13]/20 text-[#f65b13]' : 'bg-white border-slate-200'}`}><Settings className="w-4 h-4 md:w-5 h-5" /></button>
                 </div>
            </div>
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
