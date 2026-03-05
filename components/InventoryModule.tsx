import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Role, InventoryItem, Staff, StockTransfer, TransferStatus, Vendor } from '../types.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Package, Truck, ArrowRightLeft, Mail, AlertTriangle, Plus, Tag, Wrench, 
  RotateCcw, Building2, CheckCircle2, ArrowRight, X, Pencil, IndianRupee, 
  AlertCircle, Sparkles, Search, Trash2, Filter, CheckCircle, Trash,
  ChevronDown, Layers, Info, ListPlus, Send, User, Clock, ShieldCheck, History,
  ClipboardList, ArrowDownLeft, FolderPlus, FolderKanban, MoreVertical, Eye, EyeOff,
  MoveHorizontal, MapPin, ChevronRight, UserCircle, Zap, Verified, ShieldAlert,
  Copy, RefreshCw, BarChart3, PieChart as PieIcon, TrendingUp, DollarSign, Calendar,
  FileSpreadsheet, CheckSquare, Square, Phone, Receipt, Star, ArrowLeft, Download,
  LayoutGrid, List
} from 'lucide-react';
import { draftVendorEmail, draftBulkRestockEmail } from '../services/geminiService.ts';
import { inventoryService } from '../src/services/inventoryService.ts';

interface InventoryModuleProps {
  role: Role;
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  staffList?: Staff[];
  returnLogs?: any[];
  setReturnLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  stockTransfers?: StockTransfer[];
  setStockTransfers?: React.Dispatch<React.SetStateAction<StockTransfer[]>>;
  stores?: any[];
  vendors?: Vendor[];
  setVendors?: React.Dispatch<React.SetStateAction<Vendor[]>>;
  view?: 
    | 'INVENTORY_MANAGEMENT'
    | 'INVENTORY_CATEGORIES'
    | 'INVENTORY_STOCK_CONTROL'
    | 'INVENTORY_VENDOR'
    | 'INVENTORY_TRANSFER'
    | 'INVENTORY_STORE_STOCK'
    | 'INVENTORY_PARTS_USAGE'
    | 'INVENTORY_TOOLS_TRACKING'
    | 'INVENTORY_RETURN_LOGS'
    | 'INVENTORY_MAIN'
    | 'INVENTORY_UPLOADS';
  notifySuccess?: (msg?: string) => void;
}

interface InventoryFormLine {
  name: string;
  sku: string;
  quantityHO: number;
  quantityStore: number;
  price: number;
  reorderLevel: number;
  category: string;
  uploadDate: string;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ 
  role, items, setItems, categories, setCategories, view = 'INVENTORY_MAIN', returnLogs = [], setReturnLogs,
  stockTransfers = [], setStockTransfers, stores = [], vendors = [], setVendors, notifySuccess
}) => {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batchVendor, setBatchVendor] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  
  // Uploads & Logs State
  const [uploadDateFilter, setUploadDateFilter] = useState('');
  const [bulkTransferDestination, setBulkTransferDestination] = useState('');
  const [itemsToTransfer, setItemsToTransfer] = useState<{id: string, name: string, qty: number}[]>([]);

  // Selection & Excel Upload State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vendor Management State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('All'); // 'All', 'Active', 'Inactive'
  const [vendorProductDateFilter, setVendorProductDateFilter] = useState('');
  const [vendorViewMode, setVendorViewMode] = useState<'Table' | 'Grid'>('Table');
  const [vendorProductSearch, setVendorProductSearch] = useState('');
  const vendorCsvInputRef = useRef<HTMLInputElement>(null);
  const [newVendorData, setNewVendorData] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', gstIn: '', status: 'Active', rating: 5.0
  });

  // Category View State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Restock Email State
  const [draftingItem, setDraftingItem] = useState<InventoryItem | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [bulkEmailDrafts, setBulkEmailDrafts] = useState<{vendor: string, draft: string}[]>([]);
  const [showBulkDraftModal, setShowBulkDraftModal] = useState(false);

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    itemId: '',
    quantity: 1,
    source: 'Head Office',
    destination: stores[0]?.name || ''
  });

  // Advanced Filter State
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    category: 'All',
    vendor: 'All',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'All', // 'All', 'Low Stock', 'In Stock', 'Out of Stock'
    startDate: '',
    endDate: ''
  });

  const [itemLines, setItemLines] = useState<InventoryFormLine[]>([
    { name: '', sku: '', quantityHO: 0, quantityStore: 0, price: 0, reorderLevel: 50, category: categories[0] || 'General', uploadDate: new Date().toISOString().split('T')[0] }
  ]);

  // Clear selections when view changes
  useEffect(() => {
    setSelectedItemIds([]);
    setSelectedVendor(null); // Reset vendor selection when switching views
    setActiveCategory(null); // Reset active category
  }, [view]);

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleSaveItems = () => {
    const validLines = itemLines.filter(line => line.name && line.sku);
    if (validLines.length === 0) return;

    if (editingId) {
        const line = validLines[0];
        setItems(prev => prev.map(item => item.id === editingId ? {
            ...item,
            name: line.name,
            category: line.category,
            sku: line.sku,
            quantityHO: Number(line.quantityHO) || 0,
            quantityStore: Number(line.quantityStore) || 0,
            price: Number(line.price) || 0,
            // Preserve existing vendor if not explicitly set in batch mode, or use batchVendor if adding new
            vendor: batchVendor || item.vendor || 'Generic Vendor',
            reorderLevel: Number(line.reorderLevel) || 50,
            uploadDate: line.uploadDate || new Date().toISOString().split('T')[0]
        } : item));
    } else {
        const newItems: InventoryItem[] = validLines.map(line => ({
            id: (Date.now() + Math.random()).toString(),
            name: line.name,
            category: line.category,
            sku: line.sku,
            quantityHO: Number(line.quantityHO) || 0,
            quantityStore: Number(line.quantityStore) || 0,
            price: Number(line.price) || 0,
            vendor: batchVendor || 'Generic Vendor',
            reorderLevel: Number(line.reorderLevel) || 50,
            uploadDate: line.uploadDate || new Date().toISOString().split('T')[0]
        }));
        setItems(prev => [...prev, ...newItems]);
    }
    handleCloseModal();
    notifySuccess && notifySuccess(editingId ? 'Updated successfully' : 'Saved successfully');
  };

  const downloadCsvTemplate = () => {
    const headers = "Name,SKU,Category,Price,QuantityHO,QuantityStore,ReorderLevel,Vendor";
    const example = "iPhone Screen,PRT-IP15,Parts,120,500,20,50,TechParts Inc.";
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        alert("Please upload a valid CSV file. You can download the template for the correct format.");
        return;
    }

    setIsImporting(true);
    const text = await file.text();

    // try backend import
    try {
      const result = await inventoryService.importCsv(text);
      notifySuccess && notifySuccess(`Imported ${result.created} items (${result.updated} updated, ${result.skipped} skipped)`);
      const all = await inventoryService.fetchAll();
      if (all && all.length) setItems(all as InventoryItem[]);
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    } catch (err) {
      console.warn('backend import failed, falling back to client parser', err);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("Empty file");

            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) throw new Error("File contains no data rows");

            let headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
            const required = ['name', 'sku'];
            const missing = required.filter(r => !headers.includes(r));
            if (missing.length) {
                alert(`Missing required column(s): ${missing.join(', ')}. Please use the template.`);
                return;
            }

            const rawItems: InventoryItem[] = [];

            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length < 2) continue;

                const item: any = {};
                headers.forEach((h, index) => {
                    item[h] = values[index];
                });

                if (item.name && item.sku) {
                    rawItems.push({
                        id: `IMP-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                        name: item.name,
                        sku: item.sku,
                        category: item.category || 'General',
                        price: parseFloat(item.price) || 0,
                        quantityHO: parseInt(item.quantityho) || parseInt(item.quantity) || 0,
                        quantityStore: parseInt(item.quantitystore) || 0,
                        reorderLevel: parseInt(item.reorderlevel) || 10,
                        vendor: item.vendor || 'Imported',
                        uploadDate: new Date().toISOString().split('T')[0]
                    });
                }
            }

            // filter duplicates against existing items and within file
            const existingNames = new Set(items.map(i => i.name.toLowerCase()));
            const existingSkus = new Set(items.map(i => i.sku.toLowerCase()));
            const unique: InventoryItem[] = [];
            const skipped: string[] = [];
            rawItems.forEach(it => {
                const nameKey = it.name.toLowerCase();
                const skuKey = it.sku.toLowerCase();
                if (existingNames.has(nameKey) || existingSkus.has(skuKey)) {
                    skipped.push(it.name);
                } else {
                    existingNames.add(nameKey);
                    existingSkus.add(skuKey);
                    unique.push(it);
                }
            });

            if (skipped.length) {
                alert(`Skipped ${skipped.length} duplicate item(s): ${skipped.join(', ')}`);
            }

            if (unique.length > 0) {
                setItems(prev => [...prev, ...unique]);
                alert(`Successfully imported ${unique.length} item(s) from ${file.name}`);
            } else {
                alert("No valid items found in the file. Please check the format.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse CSV file. Please ensure it follows the template format.");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    reader.onerror = () => {
        alert("Error reading file");
        setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const downloadVendorCsvTemplate = () => {
    const headers = "Name,SKU,Category,Price,QuantityHO,QuantityStore,ReorderLevel";
    const example = "Vendor Screen,V-SCR-01,Parts,500,50,0,10";
    const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "vendor_catalog_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleVendorCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVendor) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        alert("Please upload a valid CSV file.");
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("Empty file");

            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) throw new Error("File contains no data rows");

            let headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s/g, ''));
            const required = ['name'];
            const missing = required.filter(r => !headers.includes(r));
            if (missing.length) {
                alert(`Missing required column(s): ${missing.join(', ')}. Please use the template.`);
                return;
            }

            const rawItems: InventoryItem[] = [];

            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length < 1) continue;

                const item: any = {};
                headers.forEach((h, index) => {
                    item[h] = values[index];
                });

                if (item.name) {
                    rawItems.push({
                        id: `V-IMP-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                        name: item.name,
                        sku: item.sku || `V-${selectedVendor.id}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                        category: item.category || 'General',
                        price: parseFloat(item.price) || 0,
                        quantityHO: parseInt(item.quantityho) || parseInt(item.quantity) || 0,
                        quantityStore: parseInt(item.quantitystore) || 0,
                        reorderLevel: parseInt(item.reorderlevel) || 10,
                        vendor: selectedVendor.name,
                        uploadDate: new Date().toISOString().split('T')[0]
                    });
                }
            }

            // dedupe against existing and within file
            const existingNames = new Set(items.map(i => i.name.toLowerCase()));
            const unique: InventoryItem[] = [];
            const skipped: string[] = [];
            rawItems.forEach(it => {
                const key = it.name.toLowerCase();
                if (existingNames.has(key)) {
                    skipped.push(it.name);
                } else {
                    existingNames.add(key);
                    unique.push(it);
                }
            });
            if (skipped.length) {
                alert(`Skipped ${skipped.length} duplicate item(s): ${skipped.join(', ')}`);
            }

            if (unique.length > 0) {
                setItems(prev => [...prev, ...unique]);
                alert(`Successfully imported ${unique.length} items for ${selectedVendor.name}`);
            } else {
                alert("No valid items found in the file.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse CSV file. Please ensure it follows the standard format.");
        } finally {
            setIsImporting(false);
            if (vendorCsvInputRef.current) vendorCsvInputRef.current.value = '';
        }
    };

    reader.onerror = () => {
        alert("Error reading file");
        setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const handleCreateVendor = () => {
    if (!newVendorData.name || !setVendors) return;
    const newVendor: Vendor = {
        id: `VEN-${Date.now()}`,
        ...newVendorData,
        status: newVendorData.status as 'Active' | 'Inactive',
        rating: Number(newVendorData.rating)
    };
    setVendors(prev => [...prev, newVendor]);
    setNewVendorData({ name: '', contactPerson: '', phone: '', email: '', address: '', gstIn: '', status: 'Active', rating: 5.0 });
    setShowAddVendorModal(false);
    notifySuccess && notifySuccess('Vendor saved');
  };

  const handleEditItem = (item: InventoryItem) => {
    setBatchVendor(item.vendor);
    setItemLines([{
        name: item.name,
        sku: item.sku,
        quantityHO: item.quantityHO,
        quantityStore: item.quantityStore,
        price: item.price,
        reorderLevel: item.reorderLevel || 50,
        category: item.category,
        uploadDate: item.uploadDate || new Date().toISOString().split('T')[0]
    }]);
    setEditingId(item.id);
    setShowAddItemModal(true);
  };

  const handleQuickTransfer = (item: InventoryItem) => {
    setTransferData({
      itemId: item.id,
      quantity: 1,
      source: 'Head Office',
      destination: stores[0]?.name || ''
    });
    setShowTransferModal(true);
  };

  const handleCloseModal = () => {
      setShowAddItemModal(false);
      setShowTransferModal(false);
      setShowBulkTransferModal(false);
      setShowAddVendorModal(false);
      setEditingId(null);
      setBatchVendor('');
      setItemLines([{ name: '', sku: '', quantityHO: 0, quantityStore: 0, price: 0, reorderLevel: 50, category: categories[0] || 'General', uploadDate: new Date().toISOString().split('T')[0] }]);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowAddCategoryModal(false);
      notifySuccess && notifySuccess('Category added');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (items.some(i => i.category === cat)) {
        alert("Cannot delete category containing active items. Please reassign items first.");
        return;
    }
    if (window.confirm(`Delete category "${cat}"?`)) {
        setCategories(prev => prev.filter(c => c !== cat));
    }
  };

  if (view === 'INVENTORY_MAIN' && items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#f65b13]/10 flex items-center justify-center text-[#f65b13]">
            <Package />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Inventory Yet</h3>
            <p className="text-slate-500 text-sm">Start by adding your first item.</p>
          </div>
          <button onClick={() => setShowAddItemModal(true)} className="px-5 py-3 bg-[#000000] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f65b13] transition-all active:scale-95">
            Add Items
          </button>
        </div>
      </div>
    );
  }

  const handleInitiateTransfer = () => {
    if (!transferData.itemId || !transferData.source || !transferData.destination || transferData.quantity <= 0) {
      alert("Please provide valid transfer details.");
      return;
    }
    if (transferData.source === transferData.destination) {
      alert("Source and Destination must be different.");
      return;
    }

    const item = items.find(i => i.id === transferData.itemId);
    if (!item) return;

    if (transferData.source === 'Head Office' && item.quantityHO < transferData.quantity) {
      alert("Insufficient stock at Head Office.");
      return;
    }
    if (transferData.source !== 'Head Office' && item.quantityStore < transferData.quantity) {
      alert("Insufficient stock at Branch.");
      return;
    }

    const newTransfer: StockTransfer = {
      id: `TRF-${Date.now().toString().slice(-4)}`,
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      quantity: transferData.quantity,
      source: transferData.source,
      destination: transferData.destination,
      status: 'Pending',
      initiatedBy: role,
      date: new Date().toISOString().split('T')[0]
    };

    if (setStockTransfers) {
      setStockTransfers(prev => [newTransfer, ...prev]);
    }
    setShowTransferModal(false);
  };

  const updateTransferStatus = (transferId: string, newStatus: TransferStatus) => {
    if (!setStockTransfers) return;
    
    // Find the transfer first to do logic checks
    const transfer = stockTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    // Case 1: Pending -> In-Transit (Deduct from Source)
    if (transfer.status === 'Pending' && newStatus === 'In-Transit') {
        const item = items.find(i => i.id === transfer.itemId);
        if (!item) { alert("Item not found"); return; }
        
        if (transfer.source === 'Head Office' && item.quantityHO < transfer.quantity) {
            alert("Insufficient Stock at Head Office to start transit.");
            return;
        }
        if (transfer.source !== 'Head Office' && item.quantityStore < transfer.quantity) {
            alert("Insufficient Stock at Branch to start transit.");
            return;
        }

        // Deduct from Source
        setItems(prev => prev.map(i => {
            if (i.id === transfer.itemId) {
                const updated = { ...i };
                if (transfer.source === 'Head Office') updated.quantityHO -= transfer.quantity;
                else updated.quantityStore -= transfer.quantity;
                return updated;
            }
            return i;
        }));
    }

    // Case 2: In-Transit -> Completed (Add to Destination)
    else if (transfer.status === 'In-Transit' && newStatus === 'Completed') {
        setItems(prev => prev.map(i => {
            if (i.id === transfer.itemId) {
                const updated = { ...i };
                if (transfer.destination === 'Head Office') updated.quantityHO += transfer.quantity;
                else updated.quantityStore += transfer.quantity;
                return updated;
            }
            return i;
        }));
    }

    // Case 3: In-Transit -> Cancelled (Refund Source)
    else if (transfer.status === 'In-Transit' && newStatus === 'Cancelled') {
        setItems(prev => prev.map(i => {
            if (i.id === transfer.itemId) {
                const updated = { ...i };
                if (transfer.source === 'Head Office') updated.quantityHO += transfer.quantity;
                else updated.quantityStore += transfer.quantity;
                return updated;
            }
            return i;
        }));
    }

    setStockTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: newStatus } : t));
  };

  const handleStartDrafting = async (item: InventoryItem) => {
    setDraftingItem(item);
    setIsDrafting(true);
    setEmailDraft('');
    try {
      const restockQty = Math.max(item.reorderLevel * 2, 50);
      const draft = await draftVendorEmail(item.vendor || 'Supplier', item.name, restockQty);
      setEmailDraft(draft);
    } catch (error) {
      setEmailDraft("Failed to generate draft. Please check your connection.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleBulkRestock = async () => {
    if (selectedItemIds.length === 0) return;

    const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
    const lowStockItems = selectedItems.filter(i => i.quantityHO <= i.reorderLevel);

    if (lowStockItems.length === 0) {
      alert("Please select at least one low-stock item to restock.");
      return;
    }

    setIsDrafting(true);
    setShowBulkDraftModal(true);
    setBulkEmailDrafts([]);

    // Group by vendor
    const vendorGroups: Record<string, { name: string, quantity: number }[]> = {};
    lowStockItems.forEach(item => {
      const vendor = item.vendor || 'Generic Vendor';
      if (!vendorGroups[vendor]) {
        vendorGroups[vendor] = [];
      }
      vendorGroups[vendor].push({
        name: item.name,
        quantity: Math.max(item.reorderLevel * 2, 50) // Default restock quantity logic
      });
    });

    try {
      const drafts = await Promise.all(
        Object.entries(vendorGroups).map(async ([vendor, items]) => {
          const draft = await draftBulkRestockEmail(vendor, items);
          return { vendor, draft };
        })
      );
      setBulkEmailDrafts(drafts);
    } catch (error) {
      console.error("Bulk drafting failed", error);
      alert("Failed to generate bulk drafts.");
      setShowBulkDraftModal(false);
    } finally {
      setIsDrafting(false);
    }
  };

  const initiateBulkTransfer = () => {
    if (!uploadDateFilter) return;
    const filteredItems = items.filter(i => i.uploadDate === uploadDateFilter && i.quantityHO > 0);
    
    if (filteredItems.length === 0) {
      alert('No stock available to transfer from this upload date.');
      return;
    }

    setItemsToTransfer(filteredItems.map(i => ({ id: i.id, name: i.name, qty: i.quantityHO })));
    setBulkTransferDestination(stores[0]?.name || '');
    setShowBulkTransferModal(true);
  };

  const initiateBulkTransferFromSelection = () => {
    if (selectedItemIds.length === 0) return;
    
    const selectedItems = items.filter(i => selectedItemIds.includes(i.id) && i.quantityHO > 0);
    if (selectedItems.length === 0) {
        alert("Selected items have no stock available to transfer.");
        return;
    }

    setItemsToTransfer(selectedItems.map(i => ({ id: i.id, name: i.name, qty: 1 }))); // Default qty 1 for selection
    setBulkTransferDestination(stores[0]?.name || '');
    setShowBulkTransferModal(true);
  };

  const handleConfirmBulkTransfer = () => {
    if (!setStockTransfers) return;
    if (itemsToTransfer.some(i => i.qty <= 0)) {
        alert("Transfer quantities must be greater than 0.");
        return;
    }

    const newTransfers: StockTransfer[] = itemsToTransfer.map(tItem => {
        const fullItem = items.find(i => i.id === tItem.id);
        return {
            id: `TRF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            itemId: tItem.id,
            itemName: tItem.name,
            sku: fullItem?.sku || 'UNKNOWN',
            quantity: tItem.qty,
            source: 'Head Office', // Assuming bulk transfer is from upload (usually HO)
            destination: bulkTransferDestination,
            status: 'Pending',
            initiatedBy: role,
            date: new Date().toISOString().split('T')[0]
        };
    });

    setStockTransfers(prev => [...newTransfers, ...prev]);
    setShowBulkTransferModal(false);
    setSelectedItemIds([]); // Clear selection after transfer
    alert(`${newTransfers.length} transfers initiated successfully.`);
  };

  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (visibleItems: InventoryItem[]) => {
    if (selectedItemIds.length === visibleItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(visibleItems.map(i => i.id));
    }
  };

  const renderCategoriesView = () => {
    if (activeCategory) {
        const categoryItems = items.filter(i => i.category === activeCategory);
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setActiveCategory(null)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-sm group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{activeCategory}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{categoryItems.length} Items</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { 
                            setShowAddItemModal(true); 
                            const newItem = { name: '', sku: '', quantityHO: 0, quantityStore: 0, price: 0, reorderLevel: 50, category: activeCategory, uploadDate: new Date().toISOString().split('T')[0] };
                            setItemLines([newItem]); 
                        }} 
                        className="flex items-center space-x-2 px-5 py-2.5 bg-[#f65b13] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" /> <span>Add Item</span>
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5">Item Details</th>
                                <th className="px-8 py-5 text-center">SKU</th>
                                <th className="px-8 py-5 text-center">HO Stock</th>
                                <th className="px-8 py-5 text-right">Price</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categoryItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="font-black text-slate-800 text-sm">{item.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.vendor}</div>
                                    </td>
                                    <td className="px-8 py-4 text-center font-mono text-xs text-slate-500">{item.sku}</td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-black ${item.quantityHO <= item.reorderLevel ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                                            {item.quantityHO}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right font-black text-slate-900">₹{item.price.toLocaleString()}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleQuickTransfer(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Transfer Stock"><ArrowRightLeft className="w-4 h-4" /></button>
                                            {item.quantityHO <= item.reorderLevel && (
                                                <button 
                                                    onClick={() => handleStartDrafting(item)} 
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Draft Restock Email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-[#f65b13] transition-all"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categoryItems.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm font-medium">No items found in {activeCategory}.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
        {categories.map(cat => {
            const itemCount = items.filter(i => i.category === cat).length;
            const stockValue = items.filter(i => i.category === cat).reduce((acc, i) => acc + ((i.quantityHO + i.quantityStore) * i.price), 0);
            
            return (
                <div key={cat} onClick={() => setActiveCategory(cat)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:border-[#f65b13]/20 hover:shadow-xl transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-[#f65b13] group-hover:text-white transition-colors">
                            <Layers className="w-6 h-6" />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }} 
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{cat}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{itemCount} Associated SKUs</p>
                    
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valuation</span>
                        <span className="text-sm font-black text-slate-900">₹{(stockValue/1000).toFixed(1)}k</span>
                    </div>
                </div>
            );
        })}
        <button onClick={() => setShowAddCategoryModal(true)} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-6 hover:border-[#f65b13] hover:bg-[#f65b13]/5 transition-all group min-h-[200px]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-[#f65b13]" />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-[#f65b13]">New Category Node</span>
        </button>
      </div>
    );
  };

  const renderTransferView = () => {
    const activeTransfers = stockTransfers.filter(t => t.status === 'Pending' || t.status === 'In-Transit');
    const historyTransfers = stockTransfers.filter(t => t.status === 'Completed' || t.status === 'Cancelled');

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
          {/* Quick Initiate Form */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-900 text-white rounded-2xl">
                          <ArrowRightLeft className="w-6 h-6" />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Initiate Stock Transfer</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Move inventory between nodes</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Item to Move</label>
                      <select 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 appearance-none"
                          value={transferData.itemId}
                          onChange={e => setTransferData({...transferData, itemId: e.target.value})}
                      >
                          <option value="">Select Asset...</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Source Node</label>
                      <select 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 appearance-none"
                          value={transferData.source}
                          onChange={e => setTransferData({...transferData, source: e.target.value})}
                      >
                          <option value="Head Office">Head Office</option>
                          {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Target Node</label>
                      <select 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 appearance-none"
                          value={transferData.destination}
                          onChange={e => setTransferData({...transferData, destination: e.target.value})}
                      >
                          <option value="Head Office">Head Office</option>
                          {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Quantity</label>
                      <div className="flex space-x-2">
                          <input 
                              type="number" 
                              min="1"
                              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 text-center"
                              value={transferData.quantity}
                              onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value) || 0})}
                          />
                          <button 
                              onClick={handleInitiateTransfer}
                              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#f65b13] transition-all shadow-lg shadow-slate-900/10 active:scale-95 whitespace-nowrap"
                          >
                              Initiate
                          </button>
                      </div>
                  </div>
              </div>
          </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Logistics</p>
                 <div className="flex justify-between items-end">
                     <p className="text-3xl font-black text-blue-600">{stockTransfers.filter(t => t.status === 'In-Transit').length}</p>
                     <Truck className="w-6 h-6 text-blue-200" />
                 </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pending Approvals</p>
                 <div className="flex justify-between items-end">
                     <p className="text-3xl font-black text-amber-500">{stockTransfers.filter(t => t.status === 'Pending').length}</p>
                     <Clock className="w-6 h-6 text-amber-200" />
                 </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Completed Cycles</p>
                 <div className="flex justify-between items-end">
                     <p className="text-3xl font-black text-emerald-600">{stockTransfers.filter(t => t.status === 'Completed').length}</p>
                     <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                 </div>
             </div>
         </div>

         {/* Active Transfers Table */}
         <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase px-2">Active Shipments</h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Transfer ID</th>
                        <th className="px-8 py-5">Item Details</th>
                        <th className="px-8 py-5">Route (Source → Dest)</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {activeTransfers.map(transfer => (
                        <tr key={transfer.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                            <p className="text-xs font-black text-slate-800 font-mono">#{transfer.id}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{transfer.date}</p>
                            </td>
                            <td className="px-8 py-4">
                            <p className="text-sm font-bold text-slate-800">{transfer.itemName}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Qty: {transfer.quantity} Units</p>
                            </td>
                            <td className="px-8 py-4">
                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                                <span className="bg-slate-100 px-2 py-1 rounded-lg">{transfer.source}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="bg-slate-100 px-2 py-1 rounded-lg">{transfer.destination}</span>
                            </div>
                            </td>
                            <td className="px-8 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                transfer.status === 'In-Transit' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                                {transfer.status}
                            </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                            {transfer.status === 'Pending' && (
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => updateTransferStatus(transfer.id, 'In-Transit')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Start Transit"><Truck className="w-4 h-4" /></button>
                                    <button onClick={() => updateTransferStatus(transfer.id, 'Cancelled')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                                </div>
                            )}
                            {transfer.status === 'In-Transit' && (
                                <button onClick={() => updateTransferStatus(transfer.id, 'Completed')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                                    Confirm Receipt
                                </button>
                            )}
                            </td>
                        </tr>
                    ))}
                    {activeTransfers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                            <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No active transfers.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
         </div>

         {/* Transfer History Table */}
         <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase px-2">Transfer History</h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Date</th>
                        <th className="px-8 py-5">Initiated By</th>
                        <th className="px-8 py-5">Item Details</th>
                        <th className="px-8 py-5">Route</th>
                        <th className="px-8 py-5 text-right">Final Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {historyTransfers.map(transfer => (
                        <tr key={transfer.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-4">
                                <p className="text-xs font-bold text-slate-800">{transfer.date}</p>
                                <p className="text-[9px] text-slate-400 font-mono">#{transfer.id}</p>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center space-x-2">
                                    <div className="p-1.5 bg-slate-100 rounded-full"><User className="w-3 h-3 text-slate-500" /></div>
                                    <span className="text-xs font-bold text-slate-600">{transfer.initiatedBy}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <p className="text-sm font-bold text-slate-800">{transfer.itemName}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Qty: {transfer.quantity}</p>
                            </td>
                            <td className="px-8 py-4">
                                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                                    <span>{transfer.source}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span>{transfer.destination}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                    transfer.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                    {transfer.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {historyTransfers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-medium">No history available.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
         </div>
      </div>
    );
  };

  const getHeaderInfo = () => {
    switch(view) {
        case 'INVENTORY_TOOLS_TRACKING': return { title: 'Asset Tracking', subtitle: 'Monitoring tools' };
        case 'INVENTORY_RETURN_LOGS': return { title: 'Return Logs', subtitle: 'Defective audits' };
        case 'INVENTORY_STOCK_CONTROL': return { title: 'Stock Control', subtitle: 'Monitoring depletion levels' };
        case 'INVENTORY_CATEGORIES': return { title: 'Categorization Architect', subtitle: 'Group items by architectural type' };
        case 'INVENTORY_TRANSFER': return { title: 'Logistics Center', subtitle: 'Inter-branch stock movement' };
        case 'INVENTORY_MANAGEMENT': return { title: 'Inventory Analytics', subtitle: 'Global asset intelligence & summary' };
        case 'INVENTORY_UPLOADS': return { title: 'Stock Uploads & Logs', subtitle: 'Upload history & bulk movements' };
        case 'INVENTORY_VENDOR': return { title: 'Vendor Management', subtitle: 'Suppliers & Product Catalogs' };
        default: return { title: 'Inventory Control', subtitle: 'Stock management' };
    }
  };

  const headerInfo = getHeaderInfo();

  const displayItems = useMemo(() => {
    let result = [...items];

    // View-specific initial filtering
    if (view === 'INVENTORY_UPLOADS') {
      if (uploadDateFilter) {
        result = result.filter(i => i.uploadDate === uploadDateFilter);
      }
    } else if (view === 'INVENTORY_VENDOR' && selectedVendor) {
      result = result.filter(i => i.vendor === selectedVendor.name);
      if (vendorProductDateFilter) {
        result = result.filter(i => i.uploadDate === vendorProductDateFilter);
      }
      if (vendorProductSearch) {
        result = result.filter(i => 
          i.name.toLowerCase().includes(vendorProductSearch.toLowerCase()) || 
          i.sku.toLowerCase().includes(vendorProductSearch.toLowerCase())
        );
      }
    }

    // Advanced Filters
    if (showAdvancedFilter) {
      if (advancedFilters.category !== 'All') {
        result = result.filter(i => i.category === advancedFilters.category);
      }
      if (advancedFilters.vendor !== 'All') {
        result = result.filter(i => i.vendor === advancedFilters.vendor);
      }
      if (advancedFilters.minPrice) {
        result = result.filter(i => i.price >= parseFloat(advancedFilters.minPrice));
      }
      if (advancedFilters.maxPrice) {
        result = result.filter(i => i.price <= parseFloat(advancedFilters.maxPrice));
      }
      if (advancedFilters.stockStatus !== 'All') {
        if (advancedFilters.stockStatus === 'Low Stock') {
          result = result.filter(i => i.quantityHO <= i.reorderLevel);
        } else if (advancedFilters.stockStatus === 'Out of Stock') {
          result = result.filter(i => i.quantityHO === 0);
        } else if (advancedFilters.stockStatus === 'In Stock') {
          result = result.filter(i => i.quantityHO > i.reorderLevel);
        }
      }
      if (advancedFilters.startDate) {
        result = result.filter(i => (i.uploadDate || '') >= advancedFilters.startDate);
      }
      if (advancedFilters.endDate) {
        result = result.filter(i => (i.uploadDate || '') <= advancedFilters.endDate);
      }
    } else if (view === 'INVENTORY_STOCK_CONTROL' && filterLowStockOnly) {
       // Only apply simple low stock filter if advanced filter is OFF
       result = result.filter(i => i.quantityHO <= i.reorderLevel);
    }

    // Sorting for Stock Control view
    if (view === 'INVENTORY_STOCK_CONTROL' || view === 'INVENTORY_MAIN') {
       return result.sort((a, b) => {
        const aLow = a.quantityHO <= a.reorderLevel;
        const bLow = b.quantityHO <= b.reorderLevel;
        if (aLow && !bLow) return -1;
        if (!aLow && bLow) return 1;
        return 0;
      });
    }

    return result;
  }, [items, view, filterLowStockOnly, uploadDateFilter, selectedVendor, vendorProductDateFilter, showAdvancedFilter, advancedFilters]);

  const inventoryStats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((acc, item) => acc + ((item.quantityHO + item.quantityStore) * item.price), 0);
    const lowStockCount = items.filter(i => i.quantityHO <= i.reorderLevel).length;
    
    const categoryBreakdown = categories.map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const value = catItems.reduce((acc, item) => acc + ((item.quantityHO + item.quantityStore) * item.price), 0);
      return { name: cat, value, count: catItems.length };
    }).sort((a, b) => b.value - a.value);

    return { totalItems, totalValue, lowStockCount, categoryBreakdown };
  }, [items, categories]);

  const categoryStockData = useMemo(() => {
    return categories.map(cat => {
        const catItems = items.filter(i => i.category === cat);
        const ho = catItems.reduce((acc, i) => acc + i.quantityHO, 0);
        const store = catItems.reduce((acc, i) => acc + i.quantityStore, 0);
        return { name: cat, ho, store };
    }).sort((a, b) => (b.ho + b.store) - (a.ho + a.store));
  }, [items, categories]);

  const itemStockData = useMemo(() => {
    return items.map(item => ({
        name: item.name,
        ho: item.quantityHO,
        store: item.quantityStore
    }));
  }, [items]);

  const uploadBatchStats = useMemo(() => {
    if (view !== 'INVENTORY_UPLOADS' || !uploadDateFilter) return null;
    const totalQty = displayItems.reduce((acc, i) => acc + i.quantityHO, 0);
    const totalVal = displayItems.reduce((acc, i) => acc + (i.quantityHO * i.price), 0);
    return { totalQty, totalVal, count: displayItems.length };
  }, [view, uploadDateFilter, displayItems]);

  const renderVendorView = () => {
    if (selectedVendor) {
        // Detailed Vendor Profile View
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header & Back */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => setSelectedVendor(null)} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-all group w-fit">
                        <div className="p-2 bg-white border border-slate-100 rounded-xl group-hover:bg-slate-50 transition-colors shadow-sm"><ArrowLeft className="w-4 h-4" /></div>
                        <span>Back to Vendor List</span>
                    </button>
                    <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedVendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {selectedVendor.status}
                        </span>
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center space-x-2 text-xs font-bold shadow-sm">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                            <span>{selectedVendor.rating || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Vendor Details Card */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl font-black text-slate-400 border-4 border-white shadow-xl mb-4">
                                {selectedVendor.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedVendor.name}</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{selectedVendor.contactPerson}</p>
                            <button 
                                onClick={() => {
                                    setVendorProductDateFilter('');
                                    document.getElementById('vendor-products-table')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f65b13] transition-colors shadow-lg w-full md:w-auto"
                            >
                                View Full Catalog
                            </button>
                        </div>
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</p>
                                <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                                    <Phone className="w-3.5 h-3.5 text-[#f65b13]" /> <span>{selectedVendor.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                                    <Mail className="w-3.5 h-3.5 text-[#f65b13]" /> 
                                    <a href={`mailto:${selectedVendor.email}`} className="hover:text-[#f65b13] hover:underline transition-colors">
                                        {selectedVendor.email}
                                    </a>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing & Tax</p>
                                <div className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                                    <Receipt className="w-3.5 h-3.5 text-[#f65b13]" /> <span>{selectedVendor.gstIn}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                <div className="flex items-start space-x-2 text-sm font-bold text-slate-700">
                                    <MapPin className="w-3.5 h-3.5 text-[#f65b13] mt-0.5" /> <span className="line-clamp-2">{selectedVendor.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 pointer-events-none"><Building2 className="w-64 h-64" /></div>
                </div>

                {/* Vendor Products Section */}
                <div id="vendor-products-table" className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center">
                                <Package className="w-5 h-5 mr-3 text-slate-400" />
                                Supplied Catalog
                            </h4>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setVendorViewMode('Table')}
                                    className={`p-2 rounded-lg transition-all ${vendorViewMode === 'Table' ? 'bg-white text-[#f65b13] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setVendorViewMode('Grid')}
                                    className={`p-2 rounded-lg transition-all ${vendorViewMode === 'Grid' ? 'bg-white text-[#f65b13] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search catalog..." 
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 text-slate-700 w-48"
                                    value={vendorProductSearch}
                                    onChange={(e) => setVendorProductSearch(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="date" 
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 text-slate-700"
                                    value={vendorProductDateFilter}
                                    onChange={(e) => setVendorProductDateFilter(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={downloadVendorCsvTemplate}
                                className="flex items-center space-x-2 px-5 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                <span>CSV Template</span>
                            </button>
                            <input 
                                type="file" 
                                accept=".csv" 
                                ref={vendorCsvInputRef} 
                                className="hidden" 
                                onChange={handleVendorCsvUpload} 
                            />
                            <button 
                                onClick={() => vendorCsvInputRef.current?.click()}
                                disabled={isImporting}
                                className="flex items-center space-x-2 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-[#f65b13] transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
                            >
                                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                                <span>Upload Catalog</span>
                            </button>
                        </div>
                    </div>

                    {vendorViewMode === 'Table' ? (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5">Product Name</th>
                                        <th className="px-8 py-5">SKU</th>
                                        <th className="px-8 py-5">Category</th>
                                        <th className="px-8 py-5 text-right">Unit Price</th>
                                        <th className="px-8 py-5 text-right">Upload Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {displayItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                                            <td className="px-8 py-4 text-xs font-mono text-slate-500">{item.sku}</td>
                                            <td className="px-8 py-4 text-xs font-bold text-slate-600">{item.category}</td>
                                            <td className="px-8 py-4 text-right text-sm font-black text-slate-900">₹{item.price.toLocaleString()}</td>
                                            <td className="px-8 py-4 text-right text-xs font-medium text-slate-500">{item.uploadDate || 'N/A'}</td>
                                        </tr>
                                    ))}
                                    {displayItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-sm font-medium">No products found for this vendor matching filters.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {displayItems.map(item => (
                                <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#f65b13]/20 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-[#f65b13] group-hover:text-white transition-colors">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            {item.category}
                                        </span>
                                    </div>
                                    <h5 className="text-base font-black text-slate-900 mb-1 leading-tight">{item.name}</h5>
                                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">{item.sku}</p>
                                    
                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                                            <p className="text-lg font-black text-slate-900">₹{item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Added On</p>
                                            <p className="text-[10px] font-bold text-slate-500">{item.uploadDate || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Stock Indicator */}
                                    <div className="mt-4 flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${item.quantityHO > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {item.quantityHO > 0 ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {displayItems.length === 0 && (
                                <div className="col-span-full bg-white p-16 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-medium text-slate-400">No products found for this vendor matching filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default Vendor List View
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full max-w-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search vendors by name, GST..." 
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10" 
                            value={vendorSearch} 
                            onChange={(e) => setVendorSearch(e.target.value)} 
                        />
                    </div>
                    <div className="relative w-40">
                        <select
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 appearance-none cursor-pointer"
                            value={vendorStatusFilter}
                            onChange={(e) => setVendorStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <div className="absolute right-4 top-3.5 pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowAddVendorModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#000000] transition-all shadow-lg shadow-[#f65b13]/20 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Vendor</span>
                </button>
            </div>

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.filter(v => {
                    const matchesSearch = v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || v.gstIn.includes(vendorSearch);
                    const matchesStatus = vendorStatusFilter === 'All' || v.status === vendorStatusFilter;
                    return matchesSearch && matchesStatus;
                }).map(vendor => (
                    <div key={vendor.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-xl hover:border-[#f65b13]/20 transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#f65b13] group-hover:text-white transition-colors text-slate-400">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${vendor.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    {vendor.status}
                                </span>
                                <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                                    <span className="text-[9px] font-black text-amber-700">{vendor.rating || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-slate-900 mb-1">{vendor.name}</h3>
                            <p className="text-xs text-slate-500 font-bold mb-6">{vendor.contactPerson}</p>
                            
                            <div className="space-y-3 pt-6 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs font-bold text-slate-600">
                                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                        {vendor.phone}
                                    </div>
                                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                        <Package className="w-3 h-3 mr-1" />
                                        {items.filter(i => i.vendor === vendor.name).length} Products
                                    </div>
                                </div>
                                <div className="flex items-center text-xs font-bold text-slate-600">
                                    <Receipt className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                    {vendor.gstIn}
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedVendor(vendor)}
                                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f65b13] transition-colors"
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Vendor Modal */}
            {showAddVendorModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm" onClick={() => setShowAddVendorModal(false)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Register Vendor</h3>
                            <button onClick={() => setShowAddVendorModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
                                <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={newVendorData.name} onChange={e => setNewVendorData({...newVendorData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Person</label>
                                    <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={newVendorData.contactPerson} onChange={e => setNewVendorData({...newVendorData, contactPerson: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GSTIN</label>
                                    <input type="text" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={newVendorData.gstIn} onChange={e => setNewVendorData({...newVendorData, gstIn: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                                    <input type="tel" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={newVendorData.phone} onChange={e => setNewVendorData({...newVendorData, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                                    <input type="email" className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" value={newVendorData.email} onChange={e => setNewVendorData({...newVendorData, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                                    <select 
                                        className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white"
                                        value={newVendorData.status}
                                        onChange={e => setNewVendorData({...newVendorData, status: e.target.value})}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Rating</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0" 
                                        max="5" 
                                        className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold" 
                                        value={newVendorData.rating} 
                                        onChange={e => setNewVendorData({...newVendorData, rating: parseFloat(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                                <textarea className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold min-h-[80px]" value={newVendorData.address} onChange={e => setNewVendorData({...newVendorData, address: e.target.value})} />
                            </div>
                            <button onClick={handleCreateVendor} className="w-full py-5 bg-[#000000] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-[#f65b13] active:scale-95 transition-all mt-4">
                                Save Vendor Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderManagementSummary = () => {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-orange-50 text-[#f65b13] rounded-3xl group-hover:scale-110 transition-transform">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Global</div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Asset Value</p>
            <h4 className="text-3xl font-black text-slate-900">₹{(inventoryStats.totalValue / 100000).toFixed(2)}L</h4>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#f65b13]/5 rounded-full"></div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              {inventoryStats.lowStockCount > 0 && (
                <div className="px-3 py-1 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Critical</div>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
            <h4 className="text-3xl font-black text-rose-600">{inventoryStats.lowStockCount} SKUs</h4>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-slate-900 text-white rounded-3xl group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Inventory</p>
            <h4 className="text-3xl font-black text-slate-900">{inventoryStats.totalItems} Items</h4>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Categories</p>
            <h4 className="text-3xl font-black text-slate-900">{categories.length} Nodes</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3 text-rose-500" />
                Critical Attention Required
              </h3>
              <button onClick={() => setFilterLowStockOnly(true)} className="text-[10px] font-black text-[#f65b13] uppercase tracking-widest hover:underline">View All Critical</button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-8 py-5">Item</th>
                       <th className="px-8 py-5">Status</th>
                       <th className="px-8 py-5 text-right">Available</th>
                       <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.filter(i => i.quantityHO <= i.reorderLevel).slice(0, 5).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                           <p className="text-sm font-black text-slate-800">{item.name}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase">{item.sku}</p>
                        </td>
                        <td className="px-8 py-4">
                           <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black uppercase border border-rose-100">Depleted</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <p className="text-xs font-black text-slate-900">{item.quantityHO} Units</p>
                           <p className="text-[9px] text-slate-400">Min: {item.reorderLevel}</p>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <div className="flex items-center justify-end space-x-2">
                               <button onClick={() => handleQuickTransfer(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Transfer Stock"><ArrowRightLeft className="w-4 h-4" /></button>
                               <button onClick={() => handleStartDrafting(item)} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-[#f65b13] transition-all" title="Email Vendor">
                                  <Mail className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleEditItem(item)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-[#f65b13] hover:border-[#f65b13] transition-all" title="Edit Item">
                                  <Pencil className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-200 transition-all" title="Delete Item">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {inventoryStats.lowStockCount === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-slate-400 text-sm">All inventory nodes are within safe operational thresholds.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center px-2">
              <PieIcon className="w-5 h-5 mr-3 text-[#f65b13]" />
              Value Distribution
            </h3>
            <div className="bg-[#000000] p-10 rounded-[3rem] text-white shadow-2xl space-y-6 relative overflow-hidden">
               {inventoryStats.categoryBreakdown.slice(0, 4).map((cat, idx) => (
                 <div key={cat.name} className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                       <p className="text-xs font-bold text-slate-300">{cat.name}</p>
                       <p className="text-sm font-black">₹{(cat.value / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                       <div 
                         className="bg-[#f65b13] h-full rounded-full shadow-[0_0_10px_rgba(246,91,19,0.4)]" 
                         style={{ width: `${(cat.value / inventoryStats.totalValue) * 100}%` }}
                       ></div>
                    </div>
                 </div>
               ))}
               <div className="pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <span>Intelligence insight</span>
                     <Sparkles className="w-3 h-3 text-[#f65b13]" />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                    "{inventoryStats.categoryBreakdown[0]?.name} remains the highest liquidity node, contributing {((inventoryStats.categoryBreakdown[0]?.value / inventoryStats.totalValue) * 100).toFixed(1)}% to global asset valuation."
                  </p>
               </div>
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 pointer-events-none">
                  <TrendingUp className="w-64 h-64" />
               </div>
            </div>
          </div>
        </div>

        {/* Stock Level Analysis Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                        <BarChart3 className="w-5 h-5 mr-3 text-[#f65b13]" />
                        Category Stock Analysis
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Head Office vs Branch Distribution</p>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                        <Bar dataKey="ho" name="Head Office Stock" fill="#333333" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="store" name="Branch Stock" fill="#f65b13" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Item Stock Level Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                        <BarChart3 className="w-5 h-5 mr-3 text-[#f65b13]" />
                        Item Stock Levels
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Head Office vs Branch Stock per Item</p>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemStockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                        <Bar dataKey="ho" name="Head Office" fill="#333333" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="store" name="Branch" fill="#f65b13" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">{headerInfo.title}</h2>
                <p className="text-slate-500 text-xs md:text-sm">{headerInfo.subtitle}</p>
            </div>
            <div className="flex gap-2">
                {view === 'INVENTORY_CATEGORIES' ? (
                   <button onClick={() => setShowAddCategoryModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-[#f65b13] text-white rounded-xl md:rounded-2xl hover:bg-[#000000] transition-all font-black shadow-lg shadow-[#f65b13]/20 text-xs uppercase tracking-widest">
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                    </button>
                ) : view === 'INVENTORY_TRANSFER' ? (
                   <button onClick={() => setShowTransferModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-[#f65b13] text-white rounded-xl md:rounded-2xl hover:bg-[#000000] transition-all font-black shadow-lg shadow-[#f65b13]/20 text-xs uppercase tracking-widest">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Initiate Transfer</span>
                    </button>
                ) : view === 'INVENTORY_MANAGEMENT' ? (
                   <div className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <BarChart3 className="w-3 h-3 text-[#f65b13]" />
                      <span>Intelligence Pulse Active</span>
                   </div>
                ) : view === 'INVENTORY_UPLOADS' || view === 'INVENTORY_VENDOR' ? (
                   // Custom view toolbars are handled inside their specific render blocks
                   null
                ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)} 
                        className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 border rounded-xl md:rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${showAdvancedFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline">Filter</span>
                      </button>
                      <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleExcelUpload} 
                      />
                      <button 
                        onClick={downloadCsvTemplate} 
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
                      >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Template</span>
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isImporting}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl md:rounded-2xl hover:bg-emerald-700 transition-all font-black shadow-lg shadow-emerald-600/20 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                          <span>Import CSV</span>
                      </button>
                      <button onClick={() => setShowAddItemModal(true)} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-[#f65b13] text-white rounded-xl md:rounded-2xl hover:bg-[#000000] transition-all font-black shadow-lg shadow-[#f65b13]/20 text-xs uppercase tracking-widest">
                          <Plus className="w-4 h-4" />
                          <span>Register Stock</span>
                      </button>
                    </div>
                )}
            </div>
        </div>

        {/* Advanced Filter Panel */}
        {showAdvancedFilter && (
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg animate-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                        <Filter className="w-5 h-5 mr-2 text-[#f65b13]" />
                        Advanced Filters
                    </h3>
                    <button onClick={() => {
                        setShowAdvancedFilter(false);
                        setAdvancedFilters({ category: 'All', vendor: 'All', minPrice: '', maxPrice: '', stockStatus: 'All', startDate: '', endDate: '' });
                    }} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                        Clear & Close
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10"
                            value={advancedFilters.category}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, category: e.target.value})}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10"
                            value={advancedFilters.vendor}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, vendor: e.target.value})}
                        >
                            <option value="All">All Vendors</option>
                            {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Status</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10"
                            value={advancedFilters.stockStatus}
                            onChange={(e) => setAdvancedFilters({...advancedFilters, stockStatus: e.target.value})}
                        >
                            <option value="All">All Statuses</option>
                            <option value="In Stock">In Stock</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10"
                                    placeholder="0"
                                    value={advancedFilters.minPrice}
                                    onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Max Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10"
                                    placeholder="Any"
                                    value={advancedFilters.maxPrice}
                                    onChange={(e) => setAdvancedFilters({...advancedFilters, maxPrice: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date (Upload)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 text-slate-700"
                                value={advancedFilters.startDate}
                                onChange={(e) => setAdvancedFilters({...advancedFilters, startDate: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date (Upload)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/10 text-slate-700"
                                value={advancedFilters.endDate}
                                onChange={(e) => setAdvancedFilters({...advancedFilters, endDate: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'INVENTORY_CATEGORIES' ? (
           renderCategoriesView()
        ) : view === 'INVENTORY_TRANSFER' ? (
           renderTransferView()
        ) : view === 'INVENTORY_MANAGEMENT' ? (
           renderManagementSummary()
        ) : view === 'INVENTORY_VENDOR' ? (
           renderVendorView()
        ) : view === 'INVENTORY_UPLOADS' ? (
           <div className="space-y-6">
              {/* Batch Summary Card */}
              {uploadDateFilter && uploadBatchStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                   <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-[#f65b13]/5 text-[#f65b13] rounded-2xl"><Calendar className="w-6 h-6" /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Date</p>
                         <p className="text-lg font-black text-slate-900">{uploadDateFilter}</p>
                      </div>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package className="w-6 h-6" /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Uploaded Stock</p>
                         <p className="text-lg font-black text-slate-900">{uploadBatchStats.totalQty} Units</p>
                      </div>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><IndianRupee className="w-6 h-6" /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Valuation</p>
                         <p className="text-lg font-black text-slate-900">₹{(uploadBatchStats.totalVal/1000).toFixed(2)}k</p>
                      </div>
                   </div>
                </div>
              )}

              {/* Date Filter & Actions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="relative">
                       <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                       <input 
                         type="date" 
                         className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#f65b13]/20 text-slate-800"
                         value={uploadDateFilter}
                         onChange={(e) => setUploadDateFilter(e.target.value)}
                       />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {uploadDateFilter ? `${displayItems.length} items found in logs` : 'Select date to view upload logs'}
                    </span>
                 </div>
                 <button 
                   onClick={initiateBulkTransfer} 
                   disabled={!uploadDateFilter || displayItems.length === 0}
                   className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${!uploadDateFilter || displayItems.length === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#000000] text-white hover:bg-[#f65b13] shadow-lg shadow-black/20'}`}
                 >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Transfer Batch to Branch</span>
                 </button>
              </div>

              {/* Uploads Table */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">Upload Date</th>
                          <th className="px-8 py-5">Item Details</th>
                          <th className="px-8 py-5">SKU</th>
                          <th className="px-8 py-5 text-center">Available Qty (HO)</th>
                          <th className="px-8 py-5 text-right">Vendor</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {displayItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-8 py-4 text-xs font-bold text-slate-500">{item.uploadDate || 'N/A'}</td>
                             <td className="px-8 py-4">
                                <p className="text-sm font-black text-slate-800">{item.name}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{item.category}</p>
                             </td>
                             <td className="px-8 py-4 text-xs font-mono text-slate-500">{item.sku}</td>
                             <td className="px-8 py-4 text-center">
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">{item.quantityHO}</span>
                             </td>
                             <td className="px-8 py-4 text-right text-xs font-bold text-slate-600">{item.vendor}</td>
                          </tr>
                       ))}
                       {displayItems.length === 0 && (
                          <tr>
                             <td colSpan={5} className="px-8 py-16 text-center text-slate-400 text-sm italic">
                                {uploadDateFilter ? 'No upload records found for this specific date.' : 'Please select an upload date to view logs.'}
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        ) : (
           <>
              {/* Low Stock Summary for Control View */}
              {view === 'INVENTORY_STOCK_CONTROL' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div 
                    onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                    className={`cursor-pointer border p-5 rounded-3xl flex items-center space-x-4 transition-all ${filterLowStockOnly ? 'bg-rose-600 border-rose-700 text-white shadow-lg' : 'bg-rose-50 border-rose-100 text-rose-700'}`}
                  >
                    <div className={`p-3 rounded-2xl shadow-sm ${filterLowStockOnly ? 'bg-white/20 text-white' : 'bg-white text-rose-600'}`}>
                      {filterLowStockOnly ? <EyeOff className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className={`text-2xl font-black leading-none ${filterLowStockOnly ? 'text-white' : 'text-rose-900'}`}>{items.filter(i => i.quantityHO <= i.reorderLevel).length}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${filterLowStockOnly ? 'text-white/80' : 'text-rose-600'}`}>
                        {filterLowStockOnly ? 'Showing Critical Items' : 'At Risk Assets'}
                      </p>
                    </div>
                  </div>
                  {!filterLowStockOnly && (
                    <div className="hidden md:flex bg-slate-50 border border-slate-100 p-5 rounded-3xl items-center space-x-4">
                      <div className="p-3 bg-white rounded-2xl text-slate-400 shadow-sm"><Package className="w-6 h-6" /></div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 leading-none">{items.length}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Items</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Action Bar - Appears when items are selected */}
              {selectedItemIds.length > 0 && (
                <div className="sticky top-2 z-20 bg-[#000000] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300 mx-2">
                    <div className="flex items-center space-x-4">
                        <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-black">{selectedItemIds.length} Selected</span>
                        <span className="text-[10px] uppercase tracking-widest font-medium text-slate-300 hidden sm:inline-block">Ready for bulk operations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleBulkRestock}
                            className="bg-emerald-600 hover:bg-white hover:text-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Bulk Restock
                        </button>
                        <button 
                            onClick={initiateBulkTransferFromSelection}
                            className="bg-[#f65b13] hover:bg-white hover:text-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center"
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Transfer to Store
                        </button>
                        <button 
                            onClick={() => setSelectedItemIds([])}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              )}

              {/* Scrollable Table Container */}
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-50">
                              <tr>
                                  <th className="px-4 py-4 md:py-5 w-12 text-center">
                                      <button onClick={() => toggleSelectAll(displayItems)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                          {selectedItemIds.length > 0 && selectedItemIds.length === displayItems.length ? (
                                              <CheckSquare className="w-5 h-5 text-[#f65b13]" />
                                          ) : (
                                              <Square className="w-5 h-5" />
                                          )}
                                      </button>
                                  </th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 w-1/3">Item Details</th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 text-center">SKU</th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 text-center">HO Stock</th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 text-center">Min Level</th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 text-right">Price (₹)</th>
                                  <th className="px-6 md:px-8 py-4 md:py-5 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {displayItems.map((item) => {
                                  const isLowStock = item.quantityHO <= item.reorderLevel;
                                  const isCritical = item.quantityHO < (item.reorderLevel / 2);
                                  const isSelected = selectedItemIds.includes(item.id);
                                  return (
                                      <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${isLowStock ? 'bg-rose-50/40' : ''} ${isSelected ? 'bg-orange-50/30' : ''}`}>
                                          <td className="px-4 py-4 md:py-5 text-center">
                                              <button onClick={() => toggleSelection(item.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                  {isSelected ? (
                                                      <CheckSquare className="w-5 h-5 text-[#f65b13]" />
                                                  ) : (
                                                      <Square className="w-5 h-5" />
                                                  )}
                                              </button>
                                          </td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 relative">
                                              {isLowStock && (
                                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'}`}></div>
                                              )}
                                              <div className="flex items-center space-x-3 md:space-x-4">
                                                  <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all ${isLowStock ? (isCritical ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600') : 'bg-[#f65b13]/5 text-[#f65b13] group-hover:bg-[#f65b13] group-hover:text-white'}`}>
                                                      {isLowStock ? <AlertCircle className="w-4 h-4 md:w-5 h-5" /> : <Package className="w-4 h-4 md:w-5 h-5" />}
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center space-x-2">
                                                          <div className="font-black text-slate-800 text-sm">{item.name}</div>
                                                          {isLowStock && (
                                                              <span className={`flex items-center text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${isCritical ? 'bg-rose-600 text-white shadow-sm' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                                                  <ShieldAlert className="w-2.5 h-2.5 mr-1" /> {isCritical ? 'Critical' : 'Low Stock'}
                                                              </span>
                                                          )}
                                                      </div>
                                                      <div className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black">{item.category}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 text-center font-mono text-[10px] md:text-xs text-slate-500">{item.sku}</td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 text-center">
                                              <div className={`font-black text-sm ${isLowStock ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                                                  {item.quantityHO}
                                                  {isLowStock && <span className="ml-1 text-[8px] opacity-70">units</span>}
                                              </div>
                                          </td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 text-center font-bold text-slate-400 text-xs">
                                              {item.reorderLevel}
                                          </td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 text-right font-black text-[#f65b13] text-sm">₹{item.price.toLocaleString()}</td>
                                          <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                                              <div className="flex items-center justify-end space-x-1 md:space-x-2">
                                                  <button onClick={() => handleQuickTransfer(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="Transfer Stock"><ArrowRightLeft className="w-4 h-4" /></button>
                                                  {isLowStock && (
                                                     <button 
                                                       onClick={() => handleStartDrafting(item)} 
                                                       className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                       title="Draft Restock Email"
                                                     >
                                                       <Mail className="w-4 h-4" />
                                                     </button>
                                                  )}
                                                  <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-[#f65b13] transition-all"><Pencil className="w-4 h-4" /></button>
                                                  <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
           </>
        )}

        {/* Bulk Transfer Modal */}
        {showBulkTransferModal && (
           <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm transition-all" onClick={() => setShowBulkTransferModal(false)}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Bulk Transfer Confirmation</h3>
                    <button onClick={() => setShowBulkTransferModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                 </div>
                 <div className="p-10 space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start space-x-3">
                       <AlertCircle className="w-5 h-5 text-[#f65b13] shrink-0" />
                       <p className="text-xs text-orange-800 font-medium">You are about to transfer stock for <span className="font-black">{itemsToTransfer.length} items</span>. Ensure quantity availability.</p>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Destination Node</label>
                       <select 
                         className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                         value={bulkTransferDestination} 
                         onChange={e => setBulkTransferDestination(e.target.value)}
                       >
                          {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                       </select>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                       {itemsToTransfer.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <span className="text-xs font-bold text-slate-700 truncate w-1/2">{item.name}</span>
                             <div className="flex items-center space-x-2">
                                <label className="text-[9px] font-black uppercase text-slate-400">Qty</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  className="w-16 p-2 border border-slate-200 rounded-lg text-xs font-bold text-center"
                                  value={item.qty}
                                  onChange={(e) => {
                                     const newQty = parseInt(e.target.value) || 0;
                                     const updated = [...itemsToTransfer];
                                     updated[idx].qty = newQty;
                                     setItemsToTransfer(updated);
                                  }}
                                />
                             </div>
                          </div>
                       ))}
                    </div>

                    <button onClick={handleConfirmBulkTransfer} className="w-full py-5 bg-[#000000] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-[#f65b13] active:scale-95 transition-all mt-4">
                       Execute Bulk Transfer
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Restock Email Draft Modal */}
        {draftingItem && (
           <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-all">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                       <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Mail className="w-6 h-6" /></div>
                       <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Restock Intelligent Draft</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Powered by Gemini Engine</p>
                       </div>
                    </div>
                    <button onClick={() => setDraftingItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                 </div>
                 <div className="p-10 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Vendor</p>
                          <p className="text-sm font-bold text-slate-800">{draftingItem.vendor || 'Authorized Supplier'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</p>
                          <p className="text-sm font-bold text-slate-800">{draftingItem.name}</p>
                       </div>
                    </div>

                    <div className="relative group">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Body Transcript</label>
                       {isDrafting ? (
                          <div className="w-full h-48 bg-slate-50 rounded-3xl flex flex-col items-center justify-center space-y-4 border border-slate-100">
                             <RefreshCw className="w-8 h-8 text-[#f65b13] animate-spin" />
                             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synthesizing professional request...</p>
                          </div>
                       ) : (
                          <>
                             <textarea 
                               className="w-full p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-600 min-h-[200px] outline-none focus:ring-4 focus:ring-[#f65b13]/5 transition-all leading-relaxed"
                               value={emailDraft}
                               onChange={(e) => setEmailDraft(e.target.value)}
                             />
                             <button 
                               onClick={() => { navigator.clipboard.writeText(emailDraft); alert('Draft copied to clipboard!'); }}
                               className="absolute bottom-6 right-6 p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#f65b13] hover:border-[#f65b13]/20 transition-all shadow-sm group-hover:shadow-md"
                             >
                                <Copy className="w-4 h-4" />
                             </button>
                          </>
                       )}
                    </div>

                    <div className="flex space-x-4 pt-4">
                       <button 
                         onClick={() => setDraftingItem(null)}
                         className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                       >
                          Dismiss
                       </button>
                       <button 
                         disabled={isDrafting}
                         onClick={() => {
                           const subject = encodeURIComponent(`Restock Request: ${draftingItem.name}`);
                           const body = encodeURIComponent(emailDraft);
                           window.location.href = `mailto:?subject=${subject}&body=${body}`;
                         }}
                         className="flex-3 py-4 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all flex items-center justify-center space-x-2"
                       >
                          <Send className="w-4 h-4" />
                          <span>Transmit via Mail Client</span>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Initiate Transfer Modal */}
        {showTransferModal && (
           <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm transition-all" onClick={() => setShowTransferModal(false)}>
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                 <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Initiate Logistics Order</h3>
                    <button onClick={() => setShowTransferModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                 </div>
                 <div className="p-10 space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item to Move</label>
                       <select 
                         className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                         value={transferData.itemId} 
                         onChange={e => setTransferData({...transferData, itemId: e.target.value})}
                       >
                          <option value="">Select Asset...</option>
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Source Node</label>
                          <select 
                            className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                            value={transferData.source} 
                            onChange={e => setTransferData({...transferData, source: e.target.value})}
                          >
                             <option value="Head Office">Head Office</option>
                             {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Node</label>
                          <select 
                            className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                            value={transferData.destination} 
                            onChange={e => setTransferData({...transferData, destination: e.target.value})}
                          >
                             <option value="Head Office">Head Office</option>
                             {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Units to Transfer</label>
                       <input 
                         type="number" 
                         min="1"
                         className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-4 focus:ring-[#f65b13]/10 font-bold bg-white text-sm text-center" 
                         value={transferData.quantity} 
                         onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value) || 0})}
                       />
                    </div>
                    <button onClick={handleInitiateTransfer} className="w-full py-5 bg-[#000000] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-[#f65b13] active:scale-95 transition-all mt-4">
                       Authorize Logistics Pulse
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Add Category Modal */}
        {showAddCategoryModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4 backdrop-blur-sm transition-all" onClick={() => setShowAddCategoryModal(false)}>
             <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">New Category</h3>
                   <button onClick={() => setShowAddCategoryModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Name</label>
                      <input 
                        type="text" 
                        autoFocus
                        className="w-full p-4 border border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                        value={newCategoryName} 
                        onChange={e => setNewCategoryName(e.target.value)} 
                        placeholder="e.g. Battery Modules"
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                      />
                   </div>
                   <button onClick={handleAddCategory} className="w-full py-4 bg-[#f65b13] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all">
                      Add to Database
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Form Modal with Mobile Scrolling */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm transition-all" onClick={handleCloseModal}>
             <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-6 md:px-10 py-5 md:py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">{editingId ? 'Modify Stock' : 'Register Stock'}</h3>
                   <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                      <input type="text" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].name} onChange={e => {
                        const updated = [...itemLines];
                        updated[0].name = e.target.value;
                        setItemLines(updated);
                      }} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU Code</label>
                          <input type="text" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].sku} onChange={e => {
                            const updated = [...itemLines];
                            updated[0].sku = e.target.value;
                            setItemLines(updated);
                          }} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Assignment</label>
                          <select 
                            className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                            value={itemLines[0].category} 
                            onChange={e => {
                                const updated = [...itemLines];
                                updated[0].category = e.target.value;
                                setItemLines(updated);
                            }}
                          >
                             {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             {!categories.includes(itemLines[0].category) && <option value={itemLines[0].category}>{itemLines[0].category}</option>}
                          </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (₹)</label>
                          <input type="number" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].price} onChange={e => {
                            const updated = [...itemLines];
                            updated[0].price = parseFloat(e.target.value);
                            setItemLines(updated);
                          }} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min Reorder Level</label>
                          <input type="number" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].reorderLevel} onChange={e => {
                            const updated = [...itemLines];
                            updated[0].reorderLevel = parseInt(e.target.value);
                            setItemLines(updated);
                          }} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">HO Stock</label>
                          <input type="number" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].quantityHO} onChange={e => {
                            const updated = [...itemLines];
                            updated[0].quantityHO = parseInt(e.target.value);
                            setItemLines(updated);
                          }} />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Branch Stock</label>
                          <input type="number" className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" value={itemLines[0].quantityStore} onChange={e => {
                            const updated = [...itemLines];
                            updated[0].quantityStore = parseInt(e.target.value);
                            setItemLines(updated);
                          }} />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upload Date</label>
                      <input 
                        type="date" 
                        className="w-full p-3 md:p-4 border border-slate-300 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-[#f65b13]/10 font-bold bg-white text-sm" 
                        value={itemLines[0].uploadDate} 
                        onChange={e => {
                          const updated = [...itemLines];
                          updated[0].uploadDate = e.target.value;
                          setItemLines(updated);
                        }} 
                      />
                   </div>
                   <div className="pt-4">
                        <button onClick={handleSaveItems} className="w-full py-4 md:py-5 bg-[#f65b13] text-white rounded-xl md:rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#f65b13]/20 hover:bg-[#000000] active:scale-95 transition-all">
                            {editingId ? 'Update Stock' : 'Initialize Stock'}
                        </button>
                   </div>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default InventoryModule;
