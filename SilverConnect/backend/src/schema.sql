CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ======================
-- CLEANUP
-- ======================
-- UNCOMMENT THIS IF YOU MESSED YOUR TABLES
DROP TABLE IF EXISTS elderly_activities CASCADE;
DROP TABLE IF EXISTS caregiver_activities CASCADE;
DROP TABLE IF EXISTS volunteer_activities CASCADE;
DROP TABLE IF EXISTS elderly_caregivers CASCADE;
DROP TABLE IF EXISTS caregivers CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS elderly CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS volunteer_join_requests CASCADE;
DROP TABLE IF EXISTS user_daytrip_registrations CASCADE;
-- DROP TABLE IF EXISTS community_clubs CASCADE;
-- DROP TABLE IF EXISTS hawker_centres CASCADE;
-- DROP TABLE IF EXISTS parks CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- ==================
-- BASE USERS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- enforce unique names
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ELDERLY','CAREGIVER','VOLUNTEER','ADMIN')),
  age INT,
  contact_number VARCHAR(20),
  preferred_language VARCHAR(50),
  image_url TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMP
);

-- enable pgcrypto to create bcrypt-compatible hashes inside SQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================
-- ELDERLY
-- ==================
CREATE TABLE IF NOT EXISTS elderly (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
-- ==================
-- CAREGIVERS
-- ==================
CREATE TABLE IF NOT EXISTS caregivers (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

-- Elderly ↔ Caregivers
CREATE TABLE IF NOT EXISTS elderly_caregivers (
  elderly_id INT REFERENCES users(id) ON DELETE CASCADE,
  caregiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(100),
  PRIMARY KEY (elderly_id, caregiver_id)
);

-- ==================
-- Link Requests
-- ==================
CREATE TABLE IF NOT EXISTS link_requests (
  id SERIAL PRIMARY KEY,
  caregiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  elderly_id INT REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
  created_at TIMESTAMP DEFAULT NOW()
);


-- ==================
-- COMMUNITY CLUBS
-- ==================
CREATE TABLE IF NOT EXISTS community_clubs ( 
  id SERIAL PRIMARY KEY, 
  name VARCHAR(150) NOT NULL UNIQUE, 
  address TEXT, 
  contact_number VARCHAR(50), 
  opening_hours TEXT, 
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION,
  postal_code VARCHAR(10)
);

-- Insert Sample Community Clubs (Obtained from the actual API!)
UPDATE community_clubs
SET address = '51 Bishan St. 13, Singapore',
    contact_number = '6259 4720',
    opening_hours = 'Mon–Sun: 10:00 AM – 6:00 PM',
    postal_code = '579799'
WHERE name = 'Bishan CC';

UPDATE community_clubs
SET address = '93 Toa Payoh Central, Singapore',
    contact_number = '6252 1249',
    opening_hours = 'Mon–Sun: 10:00 AM – 6:00 PM',
    postal_code = '319194'
WHERE name = 'Toa Payoh Central CC';

-- ==================
-- HAWKER CENTRES
-- ==================
CREATE TABLE IF NOT EXISTS hawker_centres ( 
  id SERIAL PRIMARY KEY, 
  name VARCHAR(150) NOT NULL UNIQUE, 
  address TEXT, 
  contact_number VARCHAR(50), 
  opening_hours TEXT, 
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION,
  postal_code VARCHAR(10)
);

-- ==================
-- PARKS
-- ==================
CREATE TABLE IF NOT EXISTS parks ( 
  id SERIAL PRIMARY KEY, 
  name VARCHAR(150) NOT NULL UNIQUE, 
  address TEXT, 
  contact_number VARCHAR(50), 
  opening_hours TEXT, 
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION,
  postal_code VARCHAR(10)
);


-- ==================
-- ACTIVITIES (with community club link)
-- ==================
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT,
  vacancies INT,
  cost DECIMAL(10,2),
  location VARCHAR(200),
  status VARCHAR(50),
  community_club_id INT REFERENCES community_clubs(id) ON DELETE SET NULL,
  image_url TEXT,
  CONSTRAINT unique_activity_per_cc UNIQUE (name, community_club_id)
);


-- Elderly ↔ Activities
CREATE TABLE IF NOT EXISTS elderly_activities (
  elderly_id INT REFERENCES users(id) ON DELETE CASCADE,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  PRIMARY KEY (elderly_id, activity_id)
);

-- Caregiver ↔ Activities (distinct from volunteers)
CREATE TABLE IF NOT EXISTS caregiver_activities (
  caregiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  activity_id  INT REFERENCES activities(id) ON DELETE CASCADE,
  PRIMARY KEY (caregiver_id, activity_id)
);

-- ==================
-- VOLUNTEERS
-- ==================
CREATE TABLE IF NOT EXISTS volunteers (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  availability TEXT[], -- allow multiple slots
  preferred_activities TEXT[],
  location_radius INT
);

-- Volunteer ↔ Activities
CREATE TABLE IF NOT EXISTS volunteer_activities (
  volunteer_id INT REFERENCES users(id) ON DELETE CASCADE,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  PRIMARY KEY (volunteer_id, activity_id)
);

-- ==================
-- Volunteer join requests
-- ==================

CREATE TABLE IF NOT EXISTS volunteer_join_requests (
  id SERIAL PRIMARY KEY,
  volunteer_id INT REFERENCES users(id) ON DELETE CASCADE,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  elderly_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(volunteer_id, activity_id, elderly_id)
);

-- ==================
-- ADMINS
-- ==================
CREATE TABLE IF NOT EXISTS admins (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pa_email VARCHAR(255) NOT NULL CHECK (pa_email LIKE '%@pa.gov.sg')
);

-- ==================
-- Day Trips
-- ==================
CREATE TABLE IF NOT EXISTS user_daytrip_registrations (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  selected_route JSONB NOT NULL,   -- now stores coordinates properly
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, activity_id)
);


-- -- ==================
-- -- Sample Data
-- -- ==================
-- -- Admin
-- INSERT INTO users (name, email, password, role, age, contact_number, preferred_language, image_url)
-- VALUES (
--   'a',
--   'a@pa.gov.sg',
--   crypt('123456', gen_salt('bf')),
--   'ADMIN',
--   35,
--   '91234567',
--   'English',
--   '/uploads/admin.jpg'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO admins (user_id, pa_email)
-- SELECT id, 'a@pa.gov.sg'
-- FROM users WHERE email = 'a@pa.gov.sg'
-- ON CONFLICT DO NOTHING;

-- -- Caregiver
-- INSERT INTO users (name, email, password, role, age, contact_number, preferred_language, image_url)
-- VALUES (
--   'c',
--   'c@example.com',
--   crypt('123456', gen_salt('bf')),
--   'CAREGIVER',
--   40,
--   '98765432',
--   'English',
--   '/uploads/caregiver.jpg'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO caregivers (user_id)
-- SELECT id FROM users WHERE email = 'c@example.com'
-- ON CONFLICT DO NOTHING;

-- -- Elderly
-- INSERT INTO users (name, email, password, role, age, contact_number, preferred_language, image_url)
-- VALUES (
--   'e',
--   'e@example.com',
--   crypt('123456', gen_salt('bf')),
--   'ELDERLY',
--   70,
--   '96543210',
--   'Mandarin',
--   '/uploads/elderly.jpg'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO elderly (user_id)
-- SELECT id FROM users WHERE email = 'e@example.com'
-- ON CONFLICT DO NOTHING;

-- -- Volunteer
-- INSERT INTO users (name, email, password, role, age, contact_number, preferred_language, image_url)
-- VALUES (
--   'v',
--   'v@example.com',
--   crypt('123456', gen_salt('bf')),
--   'VOLUNTEER',
--   25,
--   '90001234',
--   'English',
--   '/uploads/volunteer.jpg'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO volunteers (user_id, availability, preferred_activities, location_radius)
-- SELECT
--   id,
--   ARRAY['Weekends', 'Evenings'],
--   ARRAY['Reading', 'Walking'],
--   10
-- FROM users WHERE email = 'v@example.com'
-- ON CONFLICT DO NOTHING;

-- -- Link caregiver to elderly
-- INSERT INTO elderly_caregivers (elderly_id, caregiver_id, relationship)
-- SELECT
--   e.id AS elderly_id,
--   c.id AS caregiver_id,
--   'Son'
-- FROM users e, users c
-- WHERE e.email = 'e@example.com'
--   AND c.email = 'c@example.com'
-- ON CONFLICT DO NOTHING;
