-- MySQL is the sole source of truth for this app (data/companies-new.json and
-- data/sourced.json are frozen, unused backups -- nothing reads or writes them
-- anymore). See server/db/*.js for the CRUD functions backing each table.
--
-- Run once (or after adding a table here) with: node server/scripts/migrate-db.js

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
  -- stored as the same ISO-8601 string the app has always used in JS
  -- (new Date().toISOString()), not DATETIME, to avoid timezone/parsing
  -- surprises -- every date in this schema follows the same convention.
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

-- Append-only log of outreach letters actually sent to a company (test sends
-- to yourself are never logged here -- see server/app.js). No update/delete
-- by design: it's a history, not an editable record. Fields are a snapshot
-- of what was sent at the time, not a live join to `companies`, so the log
-- stays meaningful even if the company record later changes or is deleted.
CREATE TABLE IF NOT EXISTS sent_emails (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  company_id         VARCHAR(191) NOT NULL,
  company_name       VARCHAR(255) NOT NULL,
  to_email           VARCHAR(255) NOT NULL,
  subject            VARCHAR(500) NOT NULL,
  body               TEXT NOT NULL,
  sent_at            VARCHAR(32)  NOT NULL DEFAULT '',
  INDEX idx_company_id (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
