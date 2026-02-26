import { Controller, Get } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service.js';

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
}
