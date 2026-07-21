CREATE TYPE user_role AS ENUM ('ADMIN', 'CRO', 'STAFF');
CREATE TYPE delivery_status AS ENUM ('PENDING_ASSIGNMENT', 'ACTIVE', 'COMPLETED', 'CLOSED');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE back_orders (
  id SERIAL PRIMARY KEY,
  client_name VARCHAR(150) NOT NULL,
  stock_code VARCHAR(100) NOT NULL,
  stock_description VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  assigned_staff_id INTEGER REFERENCES users(id),
  eta DATE,
  status delivery_status NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE back_order_comments (
  id SERIAL PRIMARY KEY,
  back_order_id INTEGER NOT NULL REFERENCES back_orders(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_change_request BOOLEAN NOT NULL DEFAULT false,
  proposed_changes JSONB,
  status VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  back_order_id INTEGER REFERENCES back_orders(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  back_order_id INTEGER REFERENCES back_orders(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);