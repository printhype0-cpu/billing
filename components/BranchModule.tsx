import React, { useState, useMemo } from 'react';
import { Role, Staff } from '../types.ts';
import { 
  Building2, MapPin, Save, Users, ShieldAlert, ToggleLeft, ToggleRight, 
  X, Pencil, ArrowRightLeft, UserCircle, ChevronRight, UserMinus, Plus,
  Phone, Receipt, Trash2, ShieldCheck, Lock, Eye, EyeOff, Settings, Check,
  ChevronLeft, LayoutGrid, ClipboardList, Zap, Database, CreditCard, Box,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface BranchModuleProps {
  role: Role;
  stores: any[];
  setStores: React.Dispatch<React.SetStateAction<any[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  view: 'MANAGE_BRANCH_DETAILS' | 'MANAGE_BRANCH_STAFF' | 'MANAGE_BRANCH_ACCESS';
}

// Enhanced Permission Structures
interface ModulePermission {
  id: string;
  label: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  approve: boolean;
}

interface RoleAccess {
  roleId: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  permissions: Record<string, ModulePermission>; // Module Key -> Permissions
}

const BranchModule: React.FC<BranchModuleProps> = ({ role, stores, setStores, staffList, setStaffList, view }) => {
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', gst: '' });
  const [reassigningStaffId, setReassigningStaffId] = useState<string | null>(null);

  // State for Access Control Configuration
  const [configuringRole, setConfiguringRole] = useState<RoleAccess | null>(null);
  
  const defaultPermissions = (moduleId: string, label: string): ModulePermission => ({
    id: moduleId,
    label,
    read: false,
    write: false,
    delete: false,
    approve: false
  });

  const [roleAccessList, setRoleAccessList] = useState<RoleAccess[]>([
    { 
      roleId: 'store_manager', 
      name: 'Store Manager', 
      description: 'Operational access restricted to assigned retail branch data.', 
      icon: UserCircle, 
      color: 'text-[#f65b13]',
      permissions: {
        inventory: { ...defaultPermissions('inventory', 'Inventory Control'), read: true, write: true, approve: true },
        hr: { ...defaultPermissions('hr', 'Staff Management'), read: true, write: true },
        finance: { ...defaultPermissions('finance', 'Financial Data'), read: true },
        settings: { ...defaultPermissions('settings', 'System Settings'), read: true }
      } 
    },
    { 
      roleId: 'inventory_lead', 
      name: 'Inventory Lead', 
      description: 'Read/Write access for stock movement and vendor relations.', 
      icon: Box, 
      color: 'text-amber-600',
      permissions: {
        inventory: { ...defaultPermissions('inventory', 'Inventory Control'), read: true, write: true, delete: true, approve: true },
        hr: defaultPermissions('hr', 'Staff Management'),
        finance: { ...defaultPermissions('finance', 'Financial Data'), read: true },
        settings: defaultPermissions('settings', 'System Settings')
      }
    },
    { 
      roleId: 'sales_head', 
      name: 'Sales Head', 
      description: 'Oversee billing cycles and point of sale operations.', 
      icon: Receipt, 
      color: 'text-blue-600',
      permissions: {
        inventory: { ...defaultPermissions('inventory', 'Inventory Control'), read: true },
        hr: defaultPermissions('hr', 'Staff Management'),
        finance: { ...defaultPermissions('finance', 'Financial Data'), read: true, write: true, approve: true },
        settings: defaultPermissions('settings', 'System Settings')
      }
    }
  ]);

  // Derived Performance Data for Chart
  const branchPerformanceData = useMemo(() => {
    return stores.map(store => {
      // Mock revenue generation based on store ID hash or similar, just for visualization
      const mockRevenue = Math.floor(Math.random() * 400000) + 150000; 
      const staffCount = staffList.filter(s => s.store === store.name).length;
      return {
        name: store.name.replace(' Branch', '').replace('Head Office', 'HQ'), // Short name
        fullName: store.name,
        revenue: mockRevenue,
        staff: staffCount,
        active: store.active
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [stores, staffList]);

  // Floating staff are those not assigned to any listed store name
  const floatingStaff = staffList.filter(s => !stores.some(st => st.name === s.store));

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingStore) {
        setStores(prev => prev.map(s => s.id === editingStore.id ? { ...s, ...formData } : s));
        setEditingStore(null);
    } else {
        const newStore = { 
          id: Date.now().toString(), 
          ...formData, 
          active: true, 
          manager: 'Unassigned' 
        };
        setStores(prev => [...prev, newStore]);
    }
    setFormData({ name: '', address: '', phone: '', gst: '' });
    setShowAddModal(false);
  };

  const toggleStatus = (id: string) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteStore = (id: string) => {
    if (window.confirm("Are you sure? Removing a branch will move its assigned staff to the Floating Pool.")) {
        setStores(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleReassignStaff = (staffId: string, newStoreName: string | null) => {
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, store: newStoreName || 'Unassigned' } : s));
    setReassigningStaffId(null);
  };

  const togglePermission = (moduleId: string, type: keyof ModulePermission) => {
    if (!configuringRole) return;

    setConfiguringRole(prev => {
        if (!prev) return null;
        const modulePerms = prev.permissions[moduleId];
        // Cannot approve if you can't read
        if (type === 'read' && modulePerms.read === true) {
             return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: { ...modulePerms, read: false, write: false, delete: false, approve: false }
                }
             };
        }
        // If enabling write/delete/approve, ensure read is true
        let newReadState = modulePerms.read;
        if (type !== 'read' && !modulePerms[type]) {
            newReadState = true;
        }

        return {
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: {
                    ...modulePerms,
                    read: newReadState,
                    [type]: !modulePerms[type]
                }
            }
        };
    });
  };

  const saveRoleConfiguration = () => {
      if (!configuringRole) return;
      setRoleAccessList(prev => prev.map(r => r.roleId === configuringRole.roleId ? configuringRole : r));
      setConfiguringRole(null);
  };

  // --- BRANCH DETAILS VIEW ---
  if (view === 'MANAGE_BRANCH_DETAILS') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
           <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Retail Network</h3>
              <p className="text-sm text-slate-500">Manage global store locations and identification data</p>
           </div>
           <button 
             onClick={() => { setFormData({ name: '', address: '', phone: '', gst: '' }); setEditingStore(null); setShowAddModal(true); }} 
             className="flex items-center space-x-2 bg-[#f65b13] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] transition-all active:scale-95 text-sm uppercase tracking-widest"
           >
             <Plus className="w-4 h-4" />
             <span>Add New Branch</span>
           </button>
        </div>

        {/* Performance Chart Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-lg font-black text-slate-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-[#f65b13]" />
                        Network Performance Metrics
                    </h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Monthly Revenue Comparison</p>
                </div>
            </div>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                            tickFormatter={(value) => `₹${value/1000}k`} 
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-800">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{data.fullName}</p>
                                            <p className="text-2xl font-black mb-1">₹{data.revenue.toLocaleString()}</p>
                                            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
                                                <Users className="w-3 h-3" />
                                                <span>{data.staff} Active Staff</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar 
                            dataKey="revenue" 
                            radius={[6, 6, 0, 0]} 
                            barSize={40}
                            isAnimationActive={false} // Disable animation to prevent rendering issues in some React versions
                        >
                            {branchPerformanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.active ? '#f65b13' : '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {stores.map(store => (
             <div key={store.id} className={`bg-white rounded-3xl border transition-all overflow-hidden group ${store.active ? 'border-slate-100 shadow-sm hover:shadow-xl hover:border-[#f65b13]/20' : 'border-slate-200 opacity-75 grayscale'}`}>
                <div className="p-6">
                   <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-2xl ${store.active ? 'bg-[#f65b13]/5 text-[#f65b13]' : 'bg-slate-100 text-slate-400'}`}>
                         <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex items-center space-x-1">
                         <button 
                           onClick={() => toggleStatus(store.id)} 
                           title={store.active ? "Deactivate Branch" : "Activate Branch"}
                           className={`p-2 rounded-xl transition-colors ${store.active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                         >
                            {store.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                         </button>
                         <button 
                           onClick={() => { setEditingStore(store); setFormData({ name: store.name, address: store.address, phone: store.phone, gst: store.gst }); setShowAddModal(true); }}
                           className="p-2 text-slate-400 hover:text-[#f65b13] hover:bg-orange-50 rounded-xl transition-all"
                         >
                            <Pencil className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDeleteStore(store.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                   
                   <h4 className="text-xl font-black text-slate-900 mb-1">{store.name}</h4>
                   <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span className="truncate">{store.address.split(',')[1] || 'Main District'}</span>
                   </div>

                   <div className="space-y-3 pt-6 border-t border-slate-50">
                      <div className="flex items-center text-sm text-slate-600">
                         <MapPin className="w-4 h-4 mr-3 text-slate-300 shrink-0" />
                         <span className="line-clamp-1 font-medium">{store.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                         <Phone className="w-4 h-4 mr-3 text-slate-300 shrink-0" />
                         <span className="font-medium">{store.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                         <Receipt className="w-4 h-4 mr-3 text-slate-300 shrink-0" />
                         <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100">{store.gst}</span>
                      </div>
                   </div>
                </div>
                <div className={`px-6 py-4 flex justify-between items-center ${store.active ? 'bg-orange-50/30' : 'bg-slate-50'}`}>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Status</span>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${store.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {store.active ? 'Operational' : 'Suspended'}
                   </span>
                </div>
             </div>
           ))}
        </div>

        {/* Add/Edit Store Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm transition-all" onClick={() => setShowAddModal(false)}>
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{editingStore ? 'Edit Branch Entity' : 'Register New Branch'}</h3>
                   <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-10 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Branch Nomenclature</label>
                      <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. South Hub" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
                      <textarea className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold min-h-[100px] bg-white" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full street address..." />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
                          <input type="tel" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GST / Tax ID</label>
                          <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} placeholder="GST-XXXX" />
                      </div>
                   </div>
                   <button onClick={handleSave} className="w-full py-4 bg-[#f65b13] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all mt-4">
                      {editingStore ? 'Update Branch Data' : 'Initialize New Node'}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- STAFF MANAGEMENT VIEW ---
  if (view === 'MANAGE_BRANCH_STAFF') {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-6">Staff Allocation</h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-5">Employee</th>
                            <th className="px-8 py-5">Current Branch</th>
                            <th className="px-8 py-5 text-right">Reassignment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {staffList.map(staff => (
                            <tr key={staff.id} className="hover:bg-slate-50/50">
                                <td className="px-8 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500">{staff.name.charAt(0)}</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{staff.name}</div>
                                            <div className="text-xs text-slate-500">{staff.position}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{staff.store}</span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    {reassigningStaffId === staff.id ? (
                                        <div className="flex items-center justify-end space-x-2">
                                            <select 
                                                className="p-2 border border-slate-200 rounded-lg text-xs font-bold"
                                                onChange={(e) => handleReassignStaff(staff.id, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select Branch...</option>
                                                {stores.filter(s => s.active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                <option value="Head Office">Head Office</option>
                                            </select>
                                            <button onClick={() => setReassigningStaffId(null)} className="p-2 text-slate-400"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setReassigningStaffId(staff.id)} className="text-xs font-black text-[#f65b13] hover:underline uppercase tracking-widest">
                                            Transfer
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  }

  // --- ACCESS CONTROL VIEW ---
  if (view === 'MANAGE_BRANCH_ACCESS') {
      return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Access Matrix</h3>
                    <p className="text-sm text-slate-500">Define operational privileges per role. Root Administrator has implicit full access.</p>
                 </div>
                 {role === 'MASTER_ADMIN' && (
                    <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center space-x-2 text-xs font-bold text-slate-600 border border-slate-200">
                        <ShieldCheck className="w-4 h-4 text-[#f65b13]" />
                        <span>Your Level: Root Administrator (Unrestricted)</span>
                    </div>
                 )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {roleAccessList.map(roleItem => (
                     <div key={roleItem.roleId} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 relative group overflow-hidden hover:shadow-xl transition-all">
                         <div className={`p-4 rounded-3xl w-fit mb-6 ${roleItem.color.replace('text-', 'bg-')}/10 ${roleItem.color} group-hover:scale-110 transition-transform`}>
                             <roleItem.icon className="w-8 h-8" />
                         </div>
                         <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{roleItem.name}</h4>
                         <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed h-10">{roleItem.description}</p>
                         
                         <div className="space-y-4 pt-6 border-t border-slate-50 mb-8">
                             {Object.entries(roleItem.permissions).map(([key, perm]: [string, ModulePermission]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{perm.label}</span>
                                    <div className="flex space-x-1">
                                        {perm.read && <div className="w-2 h-2 rounded-full bg-emerald-400" title="Read"></div>}
                                        {perm.write && <div className="w-2 h-2 rounded-full bg-blue-400" title="Write"></div>}
                                        {perm.delete && <div className="w-2 h-2 rounded-full bg-rose-400" title="Delete"></div>}
                                        {!perm.read && <span className="text-[9px] text-slate-300 uppercase font-bold">No Access</span>}
                                    </div>
                                </div>
                             ))}
                         </div>
                         
                         <button 
                           onClick={() => setConfiguringRole(roleItem)}
                           className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f65b13] transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                         >
                           Configure Access
                         </button>
                     </div>
                 ))}
             </div>

             {/* Permission Configuration Modal */}
             {configuringRole && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm transition-all" onClick={() => setConfiguringRole(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-2xl ${configuringRole.color.replace('text-', 'bg-')}/10 ${configuringRole.color}`}>
                                    <configuringRole.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Configure: {configuringRole.name}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission Matrix</p>
                                </div>
                            </div>
                            <button onClick={() => setConfiguringRole(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(configuringRole.permissions).map(([moduleId, perm]: [string, ModulePermission]) => (
                                    <div key={moduleId} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#f65b13]/10 transition-colors">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{perm.label}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Control access level for {perm.label.toLowerCase()} module components.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {[
                                                { id: 'read', label: 'View Only', icon: Eye, color: 'text-emerald-600' },
                                                { id: 'write', label: 'Edit/Create', icon: Pencil, color: 'text-blue-600' },
                                                { id: 'delete', label: 'Delete', icon: Trash2, color: 'text-rose-600' },
                                                { id: 'approve', label: 'Approve', icon: Check, color: 'text-amber-600' }
                                            ].map((action) => {
                                                const isActive = (perm as any)[action.id];
                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => togglePermission(moduleId, action.id as keyof ModulePermission)}
                                                        className={`
                                                            flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all
                                                            ${isActive 
                                                                ? `bg-white border-${action.color.split('-')[1]}-200 shadow-md` 
                                                                : 'bg-slate-100 border-transparent opacity-60 hover:opacity-100'
                                                            }
                                                        `}
                                                    >
                                                        <action.icon className={`w-5 h-5 mb-2 ${isActive ? action.color : 'text-slate-400'}`} />
                                                        <span className={`text-[9px] font-black uppercase ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{action.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                            <button onClick={saveRoleConfiguration} className="px-10 py-4 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all">
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
             )}
          </div>
      );
  }

  return null;
};

export default BranchModule;