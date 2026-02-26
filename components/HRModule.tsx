
import React, { useState, useMemo, useRef } from 'react';
import { Role, Staff, Candidate, AttendanceRecord, AttendanceStatus, CandidateDocument } from '../types.ts';
import { 
  UserPlus, Search, FileText, Check, Clock, AlertCircle, X, Pencil, Briefcase, IndianRupee, Calendar, 
  CheckCircle2, UserMinus, Filter, Sparkles, Zap, TrendingUp, History, ClipboardCheck, BookOpen, 
  UserCheck, Building2, ChevronRight, Plus, ArrowRight, ShieldCheck, Award, BrainCircuit, RefreshCw,
  User, ListFilter, Download, BarChart3, Mail, Phone, UploadCloud, Eye, File, Clock3
} from 'lucide-react';
import { generateJobDescription, analyzeAttendance } from '../services/geminiService.ts';

interface HRModuleProps {
  role: Role;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  attendanceData?: AttendanceRecord[];
  setAttendanceData?: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  view?: 'ATTENDANCE' | 'STAFF' | 'CANDIDATES' | 'ONBOARDING' | 'STORE_ATTENDANCE' | 'TIMING';
}

const AVAILABLE_STORES = ['Head Office', 'Downtown Branch', 'Northgate Branch'];

const HRModule: React.FC<HRModuleProps> = ({ 
  role, staffList, setStaffList, candidates, setCandidates, attendanceData = [], setAttendanceData, view = 'STAFF' 
}) => {
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Document Viewer State
  const [viewingDocsFor, setViewingDocsFor] = useState<{ id: string, name: string, docs: CandidateDocument[] } | null>(null);

  const [newStaffData, setNewStaffData] = useState({
    name: '', position: '', store: role === 'STORE_MANAGER' ? 'Downtown Branch' : 'Head Office', status: 'Active' as 'Active' | 'On Leave' | 'Terminated'
  });

  const [newCandidateData, setNewCandidateData] = useState({
    name: '',
    role: '',
    status: 'New' as Candidate['status'],
    expectedSalary: 0,
    appliedDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    documents: [] as CandidateDocument[]
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceFilterStore, setAttendanceFilterStore] = useState('All');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [activeCandidateTab, setActiveCandidateTab] = useState<'list' | 'jd-gen'>('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJobDesc, setGeneratedJobDesc] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobReqs, setJobReqs] = useState('');

  // New state for Onboarding Finalization
  const [finalizingCandidate, setFinalizingCandidate] = useState<Candidate | null>(null);
  const [activationBranch, setActivationBranch] = useState('Downtown Branch');

  const pendingOnboarding = candidates.filter(c => c.status === 'Hired');

  const updateOnboardingStage = (candidateId: string, stage: Candidate['onboardingStage']) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, onboardingStage: stage } : c));
  };

  const handleHireCandidate = (candidateId: string) => {
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, status: 'Hired', onboardingStage: 'Documents' } : c
    ));
  };

  const finalizeOnboarding = () => {
    if (!finalizingCandidate) return;

    // TRANSFER LOGIC: Documents carry over from Candidate to Staff
    const newStaff: Staff = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name: finalizingCandidate.name,
      position: finalizingCandidate.role,
      store: activationBranch,
      status: 'Active',
      attendance: 100,
      documents: finalizingCandidate.documents || [] // Copy documents
    };

    setStaffList(prev => [...prev, newStaff]);
    setCandidates(prev => prev.filter(c => c.id !== finalizingCandidate.id));
    setFinalizingCandidate(null);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to server/cloud storage here.
      // For mock, create a local object.
      const newDoc: CandidateDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file), // Temporary blob URL
        uploadDate: new Date().toISOString().split('T')[0]
      };
      setNewCandidateData(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
    }
  };

  const removeDocument = (docId: string) => {
    setNewCandidateData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== docId) }));
  };

  const handleMarkAttendance = (staffId: string, status: AttendanceStatus) => {
    if (!setAttendanceData) return;
    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(r => r.staffId === staffId && r.date === selectedDate);
      
      // Use standard 24h HH:mm format for compatibility
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      if (existingIndex !== -1) {
        const record = prev[existingIndex];
        const updatedRecord = { ...record, status, markedBy: role };
        
        // If transitioning to Present/Late and no timeIn is set, set it.
        // Don't clear timeOut if it exists, unless status is cleared (which isn't an option here typically).
        if ((status === 'Present' || status === 'Late') && !record.timeIn) {
             updatedRecord.timeIn = currentTime;
        }
        
        const updated = [...prev];
        updated[existingIndex] = updatedRecord;
        return updated;
      }
      
      const newRecord: AttendanceRecord = { 
          date: selectedDate, 
          staffId, 
          status, 
          markedBy: role, 
          timeIn: (status === 'Present' || status === 'Late') ? currentTime : undefined 
      };
      return [...prev, newRecord];
    });
  };

  const handleUpdateTiming = (staffId: string, type: 'in' | 'out', value: string) => {
    if (!setAttendanceData) return;
    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(r => r.staffId === staffId && r.date === selectedDate);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { 
            ...updated[existingIndex], 
            [type === 'in' ? 'timeIn' : 'timeOut']: value 
        };
        return updated;
      } else {
        // Create new record if one doesn't exist (e.g. adding time for someone not yet marked)
        const newRecord: AttendanceRecord = {
            date: selectedDate,
            staffId,
            status: 'Present', // Default to Present if entering time
            markedBy: role,
            [type === 'in' ? 'timeIn' : 'timeOut']: value
        };
        return [...prev, newRecord];
      }
    });
  };

  const calculateDuration = (inTime?: string, outTime?: string) => {
    if (!inTime || !outTime) return '--';
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Simple overnight handling
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return `${h}h ${m}m`;
  };

  const attendanceStats = useMemo(() => {
    const todayRecords = attendanceData.filter(r => r.date === selectedDate);
    const records = todayRecords.map(r => r.status);
    return {
      present: records.filter(r => r === 'Present').length,
      late: records.filter(r => r === 'Late').length,
      absent: records.filter(r => r === 'Absent').length,
      leave: records.filter(r => r === 'Leave').length,
      total: staffList.length,
      markingProgress: staffList.length > 0 ? (todayRecords.length / staffList.length) * 100 : 0
    };
  }, [attendanceData, selectedDate, staffList]);

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const recentData = attendanceData.slice(-20).map(r => {
        const staff = staffList.find(s => s.id === r.staffId);
        return `${staff?.name || 'Unknown'} (${staff?.store || 'N/A'}): ${r.status} on ${r.date}`;
      }).join(', ');
      
      const insight = await analyzeAttendance(recentData);
      setAiInsight(insight);
    } catch (e) {
      setAiInsight("Failed to generate analysis. Ensure your API key is configured.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredStaffForAttendance = staffList.filter(s => (attendanceFilterStore === 'All' || s.store === attendanceFilterStore) && s.status !== 'Terminated');

  const handleSaveStaff = () => {
    if (!newStaffData.name) return;
    if (editingId) {
        setStaffList(prev => prev.map(s => s.id === editingId ? { ...s, ...newStaffData } : s));
        setEditingId(null);
    } else {
        const newStaff: Staff = { id: Date.now().toString(), ...newStaffData, attendance: 100 };
        setStaffList(prev => [...prev, newStaff]);
    }
    setShowAddStaffModal(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSaveCandidate = () => {
    if (!newCandidateData.name || !newCandidateData.role) {
      alert("Please provide the candidate's name and intended role.");
      return;
    }
    const candidate: Candidate = {
      id: `CAN-${Date.now().toString().slice(-4)}`,
      ...newCandidateData
    };
    setCandidates(prev => [...prev, candidate]);
    setNewCandidateData({
      name: '',
      role: '',
      status: 'New',
      expectedSalary: 0,
      appliedDate: new Date().toISOString().split('T')[0],
      email: '',
      phone: '',
      documents: []
    });
    setShowAddCandidateModal(false);
  };

  const handleDeleteCandidate = (id: string) => {
    if (window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  };

  const renderAttendanceLogs = () => {
    const historicalLogs = attendanceData
      .filter(r => attendanceFilterStore === 'All' || staffList.find(s => s.id === r.staffId)?.store === attendanceFilterStore)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
             <div className="p-3 bg-[#f65b13]/5 text-[#f65b13] rounded-2xl"><History className="w-5 h-5" /></div>
             <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Attendance Archives</h3>
                <p className="text-xs text-slate-500 font-medium">Historical audit of branch punctuality</p>
             </div>
          </div>
          <div className="flex items-center space-x-3">
             <select 
               className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#f65b13]/10" 
               value={attendanceFilterStore} 
               onChange={e => setAttendanceFilterStore(e.target.value)}
             >
               <option value="All">All Branches</option>
               {AVAILABLE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#f65b13] hover:border-[#f65b13]/10 transition-all shadow-sm">
                <Download className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">Branch</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Time In</th>
                <th className="px-8 py-5 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historicalLogs.map((log, idx) => {
                const staff = staffList.find(s => s.id === log.staffId);
                return (
                  <tr key={`${log.staffId}-${log.date}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-4 text-xs font-black text-slate-800">{new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">{staff?.name.charAt(0)}</div>
                        <span className="text-sm font-bold text-slate-800">{staff?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{staff?.store}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        log.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                        log.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                        log.status === 'Absent' ? 'bg-red-50 text-red-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-mono text-slate-500">{log.timeIn || '--:--'}</td>
                    <td className="px-8 py-4 text-right">
                       <span className="text-[9px] font-bold text-slate-300 uppercase">By {log.markedBy}</span>
                    </td>
                  </tr>
                );
              })}
              {historicalLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-medium">No attendance records found for this criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {view === 'ONBOARDING' ? 'New Hire Activation' : 
             view === 'STORE_ATTENDANCE' ? 'Store Attendance Logs' :
             view === 'TIMING' ? 'Shift & Timing Management' :
             view?.replace('HR_', '').replace('_', ' ')}
          </h2>
          <p className="text-slate-500 text-sm">{role === 'MASTER_ADMIN' ? 'Head Office Access' : 'Branch HR'}</p>
        </div>
        <div className="flex items-center space-x-3">
          {(view === 'ATTENDANCE' || view === 'STORE_ATTENDANCE') && (
            <button 
              onClick={runAiAnalysis} 
              disabled={isAnalyzing}
              className="flex items-center space-x-2 bg-[#000000] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all text-sm disabled:opacity-50"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 text-[#f65b13]" />}
              <span>AI Analysis Report</span>
            </button>
          )}
          {view === 'STAFF' && (
            <button onClick={() => setShowAddStaffModal(true)} className="flex items-center space-x-2 bg-[#f65b13] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] transition-all text-sm">
              <UserPlus className="w-4 h-4" />
              <span>Register Employee</span>
            </button>
          )}
          {view === 'CANDIDATES' && (
            <button onClick={() => setShowAddCandidateModal(true)} className="flex items-center space-x-2 bg-[#000000] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-slate-900 transition-all text-sm">
              <UserPlus className="w-4 h-4" />
              <span>Register Candidate</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Insight Section */}
      {aiInsight && (view === 'ATTENDANCE' || view === 'STORE_ATTENDANCE') && (
        <div className="bg-gradient-to-br from-orange-50 to-slate-50 border border-orange-100 rounded-3xl p-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12"><BrainCircuit className="w-32 h-32 text-[#f65b13]" /></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#f65b13] animate-pulse" />
              <h3 className="font-black text-[#f65b13] uppercase tracking-widest text-xs">Gemini Intelligence Observations</h3>
            </div>
            <div className="prose prose-sm prose-orange max-w-none text-slate-700 font-medium leading-relaxed">
              {aiInsight.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
            <div className="mt-6 flex items-center space-x-4">
               <div className="px-4 py-2 bg-white/60 backdrop-blur rounded-xl border border-orange-100 flex items-center space-x-2">
                 <CheckCircle2 className="w-4 h-4 text-[#f65b13]" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Analysis Confidence: 94%</span>
               </div>
               <button onClick={() => setAiInsight(null)} className="text-[10px] font-bold text-[#f65b13] hover:underline uppercase tracking-widest">Dismiss Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Store Attendance Logs View */}
      {view === 'STORE_ATTENDANCE' && renderAttendanceLogs()}

      {/* Timing Management View */}
      {view === 'TIMING' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                 <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/10" 
                      value={selectedDate} 
                      onChange={e => setSelectedDate(e.target.value)} 
                    />
                 </div>
                 <select 
                   className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/10" 
                   value={attendanceFilterStore} 
                   onChange={e => setAttendanceFilterStore(e.target.value)}
                 >
                   <option value="All">All Branches</option>
                   {AVAILABLE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-white border rounded-lg">Time Format: 24H</span>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Editor: {role}</p>
              </div>
           </div>
           
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                    <th className="px-8 py-5">Staff Member</th>
                    <th className="px-8 py-5">Branch</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Clock In</th>
                    <th className="px-8 py-5">Clock Out</th>
                    <th className="px-8 py-5 text-right">Duration</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredStaffForAttendance.map(staff => {
                    const record = attendanceData.find(r => r.staffId === staff.id && r.date === selectedDate);
                    return (
                       <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                             <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">{staff.name.charAt(0)}</div>
                                <div>
                                   <div className="font-bold text-slate-800 text-sm">{staff.name}</div>
                                   <div className="text-[10px] text-slate-400 font-medium">{staff.position}</div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-4 text-xs font-bold text-slate-500">{staff.store}</td>
                          <td className="px-8 py-4">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${
                                record?.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                record?.status === 'Late' ? 'bg-amber-50 text-amber-600' :
                                record?.status === 'Absent' ? 'bg-red-50 text-red-600' :
                                'bg-slate-100 text-slate-400'
                             }`}>
                                {record?.status || 'Unmarked'}
                             </span>
                          </td>
                          <td className="px-8 py-4">
                             <div className="relative w-32 group">
                                <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-hover:text-[#f65b13] transition-colors" />
                                <input 
                                  type="time" 
                                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/20 focus:bg-white transition-all"
                                  value={record?.timeIn || ''}
                                  onChange={(e) => handleUpdateTiming(staff.id, 'in', e.target.value)}
                                />
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <div className="relative w-32 group">
                                <Clock3 className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-hover:text-[#f65b13] transition-colors" />
                                <input 
                                  type="time" 
                                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/20 focus:bg-white transition-all"
                                  value={record?.timeOut || ''}
                                  onChange={(e) => handleUpdateTiming(staff.id, 'out', e.target.value)}
                                />
                             </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                {calculateDuration(record?.timeIn, record?.timeOut)}
                             </span>
                          </td>
                       </tr>
                    );
                 })}
                 {filteredStaffForAttendance.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">No staff members found for the selected filter.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      )}

      {/* Daily Attendance View */}
      {view === 'ATTENDANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Present</p>
               <p className="text-3xl font-black text-slate-800">{attendanceStats.present}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Late Arrivals</p>
               <p className="text-3xl font-black text-amber-500">{attendanceStats.late}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absences</p>
               <p className="text-3xl font-black text-red-500">{attendanceStats.absent}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion</p>
               <p className="text-3xl font-black text-[#f65b13]">{attendanceStats.markingProgress.toFixed(0)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <input type="date" className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/10" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/10" value={attendanceFilterStore} onChange={e => setAttendanceFilterStore(e.target.value)}>
                  <option value="All">All Branches</option>
                  {AVAILABLE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Marking as: {role}</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">Staff Member</th>
                  <th className="px-8 py-5">Position & Branch</th>
                  <th className="px-8 py-5 text-center">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaffForAttendance.map(staff => {
                  const record = attendanceData.find(r => r.staffId === staff.id && r.date === selectedDate);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-[#f65b13] group-hover:text-white transition-all">{staff.name.charAt(0)}</div>
                          <span className="font-bold text-slate-800">{staff.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-xs font-bold text-slate-700">{staff.position}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{staff.store}</p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {[
                            { label: 'P', status: 'Present', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white', active: 'bg-emerald-600 text-white' },
                            { label: 'L', status: 'Late', color: 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white', active: 'bg-amber-600 text-white' },
                            { label: 'A', status: 'Absent', color: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white', active: 'bg-red-600 text-white' },
                            { label: 'O', status: 'Leave', color: 'bg-slate-100 text-slate-600 hover:bg-slate-600 hover:text-white', active: 'bg-slate-600 text-white' }
                          ].map(btn => (
                            <button 
                              key={btn.status} 
                              onClick={() => handleMarkAttendance(staff.id, btn.status as any)}
                              title={btn.status}
                              className={`w-10 h-10 rounded-xl font-black transition-all ${record?.status === btn.status ? btn.active : btn.color}`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding View Implementation */}
      {view === 'ONBOARDING' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <ClipboardCheck className="w-5 h-5 mr-2 text-[#f65b13]" />
                       Queue Status
                    </h3>
                    <div className="space-y-3">
                       <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-xs font-medium text-slate-600">Verification</span>
                          <span className="text-xs font-black text-slate-800">{pendingOnboarding.filter(c => !c.onboardingStage || c.onboardingStage === 'Documents').length}</span>
                       </div>
                       <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-xs font-medium text-slate-600">Training</span>
                          <span className="text-xs font-black text-slate-800">{pendingOnboarding.filter(c => c.onboardingStage === 'Training').length}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                 {pendingOnboarding.map(hire => (
                   <div key={hire.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#f65b13] flex items-center justify-center font-bold text-lg">{hire.name.charAt(0)}</div>
                           <div>
                              <h4 className="font-bold text-slate-800">{hire.name}</h4>
                              <p className="text-xs text-slate-500">{hire.role}</p>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-100/50 p-1.5 rounded-xl border">
                           {['Documents', 'Training', 'Ready'].map(st => (
                             <button key={st} onClick={() => updateOnboardingStage(hire.id, st as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${hire.onboardingStage === st ? 'bg-white text-[#f65b13] shadow-sm' : 'text-slate-400'}`}>{st}</button>
                           ))}
                        </div>
                        <button onClick={() => setFinalizingCandidate(hire)} disabled={hire.onboardingStage !== 'Ready'} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${hire.onboardingStage === 'Ready' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>Activate</button>
                      </div>
                   </div>
                 ))}
                 {pendingOnboarding.length === 0 && (
                   <div className="text-center py-20 bg-white border-2 border-dashed border-slate-100 rounded-3xl text-slate-400">
                      <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No pending activations in the queue.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Activation Modal */}
      {finalizingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Assign & Activate</h3>
                 <button onClick={() => setFinalizingCandidate(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg text-[#f65b13] text-2xl font-bold">{finalizingCandidate.name.charAt(0)}</div>
                    <h4 className="font-bold text-slate-900">{finalizingCandidate.name}</h4>
                    <p className="text-xs text-slate-500">{finalizingCandidate.role}</p>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Branch Assignment</label>
                    <select className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#f65b13]/10" value={activationBranch} onChange={e => setActivationBranch(e.target.value)}>
                       {AVAILABLE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {(finalizingCandidate.documents?.length || 0)} Documents Will Be Transferred
                    </p>
                 </div>
                 <button onClick={finalizeOnboarding} className="w-full py-4 bg-[#f65b13] text-white rounded-2xl font-bold shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all">Confirm Integration</button>
              </div>
           </div>
        </div>
      )}

      {/* Staff List View */}
      {view === 'STAFF' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5">Job Role</th>
                  <th className="px-8 py-5">Assigned Store</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffList.map(staff => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-4">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#f65b13] group-hover:text-white flex items-center justify-center font-black transition-all">{staff.name.charAt(0)}</div>
                          <span className="font-bold text-slate-800">{staff.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-4">
                       <p className="text-xs font-bold text-slate-700">{staff.position}</p>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-slate-500">{staff.store}</td>
                    <td className="px-8 py-4 text-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${staff.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{staff.status}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <div className="flex items-center justify-end space-x-2">
                           <button onClick={() => setViewingDocsFor({ id: staff.id, name: staff.name, docs: staff.documents || [] })} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors">
                               Docs
                           </button>
                           {role === 'MASTER_ADMIN' && (
                                <>
                                    <button onClick={() => { setNewStaffData({ name: staff.name, position: staff.position, store: staff.store, status: staff.status }); setEditingId(staff.id); setShowAddStaffModal(true); }} className="p-2 text-slate-400 hover:text-[#f65b13] transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteStaff(staff.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><UserMinus className="w-4 h-4" /></button>
                                </>
                           )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Candidates View */}
      {view === 'CANDIDATES' && (
        <div className="space-y-6">
          <div className="flex space-x-1 p-1 bg-slate-100 w-fit rounded-xl">
            <button onClick={() => setActiveCandidateTab('list')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeCandidateTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Candidate Pipeline</button>
            <button onClick={() => setActiveCandidateTab('jd-gen')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeCandidateTab === 'jd-gen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>JD Intelligence</button>
          </div>

          {activeCandidateTab === 'list' ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                        <th className="px-8 py-5">Candidate</th>
                        <th className="px-8 py-5">Contact Info</th>
                        <th className="px-8 py-5">Target Role</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {candidates.filter(c => c.status !== 'Hired').map(candidate => (
                        <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-8 py-5">
                              <div className="flex items-center space-x-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-[#f65b13] group-hover:text-white flex items-center justify-center font-black transition-all">{candidate.name.charAt(0)}</div>
                                 <div>
                                    <div className="font-bold text-slate-800">{candidate.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Applied: {new Date(candidate.appliedDate).toLocaleDateString()}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className="space-y-1">
                                 <div className="flex items-center text-xs font-medium text-slate-600">
                                    <Mail className="w-3 h-3 mr-2 text-slate-300" />
                                    {candidate.email || 'No email'}
                                 </div>
                                 <div className="flex items-center text-xs font-medium text-slate-600">
                                    <Phone className="w-3 h-3 mr-2 text-slate-300" />
                                    {candidate.phone || 'No phone'}
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <div className="text-xs font-bold text-slate-700">{candidate.role}</div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Exp: ₹{candidate.expectedSalary.toLocaleString()}</div>
                           </td>
                           <td className="px-8 py-5 text-center">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${candidate.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-[#f65b13]/10 text-[#f65b13]'}`}>{candidate.status}</span>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => setViewingDocsFor({ id: candidate.id, name: candidate.name, docs: candidate.documents || [] })} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Docs">
                                    <FileText className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => handleHireCandidate(candidate.id)} className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all">Move to Onboarding</button>
                                 <button onClick={() => handleDeleteCandidate(candidate.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><UserMinus className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {candidates.filter(c => c.status !== 'Hired').length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-10" />
                              <p className="text-sm">No active candidates in pipeline.</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 max-w-2xl mx-auto">
               <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                  <BrainCircuit className="w-6 h-6 mr-3 text-[#f65b13]" />
                  AI Job Description Architect
               </h3>
               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Target Role</label>
                    <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 transition-all font-bold" placeholder="e.g. Senior Mobile Technician" value={jobRole} onChange={e => setJobRole(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Key Competencies & Requirements</label>
                    <textarea className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 transition-all min-h-[120px] bg-white" placeholder="e.g. 5+ years experience, iPhone motherboard repair, micro-soldering, customer first attitude" value={jobReqs} onChange={e => setJobReqs(e.target.value)} />
                  </div>
                  <button 
                    onClick={async () => {
                      setIsGenerating(true);
                      const desc = await generateJobDescription(jobRole, jobReqs);
                      setGeneratedJobDesc(desc);
                      setIsGenerating(false);
                    }}
                    disabled={isGenerating || !jobRole}
                    className="w-full py-4 bg-[#f65b13] text-white rounded-2xl font-bold shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                    <span>Construct Description</span>
                  </button>
                  {generatedJobDesc && (
                    <div className="mt-8 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl relative">
                       <h4 className="text-xs font-black text-[#f65b13] uppercase tracking-widest mb-4">Generated Blueprint</h4>
                       <div className="text-sm text-slate-600 whitespace-pre-wrap font-medium leading-relaxed prose prose-sm">
                          {generatedJobDesc}
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(generatedJobDesc); alert('JD Copied to clipboard'); }} className="absolute top-6 right-6 p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#f65b13] transition-all shadow-sm"><ClipboardCheck className="w-4 h-4" /></button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm transition-all" onClick={() => setShowAddStaffModal(false)}>
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Modify Personnel' : 'Register Personnel'}</h3>
                 <button onClick={() => setShowAddStaffModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-10 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Name</label>
                    <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white" value={newStaffData.name} onChange={e => setNewStaffData({...newStaffData, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Designation</label>
                        <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white" value={newStaffData.position} onChange={e => setNewStaffData({...newStaffData, position: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Branch</label>
                        <select className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold appearance-none bg-white" value={newStaffData.store} onChange={e => setNewStaffData({...newStaffData, store: e.target.value})}>
                           {AVAILABLE_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Status</label>
                    <div className="flex space-x-2">
                       {['Active', 'On Leave', 'Terminated'].map(st => (
                         <button key={st} onClick={() => setNewStaffData({...newStaffData, status: st as any})} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${newStaffData.status === st ? 'bg-[#000000] text-white border-black shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-[#f65b13]'}`}>{st}</button>
                       ))}
                    </div>
                 </div>
                 <button onClick={handleSaveStaff} className="w-full py-5 bg-[#f65b13] text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all mt-4">
                    {editingId ? 'Update Identity' : 'Commit to Database'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm transition-all" onClick={() => setShowAddCandidateModal(false)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Register Candidate</h3>
               <button onClick={() => setShowAddCandidateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Legal Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                      <input type="text" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" placeholder="e.g. Rohan Varma" value={newCandidateData.name} onChange={e => setNewCandidateData({...newCandidateData, name: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Applied Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                      <input type="date" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" value={newCandidateData.appliedDate} onChange={e => setNewCandidateData({...newCandidateData, appliedDate: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                      <input type="email" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" placeholder="email@example.com" value={newCandidateData.email} onChange={e => setNewCandidateData({...newCandidateData, email: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                      <input type="tel" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" placeholder="+91 XXXX..." value={newCandidateData.phone} onChange={e => setNewCandidateData({...newCandidateData, phone: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Role</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                        <input type="text" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" placeholder="e.g. Sales Lead" value={newCandidateData.role} onChange={e => setNewCandidateData({...newCandidateData, role: e.target.value})} />
                      </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exp. Salary (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                      <input type="number" className="w-full pl-12 p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold text-slate-800 bg-white" value={newCandidateData.expectedSalary} onChange={e => setNewCandidateData({...newCandidateData, expectedSalary: Number(e.target.value)})} />
                    </div>
                  </div>
               </div>

               {/* Document Upload Section */}
               <div className="border-t border-slate-100 pt-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Attach Documents</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#f65b13]/50 hover:bg-slate-50 transition-all group"
                  >
                     <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-[#f65b13] transition-colors mb-2" />
                     <p className="text-xs font-bold text-slate-500">Click to upload Resume / CV</p>
                     <p className="text-[10px] text-slate-400 mt-1">Supports PDF only</p>
                     <input 
                       type="file" 
                       accept="application/pdf" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleDocumentUpload} 
                     />
                  </div>
                  
                  {newCandidateData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                       {newCandidateData.documents.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-slate-700 truncate">{doc.name}</span>
                             </div>
                             <button onClick={() => removeDocument(doc.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                       ))}
                    </div>
                  )}
               </div>
               
               <button onClick={handleSaveCandidate} className="w-full py-5 bg-[#000000] text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-black/20 hover:bg-slate-900 active:scale-95 transition-all mt-4">
                  Add to Pipeline
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocsFor && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setViewingDocsFor(null)}>
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-8 py-6 border-b bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Document Repository</h3>
                    <p className="text-xs text-slate-500 font-bold">{viewingDocsFor.name}</p>
                 </div>
                 <button onClick={() => setViewingDocsFor(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8">
                 {viewingDocsFor.docs.length > 0 ? (
                    <div className="space-y-3">
                       {viewingDocsFor.docs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all group">
                             <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                   <File className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{doc.name}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">{doc.uploadDate}</p>
                                </div>
                             </div>
                             <div className="flex space-x-2">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-[#f65b13] hover:border-[#f65b13]/30 transition-all" title="View">
                                   <Eye className="w-4 h-4" />
                                </a>
                                <a href={doc.url} download={doc.name} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-[#f65b13] transition-all shadow-md" title="Download">
                                   <Download className="w-4 h-4" />
                                </a>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-12">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <FileText className="w-8 h-8" />
                       </div>
                       <p className="text-slate-500 font-medium text-sm">No documents attached to this profile.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HRModule;
