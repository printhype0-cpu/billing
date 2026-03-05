export type Role = 'MASTER_ADMIN' | 'STORE_MANAGER' | 'INVENTORY_LEAD' | 'SALES_HEAD';

export type View = 
  | 'DASHBOARD' 
  // HR Sub-views
  | 'HR_ATTENDANCE'
  | 'HR_TIMING'
  | 'HR_STORE'
  | 'HR_CANDIDATES'
  | 'HR_ONBOARDING'
  | 'HR_STORE_ATTENDANCE'
  | 'HR_MAIN'
  
  // Inventory Views
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
  | 'INVENTORY_UPLOADS'

  // Accounts & Finance Views
  | 'ACCOUNTS_JOB_SHEET'
  | 'ACCOUNTS_CREATE_INVOICE'
  | 'ACCOUNTS_SYNC'
  | 'ACCOUNTS' 
  | 'FINANCE_SALES'
  | 'FINANCE_PURCHASES'
  
  // Manage Branch Views
  | 'MANAGE_BRANCH_DETAILS'
  | 'MANAGE_BRANCH_STAFF'
  | 'MANAGE_BRANCH_ACCESS'

  | 'SETTINGS';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email?: string;
  passwordHash?: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role?: Role; // For the simplified login
  storeId?: string; // For store-scoped authentication
}

export interface CandidateDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}

export interface Staff {
  id: string;
  name: string;
  position: string;
  store: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  attendance: number;
  documents?: CandidateDocument[];
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Leave';

export interface AttendanceRecord {
  date: string;
  staffId: string;
  status: AttendanceStatus;
  timeIn?: string;
  timeOut?: string;
  markedBy: string;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  status: 'New' | 'Interviewed' | 'Hired' | 'Rejected';
  appliedDate: string;
  expectedSalary: number;
  onboardingStage?: 'Documents' | 'Training' | 'Ready';
  email?: string;
  phone?: string;
  documents?: CandidateDocument[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantityHO: number;
  quantityStore: number;
  price: number;
  vendor: string;
  reorderLevel: number;
  uploadDate?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstIn: string;
  rating?: number;
  status: 'Active' | 'Inactive';
}

export type TransferStatus = 'Pending' | 'In-Transit' | 'Completed' | 'Cancelled';

export interface StockTransfer {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  source: string;
  destination: string;
  status: TransferStatus;
  initiatedBy: string;
  date: string;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending';
  type: 'Sale' | 'Repair';
  storeName?: string;
  gstNumber?: string;
  category?: 'GST' | 'Non-GST';
  items?: { name: string; qty: number; price: number }[];
}

export interface PurchaseOrder {
  id: string;
  vendorName: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  totalAmount: number;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
}

export interface JobSheet {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
  estimatedCost: number;
  status: 'Received' | 'Diagnosing' | 'Repairing' | 'Ready' | 'Delivered';
  technicianId?: string;
  date: string;
  storeName: string;
}

export const GeminiModel = {
  FLASH: 'gemini-3-flash-preview',
  PRO: 'gemini-3.1-pro-preview'
} as const;

export type GeminiModelType = typeof GeminiModel[keyof typeof GeminiModel];
