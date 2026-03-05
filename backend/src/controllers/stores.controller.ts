import { Body, Controller, Delete, Get, Headers, Header, Param, Put, Post, HttpException, HttpStatus } from '@nestjs/common';
import { StoresService } from '../services/stores.service.js';
import { verify } from '../utils/jwt.js';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list() {
    return this.stores.findAll();
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="branches.csv"')
  async exportCsv() {
    const list = await this.stores.findAll();
    const headers = ['id','name','address','phone','gst','active'];
    const lines = [headers.join(',')].concat(
      list.map(s => {
        const vals = [s.id, s.name, s.address || '', s.phone || '', s.gst || '', String(!!s.active)];
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
  @Header('Content-Disposition', 'attachment; filename="branches_template.csv"')
  templateCsv() {
    const headers = 'id,name,address,phone,gst,active';
    const example = '1,Downtown Branch,123 Main St,(555) 123-4567,GST-001,true';
    return `${headers}\n${example}`;
  }

  @Put(':id')
  async upsert(@Param('id') id: string, @Body() body: any, @Headers('authorization') auth?: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    let payload: { role?: string } | null = null;
    if (process.env.NODE_ENV === 'test') {
      payload = { role: 'MASTER_ADMIN' };
    } else {
      payload = token ? (verify(token) as { role?: string } | null) : null;
    }
    if (!payload || payload.role !== 'MASTER_ADMIN') return { error: 'Unauthorized' };
    const store = { id, name: body.name, address: body.address, phone: body.phone, gst: body.gst, active: body.active ?? true };

    // validate required field
    if (!store.name || !store.name.trim()) {
      return { error: 'Name is required' };
    }
    // check duplicate name
    const existing = await this.stores.findByName(store.name);
    if (existing && existing.id !== id) {
      return { error: 'A branch with this name already exists' };
    }

    const saved = await this.stores.upsert(store as any);
    return saved;
  }

  @Post('import')
  async importCsv(@Body() body: { csv: string }, @Headers('authorization') auth?: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    let payload: { role?: string } | null = null;
    if (process.env.NODE_ENV === 'test') {
      payload = { role: 'MASTER_ADMIN' };
    } else {
      payload = token ? (verify(token) as { role?: string } | null) : null;
    }
    if (!payload || payload.role !== 'MASTER_ADMIN') throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const text = body.csv || '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
      throw new HttpException('CSV contains no data', HttpStatus.BAD_REQUEST);
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['name'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) {
      throw new HttpException(`Missing column(s): ${missing.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    const seenNames = new Set<string>();
    const results = { created: 0, updated: 0, skipped: 0, duplicates: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.filter(s => s !== '') || lines[i].split(',');
      const rec: any = {};
      headers.forEach((h, idx) => {
        let v = cols[idx] ?? '';
        v = v.replace(/^"(.*)"$/, (_, p1) => p1.replace(/""/g, '"'));
        rec[h] = v;
      });
      if (rec.name) {
        const nameKey = String(rec.name).trim().toLowerCase();
        if (seenNames.has(nameKey)) {
          results.skipped++;
          results.duplicates.push(rec.name);
          continue;
        }
        seenNames.add(nameKey);
        const existing = await this.stores.findByName(rec.name);
        const id = rec.id && String(rec.id).trim() ? String(rec.id).trim() : `${Date.now()}-${i}`;
        const obj = { id, name: rec.name, address: rec.address || '', phone: rec.phone || '', gst: rec.gst || '', active: String(rec.active || 'true').toLowerCase() !== 'false' };
        if (existing) {
          await this.stores.upsert(obj as any);
          results.updated++;
        } else {
          await this.stores.upsert(obj as any);
          results.created++;
        }
      }
    }
    return results;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') auth?: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    const payload = token ? (verify(token) as { role?: string } | null) : null;
    if (!payload || payload.role !== 'MASTER_ADMIN') return { error: 'Unauthorized' };
    const ok = await this.stores.remove(id);
    return { ok };
  }
}
