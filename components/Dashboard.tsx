import React, { useState, useMemo, useEffect } from 'react';
import { Role, Invoice } from '../types.ts';
import { analyzeSalesData } from '../services/geminiService.ts';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  AlertTriangle, 
  IndianRupee, 
  Package, 
  Clock,
  ArrowRight,
  MoreHorizontal,
  Wrench,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Store,
  ArrowLeft,
  Activity,
  Receipt,
  Truck,
  UserCheck,
  X
} from 'lucide-react';

interface DashboardProps {
  role: Role;
  invoices: Invoice[];
}

interface DrillDownState {
  type: 'STORE' | 'TIMELINE' | null;
  id: string | null;
  label: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ role, invoices }) => {
  const [drillDown, setDrillDown] = useState<DrillDownState>({ type: null, id: null, label: null });
  const [timeframe, setTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [salesInsight, setSalesInsight] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      if (invoices && invoices.length > 0) {
        const paidInvoices = invoices.filter(i => i.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
        const summary = `
          Total Revenue: ${totalRevenue}
          Total Transactions: ${paidInvoices.length}
          Recent Transactions:
          ${paidInvoices.slice(-5).map(i => `- ${i.date}: ${i.amount} (${i.storeName})`).join('\n')}
        `;
        const insight = await analyzeSalesData(summary);
        setSalesInsight(insight);
      }
    };
    fetchInsight();
  }, [invoices]);

  // Mock Data
  const dailyData = [
    { name: '09:00', value: 1400 },
    { name: '10:00', value: 1650 },
    { name: '11:00', value: 1900 },
    { name: '12:00', value: 2000 },
    { name: '13:00', value: 1950 },
    { name: '14:00', value: 2200 },
    { name: '15:00', value: 2400 },
    { name: '16:00', value: 2500 },
    { name: '17:00', value: 2450 },
  ];

  const weeklyData = [
    { name: 'Mon', value: 4200 },
    { name: 'Tue', value: 3100 },
    { name: 'Wed', value: 4800 },
    { name: 'Thu', value: 5000 },
    { name: 'Fri', value: 5300 },
    { name: 'Sat', value: 5800 },
    { name: 'Sun', value: 6100 },
  ];

  const monthlyData = [
    { name: 'Week 1', value: 27000 },
    { name: 'Week 2', value: 29000 },
    { name: 'Week 3', value: 28000 },
    { name: 'Week 4', value: 34000 },
  ];

  const chartData = useMemo(() => {
    switch(timeframe) {
      case 'Daily': return dailyData;
      case 'Monthly': return monthlyData;
      case 'Weekly':
      default: return weeklyData;
    }
  }, [timeframe]);

  const categoryData = [
    { name: 'Downtown Branch', value: 245000, transactions: 142 },
    { name: 'Northgate Branch', value: 180000, transactions: 98 },
    { name: 'Head Office', value: 70560, transactions: 45 },
  ];

  const inventoryChartData = [
    { name: 'iPhone 15 Screen', ho: 500, store: 25 },
    { name: 'Samsung S24 Bat', ho: 300, store: 10 },
    { name: 'Screen Protector', ho: 2000, store: 150 },
    { name: 'USB-C Cable', ho: 1000, store: 80 },
    { name: 'Repair Kit', ho: 50, store: 5 },
  ];

  const serviceQueueData = [
    { name: 'Received', value: 8, color: '#64748b' },
    { name: 'Diagnosing', value: 12, color: '#3b82f6' },
    { name: 'Repairing', value: 15, color: '#f65b13' },
    { name: 'Ready', value: 7, color: '#10b981' },
    { name: 'Delivered', value: 24, color: '#0f172a' },
  ];

  const RECENT_ACTIVITIES = [
    { id: '1', type: 'SALE', title: 'Invoice #INV-992', node: 'Downtown Branch', time: '10:45 AM', value: '₹12,400', status: 'Completed', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
    { id: '2', type: 'TRANSFER', title: 'Stock Push: Screens', node: 'Head Office', time: '09:30 AM', value: '50 Units', status: 'In-Transit', icon: Truck, color: 'text-blue-600 bg-blue-50' },
    { id: '3', type: 'HR', title: 'Attendance Marked', node: 'Northgate Branch', time: '09:00 AM', value: '12/12 Staff', status: 'Verified', icon: UserCheck, color: 'text-purple-600 bg-purple-50' },
    { id: '4', type: 'REPAIR', title: 'Job #JS-1024 Ready', node: 'Downtown Branch', time: 'Yesterday', value: '₹4,500', status: 'Completed', icon: Wrench, color: 'text-orange-600 bg-orange-50' },
    { id: '5', type: 'STOCK', title: 'Low Stock Alert', node: 'All Branches', time: 'Yesterday', value: 'Critical', status: 'Alert', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
  ];

  const filteredActivities = useMemo(() => {
    if (!selectedMetric) return RECENT_ACTIVITIES;
    const filterMap: Record<string, string[]> = {
      'Revenue': ['SALE'],
      'Attendance': ['HR'],
      'Service Queue': ['REPAIR'],
      'Assets': ['TRANSFER', 'STOCK']
    };
    return RECENT_ACTIVITIES.filter(act => filterMap[selectedMetric]?.includes(act.type));
  }, [selectedMetric]);

  const COLORS = ['#f65b13', '#333333', '#64748b'];

  const handleChartClick = (data: any, type: 'STORE' | 'TIMELINE') => {
    if (type === 'STORE') {
      const payload = data.payload || data;
      setDrillDown({ type: 'STORE', id: payload.name, label: payload.name });
    } else if (type === 'TIMELINE') {
      if (data && data.activeLabel) {
        setDrillDown({ type: 'TIMELINE', id: data.activeLabel, label: data.activeLabel });
      }
    }
  };

  const resetDrillDown = () => setDrillDown({ type: null, id: null, label: null });

  const renderActivityTable = (activities: typeof RECENT_ACTIVITIES) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Activity Event</th>
              <th className="px-8 py-5">Execution Node</th>
              <th className="px-8 py-5">Timestamp</th>
              <th className="px-8 py-5 text-right">Metric/Value</th>
              <th className="px-8 py-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activities.map((act) => (
              <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <td className="px-8 py-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl transition-all group-hover:scale-110 ${act.color}`}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{act.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{act.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center text-xs font-bold text-slate-600">
                    <Store className="w-3 h-3 mr-2 text-slate-300" />
                    {act.node}
                  </div>
                </td>
                <td className="px-8 py-4 text-xs font-medium text-slate-500">{act.time}</td>
                <td className="px-8 py-4 text-right">
                  <span className="font-black text-slate-900 text-sm">{act.value}</span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      act.status === 'Completed' || act.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      act.status === 'In-Transit' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400 text-sm">
                        No activity found for selected filter.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDrillDownContent = () => {
    if (!drillDown.type) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button 
            onClick={resetDrillDown}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-all group"
          >
            <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span>Global Overview</span>
          </button>
          <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center">
            {drillDown.type === 'STORE' ? <Store className="w-3.5 h-3.5 mr-2 text-[#f65b13]" /> : <Calendar className="w-3.5 h-3.5 mr-2 text-[#f65b13]" />}
            {drillDown.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase px-2">Granular Audit Log</h3>
            {renderActivityTable(RECENT_ACTIVITIES.filter(a => drillDown.type === 'STORE' ? a.node === drillDown.id : true))}
          </div>

          <div className="lg:col-span-1">
             <div className="bg-[#000000] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden h-full">
                <h4 className="text-xl font-black mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 mr-3 text-[#f65b13]" />
                  AI Prediction
                </h4>
                <div className="text-base text-slate-400 leading-relaxed font-medium mb-10 h-64 overflow-y-auto custom-scrollbar">
                  {salesInsight ? (
                    <div className="prose prose-invert prose-sm">
                      <p className="text-white font-bold mb-2">Gemini Analysis:</p>
                      {salesInsight.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 text-sm">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p>"Analyzing historic cycles for <span className="text-white font-bold">{drillDown.label || 'Global Network'}</span>. Expecting a 15% surge in the next 48-hour cycle based on seasonal node behavior."</p>
                  )}
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                     <span>Confidence Score</span>
                     <span className="text-[#f65b13]">92%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#f65b13] h-full w-[92%] shadow-[0_0_15px_rgba(246,91,19,0.5)]"></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase">Growth</p>
                        <p className="text-lg font-black text-emerald-400">+4.2%</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase">Risk</p>
                        <p className="text-lg font-black text-rose-400">Minimal</p>
                      </div>
                   </div>
                </div>
                <div className="absolute bottom-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12 scale-125">
                   <Zap className="w-64 h-64" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      
      {/* Dynamic Welcome Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#000000] p-6 md:p-12 text-white shadow-2xl border border-white/5 group">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#f65b13]/10 border border-[#f65b13]/20 rounded-full text-[#f65b13] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8">
                <Sparkles className="w-3 h-3" />
                <span>Operational Intelligence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 tracking-tighter leading-tight md:leading-none uppercase">
               {role === 'MASTER_ADMIN' ? 'HQ Command' : 'Branch Intel'}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-md leading-relaxed font-medium">
              Real-time monitoring and forecasting for {role === 'MASTER_ADMIN' ? 'active retail network' : 'local branch node'}.
            </p>
          </div>
          
          <div className="hidden lg:block">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl"><Target className="w-5 h-5" /></div>
                        <div>
                           <span className="text-xs font-bold text-slate-300 block">Revenue Target</span>
                           <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">FY24-Q4</span>
                        </div>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">84%</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-[#f65b13]/20 text-[#f65b13] rounded-2xl"><Users className="w-5 h-5" /></div>
                        <div>
                           <span className="text-xs font-bold text-slate-300 block">Active Staff</span>
                           <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Global Roster</span>
                        </div>
                    </div>
                    <span className="text-2xl font-black text-[#f65b13]">12/14</span>
                </div>
                <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] pt-2">
                    <Zap className="w-4 h-4 text-[#f65b13] animate-pulse" />
                    <span>Neural Link: Monitoring forecasting models...</span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 md:w-96 h-64 md:h-96 rounded-full bg-[#f65b13]/10 blur-[120px] group-hover:bg-[#f65b13]/20 transition-all duration-1000"></div>
      </div>

      {drillDown.type ? (
        renderDrillDownContent()
      ) : (
        <>
          {/* High-Impact KPI Grid - Interactive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <KpiCard 
              title="Revenue" 
              value="₹4.95L" 
              trend="+12%" 
              trendUp={true} 
              icon={IndianRupee} 
              color="orange"
              onClick={() => setSelectedMetric(selectedMetric === 'Revenue' ? null : 'Revenue')}
              isActive={selectedMetric === 'Revenue'}
            />
            <KpiCard 
              title="Attendance" 
              value="98.2%" 
              trend="Peak" 
              trendUp={true} 
              icon={Users} 
              color="black"
              onClick={() => setSelectedMetric(selectedMetric === 'Attendance' ? null : 'Attendance')}
              isActive={selectedMetric === 'Attendance'}
            />
            <KpiCard 
              title="Service Queue" 
              value="24" 
              trend="5 Urgent" 
              trendUp={false} 
              icon={Wrench} 
              color="orange"
              onClick={() => setSelectedMetric(selectedMetric === 'Service Queue' ? null : 'Service Queue')}
              isActive={selectedMetric === 'Service Queue'}
            />
            <KpiCard 
              title="Assets" 
              value="₹12.4M" 
              trend="-2%" 
              trendUp={false} 
              icon={Package} 
              color="black"
              onClick={() => setSelectedMetric(selectedMetric === 'Assets' ? null : 'Assets')}
              isActive={selectedMetric === 'Assets'}
            />
          </div>

          {/* Advanced Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            
            {/* Enhanced Area Chart (Replaced Candlestick) */}
            <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative group overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8 md:mb-12 relative z-10 gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">System Performance</h3>
                  <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue Analytics • Trend View</p>
                </div>
                <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-full sm:w-auto overflow-x-auto">
                  {(['Daily', 'Weekly', 'Monthly'] as const).map(tf => (
                    <button 
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`flex-1 sm:flex-none px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap ${timeframe === tf ? 'bg-white text-[#f65b13] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-72 md:h-96 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    onClick={(data) => handleChartClick(data, 'TIMELINE')}
                    className="cursor-pointer"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                      tickFormatter={(value) => `₹${value/1000}k`} 
                      dx={-10} 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      cursor={{fill: '#f8fafc'}}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#f65b13" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                      isAnimationActive={false} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source Distribution */}
            <div className="bg-[#000000] rounded-[2.5rem] p-8 md:p-10 text-white flex flex-col shadow-2xl relative overflow-hidden">
              <h3 className="text-xl md:text-2xl font-black mb-1 tracking-tight">Revenue Split</h3>
              <p className="text-[10px] md:text-[11px] font-bold text-[#f65b13] uppercase tracking-[0.2em] mb-8 md:mb-12">Retail Node Yields</p>
              
              <div className="flex-1 min-h-[220px] md:min-h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart className="cursor-pointer">
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      onClick={(data) => handleChartClick(data, 'STORE')}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl">
                                    <p className="text-xs font-black text-slate-300 uppercase mb-1">{payload[0].name}</p>
                                    <p className="text-white font-bold">₹{Number(payload[0].value).toLocaleString()}</p>
                                    <p className="text-[10px] text-emerald-400 mt-1">{payload[0].payload.transactions} transactions</p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter">NET</span>
                  <span className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Distribution</span>
                </div>
              </div>

              <div className="mt-8 md:mt-10 space-y-3 md:space-y-4 relative z-10">
                {categoryData.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setDrillDown({ type: 'STORE', id: item.name, label: item.name })}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item"
                  >
                    <div className="flex items-center space-x-3 md:space-x-4">
                      <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-xs md:text-sm font-bold text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-black text-sm md:text-base text-white">₹{(item.value / 1000).toFixed(0)}k</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {/* Inventory Bar Chart */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Inventory Distribution</h3>
                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Head Office vs Branch Stock Levels</p>
              </div>
              <div className="h-72 md:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                    <Bar dataKey="ho" name="Head Office" fill="#333333" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="store" name="Branch Store" fill="#f65b13" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Revenue Bar Chart */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Weekly Revenue</h3>
                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Performance by Week</p>
              </div>
              <div className="h-72 md:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                    <Bar dataKey="value" name="Revenue" fill="#f65b13" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Queue Status Bar Chart */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Service Queue Status</h3>
                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Job Sheet Distribution</p>
              </div>
              <div className="h-72 md:h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceQueueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" name="Jobs" radius={[4, 4, 0, 0]} barSize={50}>
                      {serviceQueueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* System Activity Stream - Interactive Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                 <div className="p-2.5 bg-slate-900 text-white rounded-xl"><Activity className="w-5 h-5" /></div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Live Activity Pulse</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {selectedMetric ? `Filtered by ${selectedMetric}` : 'Real-time system telemetry'}
                    </p>
                 </div>
              </div>
              <div className="flex items-center space-x-4">
                 {selectedMetric && (
                    <button onClick={() => setSelectedMetric(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                        Clear Filter <X className="w-3 h-3 ml-1" />
                    </button>
                 )}
                 <button className="text-xs font-black text-[#f65b13] hover:underline uppercase tracking-widest flex items-center">
                    Review Full Audit Log <ArrowRight className="w-3 h-3 ml-2" />
                 </button>
              </div>
            </div>
            
            {renderActivityTable(filteredActivities)}
          </div>
        </>
      )}
    </div>
  );
};

// Modern KPI Card
const KpiCard = ({ title, value, trend, trendUp, icon: Icon, color, onClick, isActive }: any) => {
  const colorClasses: Record<string, string> = {
     orange: 'from-[#f65b13]/5 to-[#f65b13]/10 text-[#f65b13] border-[#f65b13]/20',
     black: 'from-slate-50 to-slate-100 text-slate-900 border-slate-200',
  };

  const accentColors: Record<string, string> = {
    orange: 'bg-[#f65b13]',
    black: 'bg-black',
  };

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border transition-all duration-300 cursor-pointer group relative overflow-hidden
        ${isActive ? 'ring-2 ring-[#f65b13] ring-offset-2 border-[#f65b13]/20 scale-[1.02]' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'}
      `}
    >
       <div className="flex justify-between items-start mb-6 md:mb-8">
          <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl transition-all duration-500 bg-gradient-to-br ${colorClasses[color]} border group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
             <Icon className="w-6 h-6 md:w-7 h-7" />
          </div>
          <div className={`flex items-center text-[9px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
             {trend}
          </div>
       </div>
       <div className="relative z-10">
          <h4 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 tracking-tighter">{value}</h4>
          <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
       </div>
       <div className={`absolute top-0 right-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-opacity ${accentColors[color]} shadow-lg`}></div>
       <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-[0.03] transition-all duration-700 ${accentColors[color]} scale-150`}></div>
    </div>
  );
};

export default Dashboard;