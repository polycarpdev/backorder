INSERT INTO clients (name)
SELECT DISTINCT client_name FROM back_orders WHERE client_name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

UPDATE back_orders bo
SET client_id = c.id
FROM clients c
WHERE bo.client_name = c.name AND bo.client_id IS NULL;
