import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory.entity.js';

const DEFAULT_ITEMS: InventoryItem[] = [
  { id: '101', name: 'iPhone 15 Screen', category: 'Parts', sku: 'PRT-IP15-SCR', quantityHO: 120, quantityStore: 20, price: 12000, vendor: 'Imported', reorderLevel: 10 },
  { id: '102', name: 'Samsung S24 Battery', category: 'Parts', sku: 'PRT-S24-BAT', quantityHO: 80, quantityStore: 15, price: 6500, vendor: 'Samsung', reorderLevel: 15 }
];

@Injectable()
export class InventoryService {
  constructor(@InjectRepository(InventoryItem) private readonly repo: Repository<InventoryItem>) {}

  async findAll(): Promise<InventoryItem[]> {
    try {
      const count = await this.repo.count();
      if (count === 0 && process.env.NODE_ENV !== 'production') {
        await this.repo.save(DEFAULT_ITEMS);
      }
      return await this.repo.find();
    } catch {
      return process.env.NODE_ENV === 'production' ? [] : DEFAULT_ITEMS;
    }
  }
}
