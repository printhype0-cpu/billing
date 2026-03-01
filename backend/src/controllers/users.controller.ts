import { Body, Controller, Get, Headers, Param, Put } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { verify } from '../utils/jwt.js';
import { IsString, MinLength } from 'class-validator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list() {
    return await this.users.findAll();
  }

  @Put(':id/password')
  async updatePassword(@Param('id') id: string, @Body() body: { password: string }, @Headers('authorization') auth?: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return { error: 'Unauthorized' };
    const payload = verify(token) as { sub?: string; role?: string } | null;
    if (!payload?.sub || payload.role !== 'MASTER_ADMIN') return { error: 'Unauthorized' };
    const userId = payload.sub;
    const requester = await this.users.findById(userId);
    if (!requester || requester.role !== 'MASTER_ADMIN') return { error: 'Unauthorized' };
    if (!body?.password) return { error: 'Password required' };
    const updated = await this.users.setPassword(id, body.password);
    if (!updated) return { error: 'User not found' };
    return { ok: true };
  }
}
