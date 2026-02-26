import path from 'path';
import fs from 'fs/promises';
import sqlite3 from 'sqlite3';

async function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const dbPath = path.join(dataDir, 'dev.sqlite');
  const sqlPath = path.join(process.cwd(), 'db', 'init.sql');
  await fs.mkdir(dataDir, { recursive: true });
  const sql = await fs.readFile(sqlPath, 'utf-8');
  await new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.exec(sql, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
      db.close();
    });
  });
  // eslint-disable-next-line no-console
  console.log('Database initialized:', dbPath);
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error('DB init failed', e);
  process.exit(1);
});
