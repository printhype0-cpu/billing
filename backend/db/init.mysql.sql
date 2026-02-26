START TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL,
  avatar TEXT,
  email VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

INSERT IGNORE INTO users (id, name, role, avatar, email) VALUES
('u1','Master Admin','MASTER_ADMIN','https://api.dicebear.com/7.x/avataaars/svg?seed=Admin','admin@techwizardry.com'),
('u2','Store Manager','STORE_MANAGER','https://api.dicebear.com/7.x/avataaars/svg?seed=Manager','manager@techwizardry.com'),
('u3','Inventory Lead','INVENTORY_LEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Inventory','inventory@techwizardry.com'),
('u4','Sales Head','SALES_HEAD','https://api.dicebear.com/7.x/avataaars/svg?seed=Sales','sales@techwizardry.com');

INSERT IGNORE INTO inventory_items (id, name, category, sku, quantityHO, quantityStore, price, vendor, reorderLevel) VALUES
('101','iPhone 15 Screen','Parts','PRT-IP15-SCR',120,20,12000,'Imported',10),
('102','Samsung S24 Battery','Parts','PRT-S24-BAT',80,15,6500,'Samsung',15);

COMMIT;
