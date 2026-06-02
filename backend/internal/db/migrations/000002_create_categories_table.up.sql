CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed default categories (admin seeded)
INSERT INTO categories (name, description) VALUES
    ('Electronics',         'Phones, laptops, headphones and other electronic devices'),
    ('Fashion & Accessories','Shoes, clothes, bags and accessories'),
    ('Academic Materials',  'Textbooks, notes, calculators and study materials'),
    ('Furniture & Home',    'Desks, chairs, appliances and home items'),
    ('Sports & Fitness',    'Sports equipment and fitness gear'),
    ('Others',               'Everything else');