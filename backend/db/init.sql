BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NULL
);
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantityHO INTEGER NOT NULL,
  quantityStore INTEGER NOT NULL,
  price INTEGER NOT NULL,
  vendor TEXT NOT NULL,
  reorderLevel INTEGER NOT NULL
);
INSERT OR IGNORE INTO users (id, name, role, avatar, email) VALUES
('u1','Master Admin','MASTER_ADMIN','https://api.dicebear.com/7.x/avataaars/svg?seed=Admin','admin@techwizardry.com'),
('u2','Store Manager','STORE_MANAGER','https://api.dicebear.com/7.x/avataaars/svg?seed=Manager','manager@techwizardry.com'),
('u3','Inventory Lead','INVENTORY_LEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory','inventory@techwizardry.com'),
('u4','Sales Head','SALES_HEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Sales','sales@techwizardry.com');
INSERT OR IGNORE INTO inventory_items (id, name, category, sku, quantityHO, quantityStore, price, vendor, reorderLevel) VALUES
('101','iPhone 15 Screen','Parts','PRT-IP15-SCR',120,20,12000,'Imported',10),
('102','Samsung S24 Battery','Parts','PRT-S24-BAT',80,15,6500,'Samsung',15);
COMMIT;
