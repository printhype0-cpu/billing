import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { InventoryItem } from '../entities/inventory.entity.js';
import { UserPassword } from '../entities/user-password.entity.js';
import { Store } from '../entities/store.entity.js';
import path from 'path';

export function buildTypeOrmConfig(): TypeOrmModuleOptions {
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, DB_USE_SQLITE, NODE_ENV } = process.env as Record<string, string>;
  const isProd = NODE_ENV === 'production';
  if (MYSQL_HOST && MYSQL_USER && MYSQL_DB && (!DB_USE_SQLITE || isProd)) {
    return {
      type: 'mysql',
      host: MYSQL_HOST,
      port: MYSQL_PORT ? Number(MYSQL_PORT) : 3306,
      username: MYSQL_USER,
      password: MYSQL_PASSWORD || '',
      database: MYSQL_DB,
      entities: [User, InventoryItem, UserPassword, Store],
      synchronize: !isProd,
      logging: false
    };
  }
  if (isProd) {
    throw new Error('Production requires MySQL environment variables to be set');
  }
  const dbPath = path.join(process.cwd(), 'data', 'dev.sqlite');
  return {
    type: 'sqlite',
    database: dbPath,
    entities: [User, InventoryItem, UserPassword, Store],
    synchronize: true,
    logging: false
  };
}
