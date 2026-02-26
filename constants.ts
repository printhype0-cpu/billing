
import { InventoryItem, Staff, Invoice, Candidate, JobSheet, PurchaseOrder, Vendor } from './types.ts';

export const MOCK_STAFF: Staff[] = [
  { id: '1', name: 'Alice Johnson', position: 'Store Manager', store: 'Downtown Branch', status: 'Active', attendance: 98, documents: [] },
  { id: '2', name: 'Bob Smith', position: 'Technician', store: 'Downtown Branch', status: 'Active', attendance: 95, documents: [] },
  { id: '3', name: 'Charlie Davis', position: 'Sales Associate', store: 'Northgate Branch', status: 'On Leave', attendance: 88, documents: [] },
  { id: '4', name: 'Diana Evans', position: 'HR Specialist', store: 'Head Office', status: 'Active', attendance: 100, documents: [] },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { 
    id: 'c1', 
    name: 'Suresh Raina', 
    role: 'Senior Technician', 
    status: 'Interviewed', 
    appliedDate: '2023-11-01', 
    expectedSalary: 45000, 
    email: 'suresh.r@example.com', 
    phone: '+91 98765 43210',
    documents: [
      { id: 'd1', name: 'Resume_Suresh.pdf', type: 'application/pdf', url: '#', uploadDate: '2023-11-01' },
      { id: 'd2', name: 'Tech_Cert_Lvl3.pdf', type: 'application/pdf', url: '#', uploadDate: '2023-11-01' }
    ]
  },
  { 
    id: 'c2', 
    name: 'Priya Sharma', 
    role: 'Sales Executive', 
    status: 'New', 
    appliedDate: '2023-11-03', 
    expectedSalary: 35000, 
    email: 'priya.s@example.com', 
    phone: '+91 91234 56789',
    documents: [
      { id: 'd3', name: 'CV_Priya_Sales.pdf', type: 'application/pdf', url: '#', uploadDate: '2023-11-03' }
    ]
  },
  { 
    id: 'c3', 
    name: 'Amit Kumar', 
    role: 'Store Manager', 
    status: 'Rejected', 
    appliedDate: '2023-10-28', 
    expectedSalary: 55000, 
    email: 'amit.k@example.com', 
    phone: '+91 88776 65544',
    documents: []
  },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'TechParts Inc.', contactPerson: 'Rajesh Kumar', phone: '+91 9876543210', email: 'sales@techparts.com', address: '12 Electronic City, Bangalore', gstIn: '29ABCDE1234F1Z5', rating: 4.5, status: 'Active' },
  { id: 'v2', name: 'CellSupply', contactPerson: 'Anita Roy', phone: '+91 9123456789', email: 'support@cellsupply.in', address: '45 Mobile Market, Delhi', gstIn: '07AAAAA0000A1Z5', rating: 4.2, status: 'Active' },
  { id: 'v3', name: 'GlassCo', contactPerson: 'Vikram Singh', phone: '+91 8888888888', email: 'bulk@glassco.net', address: '88 Industrial Area, Mumbai', gstIn: '27ABCDE1234F1Z5', rating: 4.8, status: 'Active' },
  { id: 'v4', name: 'CableWorld', contactPerson: 'Suresh Raina', phone: '+91 7777777777', email: 'info@cableworld.com', address: '22 Tech Park, Hyderabad', gstIn: '36ABCDE1234F1Z5', rating: 3.9, status: 'Inactive' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '101', name: 'iPhone 15 Screen', category: 'Parts', sku: 'PRT-IP15-SCR', quantityHO: 500, quantityStore: 25, price: 120, vendor: 'TechParts Inc.', reorderLevel: 50, uploadDate: '2023-11-20' },
  { id: '102', name: 'Samsung S24 Battery', category: 'Parts', sku: 'PRT-S24-BAT', quantityHO: 300, quantityStore: 10, price: 45, vendor: 'CellSupply', reorderLevel: 30, uploadDate: '2023-11-20' },
  { id: '103', name: 'Screen Protector Glass', category: 'Accessories', sku: 'ACC-GLS-UNI', quantityHO: 2000, quantityStore: 150, price: 5, vendor: 'GlassCo', reorderLevel: 200, uploadDate: '2023-11-22' },
  { id: '104', name: 'USB-C Cable', category: 'Accessories', sku: 'ACC-USBC-2M', quantityHO: 1000, quantityStore: 80, price: 8, vendor: 'CableWorld', reorderLevel: 100, uploadDate: '2023-11-22' },
  { id: '105', name: 'Repair Toolkit Pro', category: 'Tools', sku: 'TOOL-PRO-KIT', quantityHO: 50, quantityStore: 5, price: 85, vendor: 'FixItTools', reorderLevel: 10, uploadDate: '2023-11-25' },
];

export const MOCK_INVOICES: Invoice[] = [
  { 
    id: 'INV-001', 
    customerName: 'Rahul Khanna', 
    date: '2023-11-10', 
    amount: 15000, 
    status: 'Paid', 
    type: 'Repair', 
    storeName: 'Downtown Branch', 
    category: 'GST', 
    gstNumber: '29ABCDE1234F1Z5',
    items: [{ name: 'iPhone 13 Screen Module', qty: 1, price: 15000 }]
  },
  { 
    id: 'INV-002', 
    customerName: 'Sameer Shah', 
    date: '2023-11-12', 
    amount: 4500, 
    status: 'Paid', 
    type: 'Sale', 
    storeName: 'Northgate Branch', 
    category: 'Non-GST',
    items: [{ name: 'Premium USB-C Charger', qty: 2, price: 2250 }]
  },
  { 
    id: 'INV-003', 
    customerName: 'Acme Solutions', 
    date: '2023-11-15', 
    amount: 120000, 
    status: 'Pending', 
    type: 'Sale', 
    storeName: 'Head Office', 
    category: 'GST', 
    gstNumber: '07AAACA1234A1Z1',
    items: [{ name: 'Bulk Tempered Glass (100pcs)', qty: 1, price: 120000 }]
  },
  { 
    id: 'INV-004', 
    customerName: 'Anita Desai', 
    date: '2023-11-18', 
    amount: 8500, 
    status: 'Paid', 
    type: 'Repair', 
    storeName: 'Downtown Branch', 
    category: 'Non-GST',
    items: [{ name: 'Battery Replacement - Galaxy S22', qty: 1, price: 8500 }]
  },
  { 
    id: 'INV-005', 
    customerName: 'Vikram Singh', 
    date: '2023-11-20', 
    amount: 25000, 
    status: 'Paid', 
    type: 'Sale', 
    storeName: 'Northgate Branch', 
    category: 'GST',
    items: [{ name: 'Certified Pre-owned iPhone 11', qty: 1, price: 25000 }]
  },
  { 
    id: 'INV-006', 
    customerName: 'Priya Sharma', 
    date: '2023-11-22', 
    amount: 3200, 
    status: 'Paid', 
    type: 'Sale', 
    storeName: 'Downtown Branch', 
    category: 'Non-GST',
    items: [{ name: 'Leather Back Cover', qty: 2, price: 1600 }]
  },
];

export const MOCK_JOB_SHEETS: JobSheet[] = [
  { id: 'JS-1001', customerName: 'Rahul Khanna', customerPhone: '9876543210', deviceModel: 'iPhone 13', issueDescription: 'Screen cracked', estimatedCost: 12000, status: 'Repairing', technicianId: '2', date: '2023-11-10', storeName: 'Downtown Branch' },
  { id: 'JS-1002', customerName: 'Simran Jeet', customerPhone: '9123456789', deviceModel: 'MacBook Air M1', issueDescription: 'Trackpad not responding', estimatedCost: 8500, status: 'Diagnosing', technicianId: '2', date: '2023-11-11', storeName: 'Downtown Branch' },
  { id: 'JS-1003', customerName: 'Vikram Seth', customerPhone: '8877665544', deviceModel: 'OnePlus 11', issueDescription: 'Battery draining fast', estimatedCost: 3200, status: 'Ready', technicianId: '2', date: '2023-11-12', storeName: 'Northgate Branch' },
];

export const MOCK_PURCHASES: PurchaseOrder[] = [
  { 
    id: 'PO-8821', 
    vendorName: 'TechParts Inc.', 
    date: '2023-11-15', 
    items: [{ name: 'iPhone 15 Screen', qty: 50, price: 120 }], 
    totalAmount: 6000, 
    status: 'Received' 
  },
  { 
    id: 'PO-9910', 
    vendorName: 'CellSupply', 
    date: '2023-11-18', 
    items: [{ name: 'Samsung S24 Battery', qty: 100, price: 45 }], 
    totalAmount: 4500, 
    status: 'Ordered' 
  },
  { 
    id: 'PO-1024', 
    vendorName: 'GlassCo', 
    date: '2023-11-20', 
    items: [{ name: 'Screen Protector Glass', qty: 500, price: 5 }], 
    totalAmount: 2500, 
    status: 'Draft' 
  },
];

export const PERMISSIONS_MATRIX: Record<string, any> = {
  MASTER_ADMIN: {
    all: true
  },
  STORE_MANAGER: {
    views: [
      'DASHBOARD',
      'HR_ATTENDANCE', 'HR_TIMING', 'HR_STORE',
      'INVENTORY_MAIN', 'INVENTORY_TOOLS_TRACKING', 'INVENTORY_RETURN_LOGS', 'INVENTORY_PARTS_USAGE', 'INVENTORY_TRANSFER',
      'ACCOUNTS', 'ACCOUNTS_JOB_SHEET', 'ACCOUNTS_CREATE_INVOICE',
      'SETTINGS'
    ],
    actions: {
      hr: { read: true, write: true },
      inventory: { read: true, write: true, approve: true },
      finance: { read: true, write: true }
    }
  },
  INVENTORY_LEAD: {
    views: [
      'DASHBOARD',
      'INVENTORY_MANAGEMENT', 'INVENTORY_CATEGORIES', 'INVENTORY_STOCK_CONTROL', 'INVENTORY_UPLOADS', 'INVENTORY_VENDOR', 'INVENTORY_TRANSFER',
      'INVENTORY_STORE_STOCK', 'INVENTORY_PARTS_USAGE', 'INVENTORY_TOOLS_TRACKING', 'INVENTORY_RETURN_LOGS', 'INVENTORY_MAIN',
      'SETTINGS'
    ],
    actions: {
      inventory: { read: true, write: true, delete: true, approve: true }
    }
  },
  SALES_HEAD: {
    views: [
      'DASHBOARD',
      'FINANCE_SALES', 'FINANCE_PURCHASES', 'ACCOUNTS_JOB_SHEET', 'ACCOUNTS_CREATE_INVOICE', 'ACCOUNTS_SYNC',
      'ACCOUNTS',
      'SETTINGS'
    ],
    actions: {
      finance: { read: true, write: true, approve: true }
    }
  }
};
