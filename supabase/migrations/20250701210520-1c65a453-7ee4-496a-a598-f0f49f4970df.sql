
-- First, we need to drop the foreign key constraint and indexes that reference the UUID columns
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_merchant_categories_category_id;
ALTER TABLE merchant_categories DROP CONSTRAINT IF EXISTS merchant_categories_category_id_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;

-- Update the categories table
-- Create a new integer column for id
ALTER TABLE categories ADD COLUMN new_id SERIAL;

-- Create a mapping of old UUID ids to new integer ids
CREATE TEMP TABLE category_id_mapping AS
SELECT id as old_id, ROW_NUMBER() OVER (ORDER BY created_at, name) as new_id
FROM categories;

-- Update the new_id column with the mapped values
UPDATE categories 
SET new_id = mapping.new_id
FROM category_id_mapping mapping
WHERE categories.id = mapping.old_id;

-- Update parent_id references to use new integer ids
ALTER TABLE categories ADD COLUMN new_parent_id INTEGER;
UPDATE categories 
SET new_parent_id = mapping.new_id
FROM category_id_mapping mapping
WHERE categories.parent_id = mapping.old_id;

-- Drop the old UUID columns and rename new columns
ALTER TABLE categories DROP COLUMN id;
ALTER TABLE categories DROP COLUMN parent_id;
ALTER TABLE categories RENAME COLUMN new_id TO id;
ALTER TABLE categories RENAME COLUMN new_parent_id TO parent_id;

-- Set the new id as primary key
ALTER TABLE categories ADD PRIMARY KEY (id);

-- Update merchant_categories table
-- Add new integer columns
ALTER TABLE merchant_categories ADD COLUMN new_id SERIAL;
ALTER TABLE merchant_categories ADD COLUMN new_category_id INTEGER;

-- Update category_id references
UPDATE merchant_categories 
SET new_category_id = mapping.new_id
FROM category_id_mapping mapping
WHERE merchant_categories.category_id = mapping.old_id;

-- Drop old columns and rename new ones
ALTER TABLE merchant_categories DROP COLUMN id;
ALTER TABLE merchant_categories DROP COLUMN category_id;
ALTER TABLE merchant_categories RENAME COLUMN new_id TO id;
ALTER TABLE merchant_categories RENAME COLUMN new_category_id TO category_id;

-- Set primary key for merchant_categories
ALTER TABLE merchant_categories ADD PRIMARY KEY (id);

-- Re-create foreign key constraints
ALTER TABLE categories 
ADD CONSTRAINT categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE merchant_categories 
ADD CONSTRAINT merchant_categories_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Re-create indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_merchant_categories_category_id ON merchant_categories(category_id);

-- Ensure the sequences start from the correct values
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('merchant_categories_id_seq', (SELECT MAX(id) FROM merchant_categories));

-- Clean up temp table
DROP TABLE category_id_mapping;
