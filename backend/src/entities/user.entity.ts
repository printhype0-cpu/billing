import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  role!: 'MASTER_ADMIN' | 'STORE_MANAGER' | 'INVENTORY_LEAD' | 'SALES_HEAD';

  @Column({ nullable: true })
  avatar?: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  passwordHash?: string;
}
