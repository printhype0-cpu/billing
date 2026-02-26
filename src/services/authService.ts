
import { Role, AuthUser, LoginCredentials, User } from '../../types.ts';

const USERS_KEY = 'crm_users_db';
const SESSION_KEY = 'crm_auth_session';
const SALT = 'twcrm';

const storage = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage
  : {
      getItem: (_key: string) => null as any,
      setItem: (_key: string, _value: string) => {},
      removeItem: (_key: string) => {}
    };

// Predefined users for the system
const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Master Admin', role: 'MASTER_ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', email: 'admin@techwizardry.com' },
  { id: 'u2', name: 'Store Manager', role: 'STORE_MANAGER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager', email: 'manager@techwizardry.com' },
  { id: 'u3', name: 'Inventory Lead', role: 'INVENTORY_LEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory', email: 'inventory@techwizardry.com' },
  { id: 'u4', name: 'Sales Head', role: 'SALES_HEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sales', email: 'sales@techwizardry.com' },
];

export const authService = {
  hashPassword: (plain: string): string => {
    try {
      return btoa(`${plain}|${SALT}`);
    } catch {
      // Fallback for non-browser environments
      // @ts-ignore
      return Buffer.from(`${plain}|${SALT}`).toString('base64');
    }
  },

  getUsers: (): User[] => {
    const saved = storage.getItem(USERS_KEY);
    if (!saved) {
      storage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(saved);
  },

  setPassword: (userId: string, password: string): User | null => {
    if (!password) return null;
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], passwordHash: authService.hashPassword(password) };
    storage.setItem(USERS_KEY, JSON.stringify(users));
    return users[idx];
  },

  setAvatar: (userId: string, avatar: string): User | null => {
    if (!avatar) return null;
    const users = authService.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], avatar };
    storage.setItem(USERS_KEY, JSON.stringify(users));
    const sessionSaved = storage.getItem(SESSION_KEY);
    if (sessionSaved) {
      try {
        const s = JSON.parse(sessionSaved) as AuthUser;
        if (s.id === userId) {
          const next = { ...s, avatar };
          storage.setItem(SESSION_KEY, JSON.stringify(next));
        }
      } catch {}
    }
    return users[idx];
  },

  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (data?.error || !data?.user) {
        throw new Error(data?.error || 'Invalid credentials');
      }
      const authUser: AuthUser = data.user;
      storage.setItem(SESSION_KEY, JSON.stringify(authUser));
      // also sync local users store for UI consistency
      const users = authService.getUsers();
      const idx = users.findIndex(u => u.id === authUser.id);
      if (idx === -1) {
        storage.setItem(USERS_KEY, JSON.stringify([...users, authUser]));
      } else {
        users[idx] = { ...users[idx], ...authUser };
        storage.setItem(USERS_KEY, JSON.stringify(users));
      }
      return authUser;
    } catch {
      // Fallback to local demo mode
      const users = authService.getUsers();
      const user = users.find(u => u.email === credentials.email || (credentials.role && u.role === credentials.role));
      if (!user) {
        throw new Error('Invalid credentials');
      }
      if (user.passwordHash) {
        if (!credentials.password) {
          throw new Error('Password required');
        }
        const hash = authService.hashPassword(credentials.password);
        if (hash !== user.passwordHash) {
          throw new Error('Invalid credentials');
        }
      }
      const authUser: AuthUser = {
        ...user,
        token: `mock-jwt-token-${user.id}-${Date.now()}`
      };
      storage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return authUser;
    }
  },

  logout: () => {
    storage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): AuthUser | null => {
    const saved = storage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!authService.getCurrentUser();
  }
};
