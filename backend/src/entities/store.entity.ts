import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'stores' })
export class Store {
  @PrimaryColumn()
  id!: string; // string id to align with existing UI ids

  @Column()
  name!: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  gst?: string;

  @Column({ default: true })
  active!: boolean;
}
