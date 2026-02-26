import fs from 'fs';
import path from 'path';
import { hashPassword } from '../utils/hash.js';

type Role = 'MASTER_ADMIN' | 'STORE_MANAGER' | 'INVENTORY_LEAD' | 'SALES_HEAD';

export interface UserRecord {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  email: string;
  passwordHash?: string;
}

const DEFAULT_USERS: UserRecord[] = [
  { id: 'u1', name: 'Master Admin', role: 'MASTER_ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', email: 'admin@techwizardry.com' },
  { id: 'u2', name: 'Store Manager', role: 'STORE_MANAGER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager', email: 'manager@techwizardry.com' },
  { id: 'u3', name: 'Inventory Lead', role: 'INVENTORY_LEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory', email: 'inventory@techwizardry.com' },
  { id: 'u4', name: 'Sales Head', role: 'SALES_HEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sales', email: 'sales@techwizardry.com' }
];

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'users.json');

const ensureDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

export const getUsers = (): UserRecord[] => {
  try {
    ensureDir();
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_USERS, null, 2));
      return DEFAULT_USERS;
    }
    const text = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(text) as UserRecord[];
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users: UserRecord[]) => {
  try {
    ensureDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));
  } catch {
    // swallow
  }
};

export const setPassword = (id: string, plain: string): UserRecord | null => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], passwordHash: hashPassword(plain) };
  saveUsers(users);
  return users[idx];
};

export const findByEmailOrRole = (email?: string, role?: Role): UserRecord | null => {
  const users = getUsers();
  return users.find(u => (email && u.email === email) || (role && u.role === role)) || null;
};

export const findById = (id: string): UserRecord | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};
