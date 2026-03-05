import { authService } from './authService.ts';

export interface StoreRecord {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  gst?: string;
  active: boolean;
}

const headers = (token?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
};

export const storesService = {
  async fetchAll(): Promise<StoreRecord[]> {
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/stores` : '/stores';
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  },

  async upsert(store: StoreRecord): Promise<StoreRecord | null> {
    const user = authService.getCurrentUser();
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/stores/${store.id}` : `/stores/${store.id}`;
    const res = await fetch(url, { method: 'PUT', headers: headers(user?.token), body: JSON.stringify(store) });
    if (!res.ok) return null;
    return await res.json();
  },

  async remove(id: string): Promise<boolean> {
    const user = authService.getCurrentUser();
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/stores/${id}` : `/stores/${id}`;
    const res = await fetch(url, { method: 'DELETE', headers: headers(user?.token) });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.ok;
  },

  async importCsv(csv: string): Promise<any> {
    const user = authService.getCurrentUser();
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/stores/import` : `/stores/import`;
    const res = await fetch(url, { method: 'POST', headers: headers(user?.token), body: JSON.stringify({ csv }) });
    if (!res.ok) throw new Error('Import failed');
    return await res.json();
  }
};
