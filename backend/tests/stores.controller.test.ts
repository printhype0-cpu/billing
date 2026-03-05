import assert from 'assert';
import { StoresController } from '../src/controllers/stores.controller.js';
import { StoresService } from '../src/services/stores.service.js';
import { Store } from '../src/entities/store.entity.js';

// simple in-memory service stub
class MockStoresService extends StoresService {
  private data: Store[] = [];

  constructor() {
    super(null as any); // repo not used
  }

  async findAll(): Promise<Store[]> {
    return [...this.data];
  }
  findByName(name: string): Promise<Store | null> {
    const s = this.data.find(x => x.name === name);
    return Promise.resolve(s || null);
  }
  async upsert(store: Store): Promise<Store> {
    const idx = this.data.findIndex(x => x.id === store.id);
    if (idx >= 0) this.data[idx] = store;
    else this.data.push(store);
    return store;
  }
}


export async function run() {
  console.log('Running StoresController tests...');
  const service = new MockStoresService();
  const controller = new StoresController(service);

  let res: any;
  res = await controller.upsert('1', { name: '' }, 'Bearer tok');
  assert(res.error === 'Name is required', 'missing-name validation');

  res = await controller.upsert('1', { name: 'Main Branch' }, 'Bearer tok');
  assert(res.name === 'Main Branch', 'creation works');

  res = await controller.upsert('2', { name: 'Main Branch' }, 'Bearer tok');
  assert(res.error === 'A branch with this name already exists', 'duplicate detected');

  // import CSV edge cases
  let summary;
  try {
    await controller.importCsv({ csv: 'badheader\n1,foo' }, 'Bearer tok');
  } catch (e: any) {
    assert(e.message.includes('Missing column'), 'missing header error');
  }

  summary = await controller.importCsv({ csv: 'name\nBranch1' }, 'Bearer tok');
  assert(summary.created === 1 && summary.updated === 0, 'import simple create');

  // duplicate line within file should be skipped
  summary = await controller.importCsv({ csv: 'name\nBranch2\nBranch2' }, 'Bearer tok');
  assert(summary.created === 1 && summary.skipped === 1, 'import skips duplicate names');

  console.log('StoresController tests passed');
}
