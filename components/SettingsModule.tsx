
import React, { useRef, useState } from 'react';
import { Role } from '../types.ts';
import { User, Globe, Bell, Shield, Moon, Sun, Lock, Smartphone, Mail, Laptop, Download, UploadCloud, RefreshCcw } from 'lucide-react';
import { dbService } from '../services/db.ts';
import { authService } from '../src/services/authService.ts';

interface SettingsModuleProps {
  role: Role;
}

type SettingsTab = 'general' | 'security' | 'notifications';

const SettingsModule: React.FC<SettingsModuleProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState(authService.getUsers());
  const [passwordInputs, setPasswordInputs] = useState<Record<string, string>>({});
  const [passwordConfirmInputs, setPasswordConfirmInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentCredential, setCurrentCredential] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = await dbService.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techwizardry_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await dbService.importAll(payload);
      window.location.reload();
    } catch {
      alert('Restore failed. Please check the backup file.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleSetPassword = async (id: string) => {
    const pwd = passwordInputs[id] || '';
    const confirm = passwordConfirmInputs[id] || '';
    setErrorMsg(null);
    if (!pwd || pwd.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (pwd !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    try {
      const session = authService.getCurrentUser();
      await fetch('http://localhost:4000/users/' + id + '/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(session?.token ? { 'Authorization': 'Bearer ' + session.token } : {}) },
        body: JSON.stringify({ password: pwd })
      });
    } catch {}
    const updated = authService.setPassword(id, pwd);
    if (updated) {
      setUsers(authService.getUsers());
      setPasswordInputs(prev => ({ ...prev, [id]: '' }));
      setPasswordConfirmInputs(prev => ({ ...prev, [id]: '' }));
      setFeedback('Password updated');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleUpdateSecurityKey = async () => {
    setErrorMsg(null);
    setFeedback(null);
    if (!newSecret || newSecret.length < 8) {
      setErrorMsg('New key must be at least 8 characters.');
      return;
    }
    try {
      let session = authService.getCurrentUser();
      if (!session) {
        try {
          session = await authService.login({
            email: 'admin@techwizardry.com',
            role: 'MASTER_ADMIN',
            password: currentCredential || undefined
          } as any);
        } catch {
          setErrorMsg('Current credential invalid. Please login as admin first.');
          return;
        }
      }
      try {
        await fetch('http://localhost:4000/users/u1/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.token ? { 'Authorization': 'Bearer ' + session.token } : {})
          },
          body: JSON.stringify({ password: newSecret })
        });
      } catch {}
      const updated = authService.setPassword('u1', newSecret);
      if (updated) {
        setUsers(authService.getUsers());
        setCurrentCredential('');
        setNewSecret('');
        setFeedback('Security key updated');
        setTimeout(() => setFeedback(null), 1500);
      } else {
        setErrorMsg('Failed to update security key.');
      }
    } catch {
      setErrorMsg('Failed to update security key.');
    }
  };

  const resolveCurrentUserId = (): string => {
    const session = authService.getCurrentUser();
    if (session?.id) return session.id;
    const map: Record<Role, string> = {
      MASTER_ADMIN: 'u1',
      STORE_MANAGER: 'u2',
      INVENTORY_LEAD: 'u3',
      SALES_HEAD: 'u4'
    };
    return map[role];
  };

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const id = resolveCurrentUserId();
      const updated = authService.setAvatar(id, dataUrl);
      if (updated) {
        setUsers(authService.getUsers());
        setFeedback('Avatar updated');
        setTimeout(() => setFeedback(null), 1500);
      } else {
        setErrorMsg('Failed to update avatar');
      }
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h2>
        <p className="text-slate-500 font-medium">Manage your profile and system preferences</p>
      </div>
      
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-100 overflow-x-auto bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-8 py-5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === 'general' 
                ? 'text-[#f65b13] border-b-2 border-[#f65b13] bg-white' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            General Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-8 py-5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === 'security' 
                ? 'text-[#f65b13] border-b-2 border-[#f65b13] bg-white' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Security & Access
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-8 py-5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeTab === 'notifications' 
                ? 'text-[#f65b13] border-b-2 border-[#f65b13] bg-white' 
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Notifications
          </button>
        </div>
        
        <div className="p-8 md:p-12 space-y-10">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                  <User className="w-5 h-5 mr-3 text-[#f65b13]" />
                  Profile Information
                </h3>
                
                <div className="flex items-center space-x-8 mb-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-400 border-4 border-white shadow-xl">
                        {role.replace('_', ' ')}
                    </div>
                    <div>
                        <button onClick={openAvatarPicker} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-[#f65b13] hover:text-[#f65b13] transition-all shadow-sm">
                            Change Avatar
                        </button>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Legal Name</label>
                    <input type="text" defaultValue={role === 'MASTER_ADMIN' ? 'System Administrator' : role.replace('_', ' ')} className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 text-slate-500 font-bold cursor-not-allowed" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" defaultValue={role === 'MASTER_ADMIN' ? 'admin@techwizardry.com' : 'manager@techwizardry.com'} className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 text-slate-500 font-bold cursor-not-allowed" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Node Role</label>
                    <input type="text" defaultValue={role} className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 text-slate-800 font-black uppercase" disabled />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Employee Identifier</label>
                    <input type="text" defaultValue="EMP-001" className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 text-slate-800 font-mono font-bold" disabled />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-10 space-y-8">
                <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                  <Globe className="w-5 h-5 mr-3 text-[#f65b13]" />
                  System Preferences
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:border-[#f65b13]/20 transition-all group">
                    <div>
                        <div className="font-bold text-slate-800 text-sm">Language</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global interface localized text</div>
                    </div>
                    <select className="p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white focus:ring-2 focus:ring-[#f65b13]/10">
                        <option>English (UK)</option>
                        <option>Hindi (India)</option>
                        <option>Spanish (ES)</option>
                    </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:border-[#f65b13]/20 transition-all group">
                    <div>
                        <div className="font-bold text-slate-800 text-sm">Interface Theme</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Visual mode for eye-comfort</div>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button className="p-2 bg-white rounded-lg shadow-sm text-[#f65b13] border border-slate-100"><Sun className="w-4 h-4" /></button>
                        <button className="p-2 text-slate-400 hover:text-slate-600"><Moon className="w-4 h-4" /></button>
                    </div>
                    </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                    <Shield className="w-5 h-5 mr-3 text-[#f65b13]" />
                    Data Backup
                  </h3>
                  <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Backup & Restore</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Download full dataset or restore from a backup</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handleBackup} disabled={isBackingUp} className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-sm disabled:opacity-60 flex items-center">
                        {isBackingUp ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Export
                      </button>
                      <button onClick={handleRestoreClick} disabled={isRestoring} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#f65b13] hover:text-[#f65b13] transition-all shadow-sm disabled:opacity-60 flex items-center">
                        {isRestoring ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                        Import
                      </button>
                      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreFile} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="space-y-6">
                 <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                   <Lock className="w-5 h-5 mr-3 text-[#f65b13]" />
                   Access Protocol
                 </h3>
                 <div className="max-w-md space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Credential</label>
                       <input type="password" value={currentCredential} onChange={e => setCurrentCredential(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-black tracking-widest" placeholder="••••••••" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Architectural Secret</label>
                       <input type="password" value={newSecret} onChange={e => setNewSecret(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-black tracking-widest" placeholder="••••••••" />
                    </div>
                    <button onClick={handleUpdateSecurityKey} className="px-8 py-4 bg-[#000000] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95">Update Security Key</button>
                 </div>

                 <div className="pt-8 border-t border-slate-50">
                    <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                       <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-[#f65b13]">
                             <Smartphone className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 text-sm">Two-Factor Authentication</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enhanced biometric verification</p>
                          </div>
                       </div>
                       <button className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">Disabled</button>
                    </div>
                 </div>
              </div>

              {role === 'MASTER_ADMIN' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                    <Shield className="w-5 h-5 mr-3 text-[#f65b13]" />
                    User Password Setup
                  </h3>
                  {feedback && <div className="text-xs font-black text-green-600">{feedback}</div>}
                  {errorMsg && <div className="text-xs font-black text-red-600">{errorMsg}</div>}
                  <div className="space-y-4">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.name} • {u.role.replace('_',' ')}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{u.email || 'no-email'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="password" 
                            value={passwordInputs[u.id] || ''} 
                            onChange={e => setPasswordInputs(prev => ({ ...prev, [u.id]: e.target.value }))} 
                            placeholder="Set password" 
                            className="p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white"
                          />
                          <input 
                            type="password" 
                            value={passwordConfirmInputs[u.id] || ''} 
                            onChange={e => setPasswordConfirmInputs(prev => ({ ...prev, [u.id]: e.target.value }))} 
                            placeholder="Confirm" 
                            className="p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white"
                          />
                          <button 
                            onClick={() => handleSetPassword(u.id)} 
                            className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50"
                            disabled={!passwordInputs[u.id] || (passwordInputs[u.id] || '').length < 8 || passwordInputs[u.id] !== (passwordConfirmInputs[u.id] || '')}
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                 <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                   <Shield className="w-5 h-5 mr-3 text-[#f65b13]" />
                   Authorised Terminals
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 border border-slate-100 rounded-3xl bg-slate-50/50">
                       <div className="flex items-center space-x-4">
                          <Laptop className="w-6 h-6 text-slate-400" />
                          <div>
                             <p className="text-sm font-bold text-slate-800">Primary Command Station - Browser</p>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Active Session • Node-01</p>
                          </div>
                       </div>
                       <span className="text-[9px] font-black bg-[#f65b13]/10 text-[#f65b13] px-3 py-1 rounded-full uppercase tracking-widest">Identity Verified</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
             <div className="space-y-10 animate-in fade-in duration-300">
                <div className="space-y-6">
                   <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                     <Mail className="w-5 h-5 mr-3 text-[#f65b13]" />
                     System Digests
                   </h3>
                   <div className="space-y-4">
                      {['Daily Sales Summary', 'Weekly Performance Report', 'New Staff Onboarding Alerts', 'Inventory Low Stock Warnings'].map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:border-[#f65b13]/10 transition-all">
                            <span className="text-sm font-bold text-slate-700">{item}</span>
                            <div className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${idx < 2 ? 'bg-[#f65b13]' : 'bg-slate-300'}`}>
                               <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${idx < 2 ? 'right-0.5' : 'left-0.5'}`}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                     <Bell className="w-5 h-5 mr-3 text-[#f65b13]" />
                     Push Intelligence
                   </h3>
                   <div className="p-8 bg-[#000000] rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
                       <div className="mb-6 md:mb-0">
                          <h4 className="font-black text-lg mb-1 uppercase tracking-tighter">Desktop Notifications</h4>
                          <p className="text-xs text-slate-400 font-medium">Real-time interrupt-driven updates from the HO server.</p>
                       </div>
                       <button className="px-8 py-3 bg-[#f65b13] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg shadow-[#f65b13]/20">Permit Access</button>
                   </div>
                </div>
             </div>
          )}

        </div>
        
        <div className="bg-slate-900 px-12 py-6 border-t border-slate-800 flex justify-end">
          <button className="px-10 py-3.5 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-2xl shadow-[#f65b13]/20 active:scale-95">
            Save Global Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
