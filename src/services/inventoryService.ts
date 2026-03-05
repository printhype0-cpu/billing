import { authService } from './authService.ts';

export interface InventoryRecord {
  id: string;
  name: string;
  category?: string;
  sku?: string;
  quantityHO?: number;
  quantityStore?: number;
  price?: number;
  vendor?: string;
  reorderLevel?: number;
  uploadDate?: string;
}

const headers = (token?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
};

export const inventoryService = {
  async fetchAll(): Promise<InventoryRecord[]> {
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/inventory` : '/inventory';
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  },

  async importCsv(csv: string): Promise<any> {
    const user = authService.getCurrentUser();
    const base = authService.apiBase ? authService.apiBase() : '';
    const url = base ? `${base}/inventory/import` : '/inventory/import';
    const res = await fetch(url, { method: 'POST', headers: headers(user?.token), body: JSON.stringify({ csv }) });
    if (!res.ok) throw new Error('Import failed');
    return await res.json();
  }
};
