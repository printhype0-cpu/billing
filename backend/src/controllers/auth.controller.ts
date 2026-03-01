import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { findByEmailOrRole, findById } from '../services/users.store.js';
import { hashPassword } from '../utils/hash.js';
import { sign, verify } from '../utils/jwt.js';
import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

type Role = 'MASTER_ADMIN' | 'STORE_MANAGER' | 'INVENTORY_LEAD' | 'SALES_HEAD';

class LoginDto {
  @IsEmail()
  email!: string;
  @IsOptional()
  @IsString()
  password?: string;
  @IsOptional()
  @IsIn(['MASTER_ADMIN', 'STORE_MANAGER', 'INVENTORY_LEAD', 'SALES_HEAD'])
  role?: Role;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly users: UsersService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const email = body.email;
    let user =
      (await this.users.findByEmailOrRole(email, undefined));
    if (!user && process.env.NODE_ENV !== 'production') {
      user = findByEmailOrRole(email, undefined);
    }
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    // determine password requirement using dedicated password store when available
    // @ts-ignore
    const storedHash = await (this.users as any).getPasswordHash?.(user.id);
    // @ts-ignore
    const requiresPassword = !!storedHash || user.role === 'MASTER_ADMIN';
    if (requiresPassword) {
      if (!body.password) return { error: 'Password required' };
      if (!storedHash) return { error: 'Password required' };
      const match = hashPassword(body.password) === storedHash;
      if (!match) return { error: 'Password incorrect' };
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
    const user = process.env.NODE_ENV !== 'production' ? findById(userId) : await this.users.findById(userId);
    if (!user) return { error: 'Unauthorized' };
    return { user: { ...user, token } };
  }
}
