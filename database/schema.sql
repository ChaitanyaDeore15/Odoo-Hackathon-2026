-- ============================================================
--  Fleet Management System — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS fleet_db;
USE fleet_db;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(160)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  role            ENUM('manager','dispatcher','safety_officer','analyst') NOT NULL DEFAULT 'analyst',
  is_verified     TINYINT(1)    NOT NULL DEFAULT 0,
  otp             VARCHAR(6)    DEFAULT NULL,
  otp_expiry      DATETIME      DEFAULT NULL,
  reset_token_hash VARCHAR(255) DEFAULT NULL,
  token_expiry    DATETIME      DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Vehicles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(20)  NOT NULL UNIQUE,
  model         VARCHAR(100) NOT NULL,
  type          VARCHAR(60)  NOT NULL,
  max_capacity  DECIMAL(10,2) NOT NULL COMMENT 'in tonnes',
  odometer      DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        ENUM('available','on_trip','in_shop') NOT NULL DEFAULT 'available',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Drivers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  license_number  VARCHAR(60)  NOT NULL UNIQUE,
  license_expiry  DATE         NOT NULL,
  safety_score    TINYINT      NOT NULL DEFAULT 100 COMMENT '0-100',
  status          ENUM('available','on_trip','inactive') NOT NULL DEFAULT 'available',
  document_path   VARCHAR(255) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Trips ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id      INT          NOT NULL,
  driver_id       INT          NOT NULL,
  origin          VARCHAR(160) NOT NULL,
  destination     VARCHAR(160) NOT NULL,
  cargo_weight    DECIMAL(10,2) NOT NULL COMMENT 'in tonnes',
  status          ENUM('pending','dispatched','completed','cancelled') NOT NULL DEFAULT 'pending',
  start_time      DATETIME     DEFAULT NULL,
  end_time        DATETIME     DEFAULT NULL,
  attachment_path VARCHAR(255) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id)  ON DELETE RESTRICT
);

-- ── Maintenance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id   INT          NOT NULL,
  issue        VARCHAR(255) NOT NULL,
  cost         DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_date DATE         NOT NULL,
  status       ENUM('open','resolved') NOT NULL DEFAULT 'open',
  receipt_path VARCHAR(255) DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

-- ── Fuel Logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT           NOT NULL,
  liters     DECIMAL(8,2)  NOT NULL,
  cost       DECIMAL(10,2) NOT NULL,
  date       DATE          NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
);

-- ── Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          DEFAULT NULL,
  action     VARCHAR(80)  NOT NULL,
  entity     VARCHAR(60)  DEFAULT NULL,
  entity_id  INT          DEFAULT NULL,
  detail     TEXT         DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Sample seed user (manager / password: Admin@1234) ────────
INSERT INTO users (name, email, password, role, is_verified)
VALUES (
  'Fleet Admin',
  'admin@fleet.com',
  '$2a$12$KIX4vHPLQCRQZYkMnuqD4.Gk5fBH1d0p1yLpAL.FcDHbMG4rZ1Pim',
  'manager',
  1
);
