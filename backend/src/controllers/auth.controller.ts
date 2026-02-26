import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { findByEmailOrRole, findById } from '../services/users.store.js';
import { hashPassword } from '../utils/hash.js';
import { sign, verify } from '../utils/jwt.js';
import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

type Role = 'MASTER_ADMIN' | 'STORE_MANAGER' | 'INVENTORY_LEAD' | 'SALES_HEAD';

class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsString()
  password?: string;
  @IsOptional()
  @IsIn(['MASTER_ADMIN', 'STORE_MANAGER', 'INVENTORY_LEAD', 'SALES_HEAD'])
  role?: Role;
}

const DEFAULT_USERS = [
  { id: 'u1', name: 'Master Admin', role: 'MASTER_ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', email: 'admin@techwizardry.com' },
  { id: 'u2', name: 'Store Manager', role: 'STORE_MANAGER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager', email: 'manager@techwizardry.com' },
  { id: 'u3', name: 'Inventory Lead', role: 'INVENTORY_LEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory', email: 'inventory@techwizardry.com' },
  { id: 'u4', name: 'Sales Head', role: 'SALES_HEAD', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sales', email: 'sales@techwizardry.com' }
];

@Controller('auth')
export class AuthController {
  constructor(private readonly users: UsersService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user =
      (await this.users.findByEmailOrRole(body.email, body.role)) ||
      findByEmailOrRole(body.email, body.role) ||
      DEFAULT_USERS.find(u => u.email === body.email || (body.role && u.role === body.role));
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    if (user.role === 'MASTER_ADMIN') {
      if (!body.password) return { error: 'Password required' };
    }
    // @ts-ignore
    if (user.passwordHash || user.role === 'MASTER_ADMIN') {
      // @ts-ignore
      const match = body.password ? hashPassword(body.password) === user.passwordHash : false;
      if (!match) return { error: 'Invalid credentials' };
    }
    const token = sign({ sub: user.id, role: user.role });
    return { user: { ...user, token } };
  }

  @Get('me')
  async me(@Headers('authorization') auth?: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { error: 'Unauthorized' };
    const payload = verify(token) as { sub?: string } | null;
    if (!payload?.sub) return { error: 'Unauthorized' };
    const userId = payload.sub;
    const user = findById(userId);
    if (!user) return { error: 'Unauthorized' };
    return { user: { ...user, token } };
  }
}
