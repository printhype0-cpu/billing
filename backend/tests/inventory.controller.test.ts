import assert from 'assert';
import { InventoryController } from '../src/controllers/inventory.controller.js';
import { InventoryService } from '../src/services/inventory.service.js';
import { InventoryItem } from '../src/entities/inventory.entity.js';

// simple stub
class MockInventoryService extends InventoryService {
  private data: InventoryItem[] = [];
  constructor() { super(null as any); }
  async findAll(): Promise<InventoryItem[]> { return [...this.data]; }
  seed(items: InventoryItem[]) { this.data = [...items]; }
  findBySku(sku: string): Promise<InventoryItem | null> {
    const x = this.data.find(i => i.sku === sku);
    return Promise.resolve(x || null);
  }
  async upsert(item: InventoryItem): Promise<InventoryItem> {
    const idx = this.data.findIndex(i => i.id === item.id || i.sku === item.sku);
    if (idx >= 0) this.data[idx] = item;
    else this.data.push(item);
    return item;
  }
}

// ensure csv generation works as expected

export async function run() {
  console.log('Running InventoryController tests...');
  const service = new MockInventoryService();
  const controller = new InventoryController(service);
  service.seed([
    { id: '101', name: 'Widget', category: 'Gadget', sku: 'W-101', quantityHO: 10, quantityStore: 5, price: 100, vendor: 'Acme', reorderLevel: 2, uploadDate: '2025-01-01' } as any,
    { id: '102', name: 'Thing', category: 'Gadget', sku: 'T-102', quantityHO: 3, quantityStore: 1, price: 50, vendor: 'Beta', reorderLevel: 1, uploadDate: '2025-01-02' } as any
  ]);

  let csv = await controller.exportCsv();
  assert(csv.includes('id,name,category,sku,quantityHO,quantityStore,price,vendor,reorderLevel,uploadDate'));
  let lines = csv.split('\n');
  assert(lines.length === 3);
  assert(lines[1].startsWith('101,Widget'));
  assert(lines[2].startsWith('102,Thing'));

  const tpl = controller.templateCsv();
  assert(tpl.startsWith('name,sku,category,price,quantityHO,quantityStore,reorderLevel,vendor'));

  // import tests
  try {
    await controller.importCsv({ csv: 'sku\n1' });
    assert(false, 'should have thrown missing column error');
  } catch (e: any) {
    assert(e.message.includes('Missing column'), 'import header validation');
  }

  const importCsv = 'name,sku\nNewItem,SKU1';
  let result = await controller.importCsv({ csv: importCsv });
  assert(result.created === 1 && result.updated === 0, 'inventory import create');

  // duplicate SKUs inside
  result = await controller.importCsv({ csv: 'name,sku\nA,SKU2\nB,SKU2' });
  assert(result.created === 1 && result.skipped === 1, 'inventory import skip duplicate sku');

  console.log('InventoryController tests passed');
}
