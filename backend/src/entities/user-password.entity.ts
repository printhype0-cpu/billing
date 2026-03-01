import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_passwords' })
export class UserPassword {
  @PrimaryColumn()
  userId!: string;

  @Column({ nullable: true })
  passwordHash?: string;
}
