import mysql from 'mysql2/promise';

async function main() {
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB } = process.env as Record<string, string>;
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DB) {
    throw new Error('Missing MYSQL_HOST, MYSQL_USER or MYSQL_DB');
  }
  const port = MYSQL_PORT ? Number(MYSQL_PORT) : 3306;
  const server = await mysql.createConnection({ host: MYSQL_HOST, port, user: MYSQL_USER, password: MYSQL_PASSWORD || '' });
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\``);
  await server.end();
  const conn = await mysql.createConnection({ host: MYSQL_HOST, port, user: MYSQL_USER, password: MYSQL_PASSWORD || '', database: MYSQL_DB });
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL,
      avatar TEXT,
      email VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(128) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(128) NOT NULL,
      sku VARCHAR(128) NOT NULL,
      quantityHO INT NOT NULL,
      quantityStore INT NOT NULL,
      price INT NOT NULL,
      vendor VARCHAR(128) NOT NULL,
      reorderLevel INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await conn.query(`
    INSERT IGNORE INTO users (id, name, role, avatar, email) VALUES
    ('u1','Master Admin','MASTER_ADMIN','https://api.dicebear.com/7.x/avataaars/svg?seed=Admin','admin@techwizardry.com'),
    ('u2','Store Manager','STORE_MANAGER','https://api.dicebear.com/7.x/avataaars/svg?seed=Manager','manager@techwizardry.com'),
    ('u3','Inventory Lead','INVENTORY_LEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory','inventory@techwizardry.com'),
    ('u4','Sales Head','SALES_HEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Sales','sales@techwizardry.com');
  `);
  await conn.query(`
    INSERT IGNORE INTO inventory_items (id, name, category, sku, quantityHO, quantityStore, price, vendor, reorderLevel) VALUES
    ('101','iPhone 15 Screen','Parts','PRT-IP15-SCR',120,20,12000,'Imported',10),
    ('102','Samsung S24 Battery','Parts','PRT-S24-BAT',80,15,6500,'Samsung',15);
  `);
  await conn.end();
  // eslint-disable-next-line no-console
  console.log('MySQL database initialized');
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error('MySQL init failed', e);
  process.exit(1);
});
