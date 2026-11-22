-- Casa Gracia - database schema
-- Works on XAMPP (MySQL/MariaDB) and TiDB Cloud.
-- Import via phpMyAdmin (Import tab) or paste into the TiDB SQL Editor.

CREATE DATABASE IF NOT EXISTS casa_gracias
  DEFAULT CHARACTER SET utf8mb4;

USE casa_gracias;

-- WARNING: uncomment the next line only if you want to wipe the old bookings table.
-- DROP TABLE IF EXISTS bookings;

CREATE TABLE IF NOT EXISTS bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  receiptNo     VARCHAR(40),
  fullName      VARCHAR(150) NOT NULL,
  email         VARCHAR(150),
  roomName      VARCHAR(150),
  roomId        VARCHAR(50),
  roomUnitId    VARCHAR(50),
  unitNumber    VARCHAR(20),
  checkIn       DATE NOT NULL,
  checkOut      DATE,
  guests        INT DEFAULT 1,
  pricePerNight DECIMAL(10,2) DEFAULT 0,
  totalPrice    VARCHAR(40),
  status        VARCHAR(20) DEFAULT 'Pending',
  dateCreated   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_dates (roomUnitId, checkIn, checkOut)
) DEFAULT CHARSET=utf8mb4;