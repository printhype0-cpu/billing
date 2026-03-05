import { Controller, Get, Post, Body, HttpException, HttpStatus, Header } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service.js';

// same sample items used in service defaults
const SAMPLE = [
  { id: '101', name: 'iPhone 15 Screen', category: 'Parts', sku: 'PRT-IP15-SCR', quantityHO: 120, quantityStore: 20, price: 12000, vendor: 'Imported', reorderLevel: 10 },
  { id: '102', name: 'Samsung S24 Battery', category: 'Parts', sku: 'PRT-S24-BAT', quantityHO: 80, quantityStore: 15, price: 6500, vendor: 'Samsung', reorderLevel: 15 }
];

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  async list() {
    return this.inventory.findAll();
  }

  // CSV export endpoint for inventory items
  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory.csv"')
  async exportCsv() {
    const list = await this.inventory.findAll();
    const headers = ['id','name','category','sku','quantityHO','quantityStore','price','vendor','reorderLevel','uploadDate'];
    const lines = [headers.join(',')].concat(
      list.map(item => {
        const vals = [
          item.id,
          item.name,
          item.category || '',
          item.sku || '',
          String(item.quantityHO ?? ''),
          String(item.quantityStore ?? ''),
          String(item.price ?? ''),
          item.vendor || '',
          String(item.reorderLevel ?? ''),
          item.uploadDate || ''
        ];
        return vals.map(v => {
          const str = String(v ?? '');
          if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
          return str;
        }).join(',');
      })
    );
    return lines.join('\n');
  }

  @Get('template')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory_template.csv"')
  templateCsv() {
    const headers = 'name,sku,category,price,quantityHO,quantityStore,reorderLevel,vendor';
    const example = 'iPhone Screen,PRT-IP15,Parts,120,500,20,50,TechParts Inc.';
    return `${headers}\n${example}`;
  }

  @Post('import')
  async importCsv(@Body() body: { csv: string }) {
    const text = body.csv || '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
      throw new HttpException('CSV contains no data', HttpStatus.BAD_REQUEST);
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['name', 'sku'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) {
      throw new HttpException(`Missing column(s): ${missing.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    const seenSku = new Set<string>();
    const results = { created: 0, updated: 0, skipped: 0, duplicates: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 2) continue;
      const item: any = {};
      headers.forEach((h, idx) => {
        item[h] = values[idx];
      });
      if (item.name && item.sku) {
        const key = item.sku.toLowerCase();
        if (seenSku.has(key)) {
          results.skipped++;
          results.duplicates.push(item.sku);
          continue;
        }
        seenSku.add(key);
        // use service to upsert
        const existing = await this.inventory.findBySku(item.sku);
        const inv: any = {
          id: existing?.id || `IMP-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
          name: item.name,
          sku: item.sku,
          category: item.category || 'General',
          price: parseFloat(item.price) || 0,
          quantityHO: parseInt(item.quantityho) || parseInt(item.quantity) || 0,
          quantityStore: parseInt(item.quantitystore) || 0,
          reorderLevel: parseInt(item.reorderlevel) || 10,
          vendor: item.vendor || 'Imported',
          uploadDate: new Date().toISOString().split('T')[0]
        };
        if (existing) {
          await this.inventory.upsert(inv as any);
          results.updated++;
        } else {
          await this.inventory.upsert(inv as any);
          results.created++;
        }
      }
    }
    return results;
  }
}
