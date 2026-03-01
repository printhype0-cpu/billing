import React, { useState, useMemo } from 'react';
import { Role, Invoice, JobSheet, Staff, PurchaseOrder, InventoryItem, View } from '../types.ts';
import { 
  Plus, Search, FileText, Download, Trash2, CheckCircle2, 
  AlertCircle, DollarSign, Calendar, TrendingUp, Filter, 
  MoreHorizontal, ChevronRight, ArrowUpRight, ArrowDownRight,
  Printer, Share2, Receipt, ShoppingCart, RefreshCw, Trash,
  CreditCard, Briefcase, IndianRupee, PieChart, BarChart, Sparkles,
  Truck, PackageCheck, XCircle, PackagePlus, Wrench, Smartphone, User, X
} from 'lucide-react';
import { analyzeSalesData } from '../services/geminiService.ts';
import { jsPDF } from "jspdf";
import { 
  AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface AccountsModuleProps {
  role: Role;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  jobSheets: JobSheet[];
  setJobSheets: React.Dispatch<React.SetStateAction<JobSheet[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  stores: any[];
  setStores: React.Dispatch<React.SetStateAction<any[]>>;
  onViewChange: (view: View) => void;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  view: 'ACCOUNTS' | 'ACCOUNTS_JOB_SHEET' | 'ACCOUNTS_CREATE_INVOICE' | 'ACCOUNTS_SYNC' | 'FINANCE_SALES' | 'FINANCE_PURCHASES';
  notifySuccess?: (msg?: string) => void;
}

const AccountsModule: React.FC<AccountsModuleProps> = ({ 
  role, invoices, setInvoices, jobSheets, setJobSheets, 
  staffList, stores, onViewChange, purchaseOrders, 
  setPurchaseOrders, inventoryItems, setInventoryItems, view, notifySuccess 
}) => {
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(view === 'ACCOUNTS_CREATE_INVOICE');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Job Sheet State
  const [showJobSheetModal, setShowJobSheetModal] = useState(false);
  const [editingJobSheet, setEditingJobSheet] = useState<JobSheet | null>(null);
  const [jobSheetForm, setJobSheetForm] = useState<Partial<JobSheet>>({
    customerName: '',
    customerPhone: '',
    deviceModel: '',
    issueDescription: '',
    estimatedCost: 0,
    status: 'Received',
    technicianId: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Sales Analysis State
  const [salesInsight, setSalesInsight] = useState<string | null>(null);
  const [isAnalyzingSales, setIsAnalyzingSales] = useState(false);
  
  // Purchase Order State
  const [showPOModal, setShowPOModal] = useState(false);
  const [poFormData, setPoFormData] = useState({
    vendorName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ name: '', qty: 1, price: 0 }]
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    customerName: '',
    customerPhone: '',
    gstNumber: '',
    category: 'Non-GST' as 'GST' | 'Non-GST'
  });

  const [itemLines, setItemLines] = useState<{name: string, qty: number, price: number}[]>([
    { name: '', qty: 1, price: 0 }
  ]);

  const handleClose = () => {
    setShowCreateInvoiceModal(false);
    setEditingInvoice(null);
    setInvoiceFormData({ customerName: '', customerPhone: '', gstNumber: '', category: 'Non-GST' });
    setItemLines([{ name: '', qty: 1, price: 0 }]);
    if (view === 'ACCOUNTS_CREATE_INVOICE') {
      onViewChange('ACCOUNTS');
    }
  };

  const addItemLine = () => {
    setItemLines([...itemLines, { name: '', qty: 1, price: 0 }]);
  };

  const removeItemLine = (index: number) => {
    if (window.confirm("Remove this item line?")) {
      setItemLines(itemLines.filter((_, i) => i !== index));
    }
  };

  const updateItemLine = (index: number, field: keyof typeof itemLines[0], value: string | number) => {
    const newLines = [...itemLines];
    newLines[index] = { ...newLines[index], [field]: value };
    setItemLines(newLines);
  };

  const calculateTotal = (items: typeof itemLines) => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  if (view === 'ACCOUNTS' && invoices.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f65b13]/10 flex items-center justify-center text-[#f65b13]">
            <Receipt />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Invoices Yet</h3>
            <p className="text-slate-500 text-sm">Create your first invoice to get started.</p>
          </div>
          <button onClick={() => setShowCreateInvoiceModal(true)} className="px-5 py-3 bg-[#000000] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95">
            Create Invoice
          </button>
        </div>
      </div>
    );
  }

  if (view === 'FINANCE_PURCHASES' && purchaseOrders.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f65b13]/10 flex items-center justify-center text-[#f65b13]">
            <ShoppingCart />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Purchase Orders</h3>
            <p className="text-slate-500 text-sm">Add a purchase order to track incoming stock.</p>
          </div>
          <button onClick={() => setShowPOModal(true)} className="px-5 py-3 bg-[#000000] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95">
            New Purchase Order
          </button>
        </div>
      </div>
    );
  }

  if (view === 'ACCOUNTS_JOB_SHEET' && jobSheets.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f65b13]/10 flex items-center justify-center text-[#f65b13]">
            <Wrench />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Job Sheets</h3>
            <p className="text-slate-500 text-sm">Create a service ticket to begin.</p>
          </div>
          <button onClick={() => setShowJobSheetModal(true)} className="px-5 py-3 bg-[#000000] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95">
            New Job Sheet
          </button>
        </div>
      </div>
    );
  }

  const handleSaveInvoice = (download: boolean = false) => {
    if (!invoiceFormData.customerName || itemLines.length === 0) return;
    
    const totalAmount = calculateTotal(itemLines);
    
    const newInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : `INV-${Date.now().toString().slice(-6)}`,
      customerName: invoiceFormData.customerName,
      customerPhone: invoiceFormData.customerPhone,
      gstNumber: invoiceFormData.gstNumber,
      category: invoiceFormData.category,
      date: new Date().toISOString().split('T')[0],
      amount: totalAmount,
      status: 'Paid',
      type: 'Sale',
      storeName: role === 'MASTER_ADMIN' ? 'Head Office' : 'Downtown Branch',
      items: itemLines
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? newInvoice : inv));
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
    }

    if (download) {
      handleDownloadInvoice(newInvoice);
    }

    handleClose();
    notifySuccess && notifySuccess(editingInvoice ? 'Updated successfully' : 'Saved successfully');
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header - Company Info
    doc.setFontSize(24);
    doc.setTextColor(246, 91, 19); // Brand Orange #f65b13
    doc.setFont("helvetica", "bold");
    doc.text("TECH WIZARDRY", 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Tech Solutions & Services", 20, 32);
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("GSTIN: 27AAACG1234A1Z1", 20, 42);
    doc.text(`Branch: ${invoice.storeName || 'Main Hub'}`, 20, 47);
    doc.text("Email: support@techwizardry.com", 20, 52);

    // Invoice Meta (Right Side)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 140, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.id}`, 140, 35);
    doc.text(`Date: ${invoice.date}`, 140, 40);
    doc.text(`Status: ${invoice.status}`, 140, 45);
    doc.text(`Category: ${invoice.category || 'Standard'}`, 140, 50);

    // Divider
    doc.setDrawColor(246, 91, 19);
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);

    // Bill To
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 20, 75);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.customerName, 20, 82);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if(invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 20, 88);
    if(invoice.gstNumber) doc.text(`Customer GSTIN: ${invoice.gstNumber}`, 20, 94);

    // Table Header
    const tableTop = 110;
    doc.setFillColor(246, 91, 19);
    doc.rect(20, tableTop, 170, 10, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Description", 25, tableTop + 7);
    doc.text("Qty", 110, tableTop + 7);
    doc.text("Price", 135, tableTop + 7);
    doc.text("Total", 165, tableTop + 7);

    // Items
    let y = tableTop + 18;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    
    const items = invoice.items || [];
    items.forEach((item, index) => {
        // Alternating row background
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(20, y - 6, 170, 10, 'F');
        }
        
        doc.text(item.name, 25, y);
        doc.text(item.qty.toString(), 110, y);
        doc.text(`Rs. ${item.price.toLocaleString()}`, 135, y);
        doc.text(`Rs. ${(item.qty * item.price).toLocaleString()}`, 165, y);
        y += 10;
    });

    // Totals Section
    y += 5;
    doc.setDrawColor(230);
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 120, y);
    doc.setFontSize(14);
    doc.setTextColor(246, 91, 19);
    doc.text(`Rs. ${invoice.amount.toLocaleString()}`, 165, y);

    // Amount in words (Mock)
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    doc.text("Amount received with thanks.", 20, y);

    // Terms and Conditions
    y += 30;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 20, y);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    const terms = [
        "1. Goods once sold will not be taken back or exchanged.",
        "2. Warranty as per manufacturer's policy.",
        "3. Subject to local jurisdiction.",
        "4. This is a computer generated invoice."
    ];
    terms.forEach((term, i) => {
        doc.text(term, 20, y + 6 + (i * 5));
    });

    // Signature Area
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", 150, y + 25);
    doc.line(140, y + 20, 190, y + 20);

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
    doc.text("Developed by Digital AdWords • techwizardry.com", 105, 285, { align: "center" });

    doc.save(`Invoice_${invoice.id}.pdf`);
  };

  // Sales Analytics Calculations
  const salesStats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
    const totalOrders = paidInvoices.length;
    const averageOrderVal = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Group by Date for Chart
    const dateData: Record<string, number> = {};
    paidInvoices.forEach(inv => {
        // Format date as Month Day (e.g., Nov 20)
        const date = new Date(inv.date);
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateData[key] = (dateData[key] || 0) + inv.amount;
    });
    
    const chartData = Object.keys(dateData).map(key => ({
        name: key,
        revenue: dateData[key]
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Basic sorting, might need refinement for 'short' format years
    
    // Group by Week for Bar Chart
    const weeklyData: Record<string, number> = {};
    paidInvoices.forEach(inv => {
        const date = new Date(inv.date);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
        const key = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weeklyData[key] = (weeklyData[key] || 0) + inv.amount;
    });

    const weeklyChartData = Object.keys(weeklyData).map(key => ({
        name: `Week of ${key}`,
        revenue: weeklyData[key]
    })).sort((a, b) => new Date(a.name.replace('Week of ', '')).getTime() - new Date(b.name.replace('Week of ', '')).getTime());

    return { totalRevenue, totalOrders, averageOrderVal, chartData, weeklyChartData };
  }, [invoices]);

  const runSalesAnalysis = async () => {
    setIsAnalyzingSales(true);
    try {
        const paidInvoices = invoices.filter(i => i.status === 'Paid');
        const summary = `
        Total Revenue: ${salesStats.totalRevenue}
        Total Transactions: ${salesStats.totalOrders}
        Average Order Value: ${salesStats.averageOrderVal}
        Transaction History (Last 15):
        ${paidInvoices.slice(-15).map(i => `- Date: ${i.date}, Amount: ${i.amount}, Type: ${i.category || 'N/A'}`).join('\n')}
        `;
        
        const result = await analyzeSalesData(summary);
        setSalesInsight(result);
    } catch (e) {
        console.error(e);
        setSalesInsight("Unable to generate analysis at this time.");
    } finally {
        setIsAnalyzingSales(false);
    }
  };

  // --- Purchase Order Logic ---
  const purchaseStats = useMemo(() => {
     const pending = purchaseOrders.filter(p => p.status === 'Ordered').length;
     const received = purchaseOrders.filter(p => p.status === 'Received').length;
     const draft = purchaseOrders.filter(p => p.status === 'Draft').length;
     const totalSpend = purchaseOrders.filter(p => p.status === 'Received').reduce((acc, curr) => acc + curr.totalAmount, 0);
     return { pending, received, draft, totalSpend };
  }, [purchaseOrders]);

  const uniqueVendors = useMemo(() => {
     const vendors = new Set(inventoryItems.map(i => i.vendor));
     return Array.from(vendors).filter(Boolean).sort();
  }, [inventoryItems]);

  const addPOItemLine = () => {
    setPoFormData(prev => ({
        ...prev,
        items: [...prev.items, { name: '', qty: 1, price: 0 }]
    }));
  };

  const removePOItemLine = (index: number) => {
    if (window.confirm("Remove this purchase item?")) {
      setPoFormData(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePOItemLine = (index: number, field: string, value: any) => {
     const newItems = [...poFormData.items];
     const currentLine = { ...newItems[index], [field]: value };
     
     // Auto-fill price if item name is selected from inventory
     if (field === 'name') {
         const inventoryItem = inventoryItems.find(i => i.name === value);
         if (inventoryItem) {
             currentLine.price = inventoryItem.price; // Cost price (simplified as price here)
         }
     }
     
     newItems[index] = currentLine;
     setPoFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleCreatePO = (status: 'Draft' | 'Ordered') => {
     if (!poFormData.vendorName) return;
     
     const total = poFormData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
     const newPO: PurchaseOrder = {
         id: `PO-${Date.now().toString().slice(-4)}`,
         vendorName: poFormData.vendorName,
         date: poFormData.date,
         items: poFormData.items,
         totalAmount: total,
         status: status
     };
     
     setPurchaseOrders(prev => [newPO, ...prev]);
     setShowPOModal(false);
     setPoFormData({ vendorName: '', date: new Date().toISOString().split('T')[0], items: [{ name: '', qty: 1, price: 0 }] });
     notifySuccess && notifySuccess('Saved successfully');
  };

  const updatePOStatus = (poId: string, newStatus: PurchaseOrder['status']) => {
     if (newStatus === 'Received') {
         // Update Inventory Stock
         const po = purchaseOrders.find(p => p.id === poId);
         if (po) {
             const updatedInventory = inventoryItems.map(invItem => {
                 const poItem = po.items.find(pi => pi.name === invItem.name);
                 if (poItem) {
                     return { ...invItem, quantityHO: invItem.quantityHO + poItem.qty };
                 }
                 return invItem;
             });
             setInventoryItems(updatedInventory);
         }
     }
     setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: newStatus } : p));
  };

  // --- Job Sheet Logic ---
  const jobStats = useMemo(() => {
    const active = jobSheets.filter(j => ['Received', 'Diagnosing', 'Repairing'].includes(j.status)).length;
    const ready = jobSheets.filter(j => j.status === 'Ready').length;
    const pipelineValue = jobSheets.filter(j => j.status !== 'Delivered').reduce((acc, j) => acc + j.estimatedCost, 0);
    return { active, ready, pipelineValue };
  }, [jobSheets]);

  const handleSaveJobSheet = () => {
    if (!jobSheetForm.customerName || !jobSheetForm.deviceModel) return;

    if (editingJobSheet) {
      setJobSheets(prev => prev.map(j => j.id === editingJobSheet.id ? { ...j, ...jobSheetForm } as JobSheet : j));
    } else {
      const newJob: JobSheet = {
        id: `JS-${Date.now().toString().slice(-6)}`,
        customerName: jobSheetForm.customerName || '',
        customerPhone: jobSheetForm.customerPhone || '',
        deviceModel: jobSheetForm.deviceModel || '',
        issueDescription: jobSheetForm.issueDescription || '',
        estimatedCost: jobSheetForm.estimatedCost || 0,
        status: 'Received',
        technicianId: jobSheetForm.technicianId,
        date: new Date().toISOString().split('T')[0],
        storeName: role === 'MASTER_ADMIN' ? 'Head Office' : 'Downtown Branch'
      };
      setJobSheets(prev => [newJob, ...prev]);
    }
    setShowJobSheetModal(false);
    setEditingJobSheet(null);
    setJobSheetForm({
        customerName: '',
        customerPhone: '',
        deviceModel: '',
        issueDescription: '',
        estimatedCost: 0,
        status: 'Received',
        technicianId: '',
        date: new Date().toISOString().split('T')[0],
        storeName: ''
    });
    notifySuccess && notifySuccess(editingJobSheet ? 'Updated successfully' : 'Saved successfully');
  };

  const handleDeleteJobSheet = (id: string) => {
    if (window.confirm("Are you sure you want to delete this job sheet? This action cannot be undone.")) {
      setJobSheets(prev => prev.filter(j => j.id !== id));
    }
  };

  const handleDownloadJobSheet = (job: JobSheet) => {
    const doc = new jsPDF();
    const technician = staffList.find(s => s.id === job.technicianId)?.name || 'Unassigned';

    // Header
    doc.setFontSize(22);
    doc.setTextColor(246, 91, 19);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE TICKET", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("TECH WIZARDRY Pvt Ltd", 20, 25);
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Ticket #${job.id}`, 150, 20);
    doc.text(`Date: ${job.date}`, 150, 25);

    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Customer Info
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${job.customerName}`, 20, 52);
    doc.text(`Phone: ${job.customerPhone}`, 20, 57);

    // Device Info
    doc.setFont("helvetica", "bold");
    doc.text("Device Information", 110, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Model: ${job.deviceModel}`, 110, 52);
    doc.text(`Est. Cost: Rs. ${job.estimatedCost.toLocaleString()}`, 110, 57);

    // Issue Description
    doc.setFont("helvetica", "bold");
    doc.text("Issue Description", 20, 75);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(job.issueDescription, 170);
    doc.text(splitDesc, 20, 82);

    // Internal Info
    let yPos = 82 + (splitDesc.length * 5) + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Internal Use", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`Assigned Technician: ${technician}`, 20, yPos + 7);
    doc.text(`Current Status: ${job.status}`, 20, yPos + 12);
    doc.text(`Store: ${job.storeName}`, 20, yPos + 17);

    // Terms
    yPos += 35;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("TERMS AND CONDITIONS:", 20, yPos);
    doc.text("1. The company is not responsible for data loss. Please backup data before submission.", 20, yPos + 5);
    doc.text("2. Estimated cost is subject to change based on internal damage inspection.", 20, yPos + 9);
    doc.text("3. Devices not claimed within 30 days of completion will be recycled.", 20, yPos + 13);

    // Signatures
    yPos += 30;
    doc.line(20, yPos, 80, yPos);
    doc.text("Customer Signature", 20, yPos + 5);

    doc.line(130, yPos, 190, yPos);
    doc.text("Store Authorization", 130, yPos + 5);

    doc.save(`JobSheet_${job.id}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {view === 'ACCOUNTS' ? 'Invoices & Billing' : 
               view === 'ACCOUNTS_JOB_SHEET' ? 'Job Sheets & Repairs' :
               view === 'FINANCE_SALES' ? 'Sales Analytics' :
               view === 'FINANCE_PURCHASES' ? 'Purchase Orders' : 'Accounts'}
            </h2>
          </div>
          <div className="flex space-x-2">
            {view === 'ACCOUNTS' && (
              <button onClick={() => setShowCreateInvoiceModal(true)} className="flex items-center space-x-2 bg-[#f65b13] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] transition-all text-sm">
                <Plus className="w-4 h-4" />
                <span>New Invoice</span>
              </button>
            )}
            {view === 'FINANCE_PURCHASES' && (
              <button onClick={() => setShowPOModal(true)} className="flex items-center space-x-2 bg-[#f65b13] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] transition-all text-sm">
                <Plus className="w-4 h-4" />
                <span>Create PO</span>
              </button>
            )}
            {view === 'ACCOUNTS_JOB_SHEET' && (
              <button 
                onClick={() => {
                    setEditingJobSheet(null);
                    setJobSheetForm({
                        customerName: '', customerPhone: '', deviceModel: '', issueDescription: '', 
                        estimatedCost: 0, status: 'Received', technicianId: '', date: new Date().toISOString().split('T')[0]
                    });
                    setShowJobSheetModal(true);
                }} 
                className="flex items-center space-x-2 bg-[#f65b13] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Ticket</span>
              </button>
            )}
          </div>
       </div>

       {view === 'ACCOUNTS' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Invoice ID</th>
                    <th className="px-8 py-5">Customer</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Date</th>
                    <th className="px-8 py-5 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-8 py-4 font-mono text-xs font-bold text-slate-500">{inv.id}</td>
                      <td className="px-8 py-4 font-bold text-slate-800">{inv.customerName}</td>
                      <td className="px-8 py-4 text-right font-black text-slate-900">₹{inv.amount.toLocaleString()}</td>
                      <td className="px-8 py-4 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{inv.status}</span>
                      </td>
                      <td className="px-8 py-4 text-right text-xs text-slate-500 font-bold">{inv.date}</td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => handleDownloadInvoice(inv)}
                          className="p-2 text-slate-400 hover:text-[#f65b13] hover:bg-orange-50 rounded-xl transition-all"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-slate-400">No invoices found.</td>
                      </tr>
                  )}
                </tbody>
             </table>
          </div>
       )}

       {(showCreateInvoiceModal || view === 'ACCOUNTS_CREATE_INVOICE') && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm" onClick={handleClose}>
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="p-10 space-y-6">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                            {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
                        </h3>
                        
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2">
                            <button
                                type="button"
                                onClick={() => setInvoiceFormData(prev => ({ ...prev, category: 'GST' }))}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    invoiceFormData.category === 'GST' 
                                        ? 'bg-white text-[#f65b13] shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                GST Invoice
                            </button>
                            <button
                                type="button"
                                onClick={() => setInvoiceFormData(prev => ({ ...prev, category: 'Non-GST' }))}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    invoiceFormData.category === 'Non-GST' 
                                        ? 'bg-white text-slate-900 shadow-md' 
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Non-GST Invoice
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-4 border border-slate-300 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10" placeholder="Customer Name" value={invoiceFormData.customerName} onChange={e => setInvoiceFormData({...invoiceFormData, customerName: e.target.value})} />
                            <input className="p-4 border border-slate-300 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10" placeholder="Phone" value={invoiceFormData.customerPhone} onChange={e => setInvoiceFormData({...invoiceFormData, customerPhone: e.target.value})} />
                        </div>

                        {invoiceFormData.category === 'GST' && (
                            <input 
                                className="w-full p-4 border border-slate-300 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10" 
                                placeholder="Customer GSTIN (Optional)" 
                                value={invoiceFormData.gstNumber} 
                                onChange={e => setInvoiceFormData({...invoiceFormData, gstNumber: e.target.value})} 
                            />
                        )}

                         <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                             {itemLines.map((line, idx) => (
                                 <div key={idx} className="flex space-x-2">
                                     <input className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Item" value={line.name} onChange={e => updateItemLine(idx, 'name', e.target.value)} />
                                     <input className="w-20 p-3 border border-slate-200 rounded-xl text-sm font-bold" type="number" placeholder="Qty" value={line.qty} onChange={e => updateItemLine(idx, 'qty', parseInt(e.target.value))} />
                                     <input className="w-24 p-3 border border-slate-200 rounded-xl text-sm font-bold" type="number" placeholder="Price" value={line.price} onChange={e => updateItemLine(idx, 'price', parseFloat(e.target.value))} />
                                     <button onClick={() => removeItemLine(idx)} className="p-3 text-slate-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
                                 </div>
                             ))}
                             <button onClick={addItemLine} className="text-xs font-black text-[#f65b13] uppercase tracking-widest mt-2 hover:underline">+ Add Item Line</button>
                         </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <span className="text-xl font-black text-slate-900">Total: ₹{calculateTotal(itemLines).toLocaleString()}</span>
                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => handleSaveInvoice(true)} 
                                    className="px-6 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Save & PDF
                                </button>
                                <button 
                                    onClick={() => handleSaveInvoice(false)} 
                                    className="px-8 py-4 bg-[#000000] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#f65b13] transition-all shadow-lg shadow-black/20"
                                >
                                    Save Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* JOB SHEETS DASHBOARD */}
        {view === 'ACCOUNTS_JOB_SHEET' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Repairs</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-blue-600">{jobStats.active}</p>
                       <Wrench className="w-6 h-6 text-blue-200" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ready For Pickup</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-emerald-600">{jobStats.ready}</p>
                       <PackageCheck className="w-6 h-6 text-emerald-200" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Pipeline Value</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-[#f65b13]">₹{jobStats.pipelineValue.toLocaleString()}</p>
                       <TrendingUp className="w-6 h-6 text-[#f65b13]/40" />
                    </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="px-8 py-5">Job ID</th>
                         <th className="px-8 py-5">Customer & Device</th>
                         <th className="px-8 py-5">Technician</th>
                         <th className="px-8 py-5 text-center">Status</th>
                         <th className="px-8 py-5 text-right">Est. Cost</th>
                         <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {jobSheets.map(job => (
                         <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                               <p className="text-xs font-black text-slate-800 font-mono">{job.id}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{job.date}</p>
                            </td>
                            <td className="px-8 py-4">
                               <div className="font-bold text-slate-800 text-sm">{job.customerName}</div>
                               <div className="text-xs text-slate-500 font-medium flex items-center">
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  {job.deviceModel}
                               </div>
                            </td>
                            <td className="px-8 py-4 text-xs font-bold text-slate-600">
                               {staffList.find(s => s.id === job.technicianId)?.name || <span className="text-slate-400 italic">Unassigned</span>}
                            </td>
                            <td className="px-8 py-4 text-center">
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                  job.status === 'Ready' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  job.status === 'Repairing' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  job.status === 'Diagnosing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  job.status === 'Delivered' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                               }`}>
                                  {job.status}
                               </span>
                            </td>
                            <td className="px-8 py-4 text-right font-black text-slate-900">₹{job.estimatedCost.toLocaleString()}</td>
                            <td className="px-8 py-4 text-right">
                               <div className="flex items-center justify-end space-x-2">
                                  <button onClick={() => handleDownloadJobSheet(job)} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Print Job Card">
                                     <Printer className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                        setEditingJobSheet(job);
                                        setJobSheetForm(job);
                                        setShowJobSheetModal(true);
                                    }} 
                                    className="p-2 text-slate-400 hover:text-[#f65b13] transition-all" 
                                    title="Edit Ticket"
                                  >
                                     <FileText className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteJobSheet(job.id)} 
                                    className="p-2 text-slate-400 hover:text-red-600 transition-all" 
                                    title="Delete Ticket"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {jobSheets.length === 0 && (
                         <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-400">No active job sheets found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Create/Edit Job Sheet Modal */}
        {showJobSheetModal && (
           <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm" onClick={() => setShowJobSheetModal(false)}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{editingJobSheet ? 'Update Ticket' : 'New Service Job'}</h3>
                    <button onClick={() => setShowJobSheetModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                 </div>
                 <div className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                          <input className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={jobSheetForm.customerName} onChange={e => setJobSheetForm({...jobSheetForm, customerName: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                          <input className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={jobSheetForm.customerPhone} onChange={e => setJobSheetForm({...jobSheetForm, customerPhone: e.target.value})} />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Device Model</label>
                          <input className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={jobSheetForm.deviceModel} onChange={e => setJobSheetForm({...jobSheetForm, deviceModel: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Est. Cost</label>
                          <input type="number" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={jobSheetForm.estimatedCost} onChange={e => setJobSheetForm({...jobSheetForm, estimatedCost: parseInt(e.target.value) || 0})} />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Description</label>
                       <textarea className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold min-h-[80px]" value={jobSheetForm.issueDescription} onChange={e => setJobSheetForm({...jobSheetForm, issueDescription: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technician</label>
                          <select className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white" value={jobSheetForm.technicianId} onChange={e => setJobSheetForm({...jobSheetForm, technicianId: e.target.value})}>
                             <option value="">Unassigned</option>
                             {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                          <select className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white" value={jobSheetForm.status} onChange={e => setJobSheetForm({...jobSheetForm, status: e.target.value as any})}>
                             <option value="Received">Received</option>
                             <option value="Diagnosing">Diagnosing</option>
                             <option value="Repairing">Repairing</option>
                             <option value="Ready">Ready</option>
                             <option value="Delivered">Delivered</option>
                          </select>
                       </div>
                    </div>

                    <button onClick={handleSaveJobSheet} className="w-full py-5 bg-[#000000] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-[#f65b13] active:scale-95 transition-all mt-4">
                       {editingJobSheet ? 'Update Ticket' : 'Create Job Sheet'}
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* SALES ANALYTICS DASHBOARD */}
        {view === 'FINANCE_SALES' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Control Bar */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Real-time revenue intelligence and performance tracking</p>
                <button 
                    onClick={runSalesAnalysis} 
                    disabled={isAnalyzingSales}
                    className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-[#f65b13] transition-all text-sm disabled:opacity-70 active:scale-95"
                >
                    {isAnalyzingSales ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#f65b13]" />}
                    <span>Generate AI Report</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><IndianRupee className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">₹{salesStats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform"><ShoppingCart className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Transactions</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{salesStats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5" /></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Avg. Order Value</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">₹{salesStats.averageOrderVal.toFixed(0)}</p>
                </div>
            </div>

            {/* AI Insight Section */}
            {salesInsight && (
                <div className="bg-gradient-to-br from-[#f65b13]/5 to-orange-50 p-8 rounded-[2rem] border border-[#f65b13]/10 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center space-x-3 mb-4 relative z-10">
                        <Sparkles className="w-5 h-5 text-[#f65b13] animate-pulse" />
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Gemini Strategic Analysis</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-600 font-medium relative z-10 leading-relaxed">
                         {salesInsight.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                    </div>
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 pointer-events-none">
                        <Sparkles className="w-32 h-32 text-[#f65b13]" />
                    </div>
                </div>
            )}

            {/* Main Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-3 text-slate-400" />
                        Revenue Trend (Daily)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesStats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f65b13" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f65b13" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
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
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                    cursor={{ stroke: '#f65b13', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#f65b13" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorSales)" 
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center">
                        <BarChart className="w-5 h-5 mr-3 text-slate-400" />
                        Revenue by Week
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={salesStats.weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                    dy={10}
                                    tickFormatter={(val) => val.replace('Week of ', '')}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                />
                                <Bar 
                                    dataKey="revenue" 
                                    name="Weekly Revenue" 
                                    fill="#f65b13" 
                                    radius={[8, 8, 0, 0]} 
                                    barSize={40}
                                />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
          </div>
        )}

        {view === 'FINANCE_PURCHASES' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Orders</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-blue-600">{purchaseStats.pending}</p>
                       <Truck className="w-6 h-6 text-blue-200" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Drafts</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-slate-700">{purchaseStats.draft}</p>
                       <FileText className="w-6 h-6 text-slate-200" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Expenditure (Rec'd)</p>
                    <div className="flex justify-between items-end">
                       <p className="text-3xl font-black text-emerald-600">₹{purchaseStats.totalSpend.toLocaleString()}</p>
                       <DollarSign className="w-6 h-6 text-emerald-200" />
                    </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <th className="px-8 py-5">PO Number</th>
                         <th className="px-8 py-5">Vendor</th>
                         <th className="px-8 py-5">Date</th>
                         <th className="px-8 py-5 text-right">Total</th>
                         <th className="px-8 py-5 text-center">Status</th>
                         <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {purchaseOrders.map(po => (
                         <tr key={po.id} className="hover:bg-slate-50/50">
                            <td className="px-8 py-4 font-mono text-xs font-bold text-slate-500">{po.id}</td>
                            <td className="px-8 py-4 font-bold text-slate-800">{po.vendorName}</td>
                            <td className="px-8 py-4 text-xs font-bold text-slate-500">{po.date}</td>
                            <td className="px-8 py-4 text-right font-black text-slate-900">₹{po.totalAmount.toLocaleString()}</td>
                            <td className="px-8 py-4 text-center">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                  po.status === 'Received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  po.status === 'Ordered' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  po.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-slate-50 text-slate-500 border-slate-200'
                               }`}>
                                  {po.status}
                               </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <div className="flex items-center justify-end space-x-2">
                                  {po.status === 'Draft' && (
                                     <>
                                        <button onClick={() => updatePOStatus(po.id, 'Ordered')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Place Order"><Truck className="w-4 h-4" /></button>
                                        <button onClick={() => updatePOStatus(po.id, 'Cancelled')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Cancel"><XCircle className="w-4 h-4" /></button>
                                     </>
                                  )}
                                  {po.status === 'Ordered' && (
                                     <button onClick={() => updatePOStatus(po.id, 'Received')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Receive Stock"><PackageCheck className="w-4 h-4" /></button>
                                  )}
                                  <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl" title="View Details"><FileText className="w-4 h-4" /></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {purchaseOrders.length === 0 && (
                         <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-400">No purchase orders found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Create PO Modal */}
        {showPOModal && (
           <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm" onClick={() => setShowPOModal(false)}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">New Purchase Order</h3>
                    <button onClick={() => setShowPOModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><Trash2 className="w-6 h-6" /></button>
                 </div>
                 <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor</label>
                          <input 
                            list="vendors" 
                            className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white" 
                            placeholder="Select or type..."
                            value={poFormData.vendorName}
                            onChange={e => setPoFormData({...poFormData, vendorName: e.target.value})}
                          />
                          <datalist id="vendors">
                             {uniqueVendors.map(v => <option key={v} value={v} />)}
                          </datalist>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Date</label>
                          <input 
                            type="date"
                            className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white"
                            value={poFormData.date}
                            onChange={e => setPoFormData({...poFormData, date: e.target.value})}
                          />
                       </div>
                    </div>

                    <div>
                       <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</label>
                          <button onClick={addPOItemLine} className="text-[10px] font-black text-[#f65b13] uppercase tracking-widest hover:underline">+ Add Line</button>
                       </div>
                       <div className="space-y-3">
                          {poFormData.items.map((item, idx) => (
                             <div key={idx} className="flex space-x-2">
                                <input 
                                  list="inventoryItems"
                                  className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-bold" 
                                  placeholder="Item Name" 
                                  value={item.name} 
                                  onChange={e => updatePOItemLine(idx, 'name', e.target.value)} 
                                />
                                <input 
                                  type="number" 
                                  className="w-20 p-3 border border-slate-200 rounded-xl text-sm font-bold" 
                                  placeholder="Qty" 
                                  value={item.qty} 
                                  onChange={e => updatePOItemLine(idx, 'qty', parseInt(e.target.value))} 
                                />
                                <input 
                                  type="number" 
                                  className="w-24 p-3 border border-slate-200 rounded-xl text-sm font-bold" 
                                  placeholder="Cost" 
                                  value={item.price} 
                                  onChange={e => updatePOItemLine(idx, 'price', parseFloat(e.target.value))} 
                                />
                                <button onClick={() => removePOItemLine(idx)} className="p-3 text-slate-300 hover:text-red-500"><Trash className="w-4 h-4" /></button>
                             </div>
                          ))}
                          <datalist id="inventoryItems">
                             {inventoryItems.map(i => <option key={i.id} value={i.name}>{i.sku} - Stock: {i.quantityHO}</option>)}
                          </datalist>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
                       <span className="font-black text-slate-500 uppercase text-xs">Estimated Total</span>
                       <span className="text-xl font-black text-slate-900">₹{poFormData.items.reduce((acc, i) => acc + (i.qty * i.price), 0).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => handleCreatePO('Draft')} className="py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Save as Draft</button>
                       <button onClick={() => handleCreatePO('Ordered')} className="py-4 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all">Place Order</button>
                    </div>
                 </div>
              </div>
           </div>
        )}
    </div>
  );
};

export default AccountsModule;
