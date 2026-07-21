-- Mirror of the JSON data stores (data/companies-new.json, data/sourced.json)
-- plus an admins table for DB-backed sign-in.
--
-- The JSON files remain the source of truth for reads. These tables are kept
-- in sync on every write (server/store.js) so the data is queryable with SQL
-- and the app is ready to switch its reads over to MySQL later.
--
-- Run once with: node server/scripts/migrate-db.js

CREATE TABLE IF NOT EXISTS companies (
  id                 VARCHAR(191) PRIMARY KEY,
  company            VARCHAR(255) NOT NULL,
  website            VARCHAR(500) NOT NULL,
  city               VARCHAR(255) NOT NULL DEFAULT '',
  country            VARCHAR(255) NOT NULL DEFAULT '',
  industry           VARCHAR(255) NOT NULL DEFAULT '',
  description        TEXT,
  address            VARCHAR(500) NOT NULL DEFAULT '',
  maps_url           VARCHAR(500) NOT NULL DEFAULT '',
  search_query       VARCHAR(255) NOT NULL DEFAULT '',
  languages          VARCHAR(255) NOT NULL DEFAULT '',
  status             VARCHAR(32)  NOT NULL DEFAULT 'new',
  rating             INT          NOT NULL DEFAULT 0,
  notes              TEXT,
  tech_stack_notes   TEXT,
  project_url        VARCHAR(500) NOT NULL DEFAULT '',
  github_url         VARCHAR(500) NOT NULL DEFAULT '',
  contact_name       VARCHAR(255) NOT NULL DEFAULT '',
  contact_email      VARCHAR(255) NOT NULL DEFAULT '',
  contact_phone      VARCHAR(64)  NOT NULL DEFAULT '',
  contact_linked_in  VARCHAR(500) NOT NULL DEFAULT '',
  has_job_posting    TINYINT(1)   NOT NULL DEFAULT 0,
  job_url            VARCHAR(500) NOT NULL DEFAULT '',
  screenshot_url     VARCHAR(500) NOT NULL DEFAULT '',
  screenshot_updated_at VARCHAR(32) NOT NULL DEFAULT '',
  -- stored as the same ISO-8601 string used in JSON, not DATETIME, so this
  -- table is always a byte-for-byte mirror of the JSON record.
  created_at         VARCHAR(32)  NOT NULL DEFAULT '',
  updated_at         VARCHAR(32)  NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sourced_companies (
  id                 VARCHAR(191) PRIMARY KEY,
  place_id           VARCHAR(255) NOT NULL DEFAULT '',
  company            VARCHAR(255) NOT NULL,
  website            VARCHAR(500) NOT NULL,
  city               VARCHAR(255) NOT NULL DEFAULT '',
  country            VARCHAR(255) NOT NULL DEFAULT '',
  industry           VARCHAR(255) NOT NULL DEFAULT '',
  address            VARCHAR(500) NOT NULL DEFAULT '',
  phone              VARCHAR(64)  NOT NULL DEFAULT '',
  maps_url           VARCHAR(500) NOT NULL DEFAULT '',
  search_query       VARCHAR(255) NOT NULL DEFAULT '',
  created_at         VARCHAR(32)  NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extra admins beyond the single ADMIN_USERNAME/ADMIN_PASSWORD pair in .env.
-- Login checks the .env pair first, then falls back to this table, so
-- existing single-admin setups keep working with zero configuration.
CREATE TABLE IF NOT EXISTS admins (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  username           VARCHAR(255) NOT NULL UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  created_at         VARCHAR(32)  NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
