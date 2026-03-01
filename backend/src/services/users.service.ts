import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { hashPassword } from '../utils/hash.js';
import { UserPassword } from '../entities/user-password.entity.js';

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Master Admin', role: 'MASTER_ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', email: 'admin@tech2wizard.com' },
  { id: 'u2', name: 'Store Manager', role: 'STORE_MANAGER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager', email: 'manager@techwizardry.com' },
  { id: 'u3', name: 'Inventory Lead', role: 'INVENTORY_LEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory', email: 'inventory@techwizardry.com' },
  { id: 'u4', name: 'Sales Head', role: 'SALES_HEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sales', email: 'sales@techwizardry.com' },
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(UserPassword) private readonly pwdRepo: Repository<UserPassword>
  ) {}

  async findAll(): Promise<User[]> {
    try {
      const count = await this.repo.count();
      if (count === 0 && process.env.NODE_ENV !== 'production') {
        await this.repo.save(DEFAULT_USERS);
      }
      return await this.repo.find();
    } catch {
      return process.env.NODE_ENV === 'production' ? [] : DEFAULT_USERS;
    }
  }

  async findByEmailOrRole(email?: string, role?: User['role']): Promise<User | null> {
    try {
      if (email) {
        const byEmail = await this.repo.findOne({ where: { email } });
        if (byEmail) return byEmail;
      }
      if (role) {
        const byRole = await this.repo.findOne({ where: { role } });
        if (byRole) return byRole;
      }
      return null;
    } catch {
      return DEFAULT_USERS.find(u => u.email === email || (role && u.role === role)) || null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.repo.findOne({ where: { id } });
    } catch {
      return DEFAULT_USERS.find(u => u.id === id) || null;
    }
  }

  async setPassword(id: string, plain: string): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    const hashed = hashPassword(plain);
    // keep users table in sync for backward compatibility
    user.passwordHash = hashed;
    await this.repo.save(user);
    // upsert into dedicated password table
    const existing = await this.pwdRepo.findOne({ where: { userId: id } });
    if (existing) {
      existing.passwordHash = hashed;
      await this.pwdRepo.save(existing);
    } else {
      const rec = this.pwdRepo.create({ userId: id, passwordHash: hashed });
      await this.pwdRepo.save(rec);
    }
    return user;
  }

  async getPasswordHash(userId: string): Promise<string | null> {
    try {
      const rec = await this.pwdRepo.findOne({ where: { userId } });
      if (rec?.passwordHash) return rec.passwordHash;
    } catch {}
    const user = await this.findById(userId);
    return user?.passwordHash || null;
  }
}
