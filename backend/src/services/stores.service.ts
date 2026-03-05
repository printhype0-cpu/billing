import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity.js';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private readonly repo: Repository<Store>) {}

  findAll(): Promise<Store[]> {
    return this.repo.find();
  }

  findByName(name: string): Promise<Store | null> {
    return this.repo.findOne({ where: { name } });
  }

  async upsert(store: Store): Promise<Store> {
    await this.repo.save(store);
    return store;
  }

  async remove(id: string): Promise<boolean> {
    const r = await this.repo.delete({ id });
    return !!r.affected;
  }
}
