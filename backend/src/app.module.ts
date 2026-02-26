import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './config/typeorm.config.js';
import { AppController } from './controllers/app.controller.js';
import { AuthController } from './controllers/auth.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { InventoryController } from './controllers/inventory.controller.js';
import { User } from './entities/user.entity.js';
import { InventoryItem } from './entities/inventory.entity.js';
import { UsersService } from './services/users.service.js';
import { InventoryService } from './services/inventory.service.js';

const typeOrmConfig = buildTypeOrmConfig();

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([User, InventoryItem])
  ],
  controllers: [AppController, AuthController, UsersController, InventoryController],
  providers: [UsersService, InventoryService]
})
export class AppModule {}
