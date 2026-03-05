import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'inventory_items' })
export class InventoryItem {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  category!: string;

  @Column()
  sku!: string;

  @Column('int')
  quantityHO!: number;

  @Column('int')
  quantityStore!: number;

  @Column('int')
  price!: number;

  @Column()
  vendor!: string;

  @Column('int')
  reorderLevel!: number;

  @Column({ nullable: true })
  uploadDate?: string;
}
