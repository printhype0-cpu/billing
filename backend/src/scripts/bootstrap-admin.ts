import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmConfig } from '../config/typeorm.config.js';
import { User } from '../entities/user.entity.js';
import { UserPassword } from '../entities/user-password.entity.js';
import { hashPassword } from '../utils/hash.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  }
  const cfg = buildTypeOrmConfig() as any;
  const ds = new DataSource(cfg);
  await ds.initialize();
  const userRepo = ds.getRepository(User);
  const passRepo = ds.getRepository(UserPassword);
  let admin = await userRepo.findOne({ where: { email } });
  if (!admin) {
    admin = userRepo.create({
      id: `admin-${Date.now()}`,
      name: 'Master Admin',
      role: 'MASTER_ADMIN',
      email,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      passwordHash: hashPassword(password)
    });
    await userRepo.save(admin);
  } else {
    admin.passwordHash = hashPassword(password);
    await userRepo.save(admin);
  }
  const existing = await passRepo.findOne({ where: { userId: admin.id } });
  if (existing) {
    existing.passwordHash = admin.passwordHash!;
    await passRepo.save(existing);
  } else {
    const rec = passRepo.create({ userId: admin.id, passwordHash: admin.passwordHash! });
    await passRepo.save(rec);
  }
  await ds.destroy();
  // eslint-disable-next-line no-console
  console.log('Admin bootstrap completed for', email);
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed', e);
  process.exit(1);
});
