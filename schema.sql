
-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS socialboost_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE socialboost_db;

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    recoveryEmail VARCHAR(150),
    password VARCHAR(255) NOT NULL,
    points INT DEFAULT 200,
    role ENUM('user', 'admin') DEFAULT 'user',
    trustScore INT DEFAULT 90,
    favorableRatingCycle INT DEFAULT 0,
    negativeRatingCycle INT DEFAULT 0,
    lastSpinDate VARCHAR(50) DEFAULT '',
    isSuspended BOOLEAN DEFAULT FALSE,
    avatar LONGTEXT,
    linkedAccounts LONGTEXT,
    linkingDismissed BOOLEAN DEFAULT FALSE,
    ipAddress VARCHAR(50),
    countryCode VARCHAR(10) DEFAULT 'MA',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الجداول الأخرى
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50),
    platform VARCHAR(50),
    username VARCHAR(100),
    url TEXT,
    targetCount INT,
    currentCount INT DEFAULT 0,
    pointsReward INT,
    active BOOLEAN DEFAULT TRUE,
    completers LONGTEXT, 
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50),
    username VARCHAR(100),
    type ENUM('earn', 'spend', 'purchase', 'penalty', 'daily_reward', 'trust_reward') NOT NULL,
    status ENUM('pending', 'completed', 'rejected') DEFAULT 'completed',
    amount INT NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50),
    username VARCHAR(100),
    action VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
