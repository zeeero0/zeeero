
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- إعدادات البريد الإلكتروني ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'moha.taibi@edu.umi.ac.ma',
    pass: process.env.GMAIL_PASS // يجب تعيين كلمة مرور التطبيق في .env
  }
});

// --- إعدادات قاعدة البيانات ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '', 
  database: process.env.DB_NAME || 'socialboost_db'
};

let pool = null;
let isDemoMode = false;

async function initializeDatabase() {
  try {
    pool = mysql.createPool({ ...dbConfig, waitForConnections: true, connectionLimit: 10 });
    await pool.execute('SELECT 1');
    console.log("✅ [DATABASE] Connected to MySQL!");

    // --- نظام الهجرة التلقائي (Auto-Migration) ---
    try {
      // التأكد من وجود الجداول الأساسية
      await pool.execute(`
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
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id VARCHAR(50) PRIMARY KEY,
          userId VARCHAR(50),
          platform VARCHAR(50),
          type ENUM('follow', 'like', 'comment') DEFAULT 'follow',
          username VARCHAR(100),
          url TEXT,
          targetCount INT,
          currentCount INT DEFAULT 0,
          pointsReward INT,
          active BOOLEAN DEFAULT TRUE,
          completers LONGTEXT, 
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.execute(`
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
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(50) PRIMARY KEY,
          userId VARCHAR(50),
          username VARCHAR(100),
          action VARCHAR(100),
          details TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const [columns] = await pool.execute('SHOW COLUMNS FROM users');
      const columnNames = columns.map(c => c.Field);
      
      const requiredColumns = [
        { name: 'ipAddress', definition: 'ALTER TABLE users ADD COLUMN ipAddress VARCHAR(50)' },
        { name: 'countryCode', definition: 'ALTER TABLE users ADD COLUMN countryCode VARCHAR(10) DEFAULT "MA"' },
        { name: 'linkingDismissed', definition: 'ALTER TABLE users ADD COLUMN linkingDismissed BOOLEAN DEFAULT FALSE' },
        { name: 'lastSpinDate', definition: 'ALTER TABLE users ADD COLUMN lastSpinDate VARCHAR(50) DEFAULT ""' },
        { name: 'resetCode', definition: 'ALTER TABLE users ADD COLUMN resetCode VARCHAR(10) DEFAULT NULL' },
        { name: 'totalFollowsDone', definition: 'ALTER TABLE users ADD COLUMN totalFollowsDone INT DEFAULT 0' },
        { name: 'totalFollowersReceived', definition: 'ALTER TABLE users ADD COLUMN totalFollowersReceived INT DEFAULT 0' },
        { name: 'negativeRatingsCount', definition: 'ALTER TABLE users ADD COLUMN negativeRatingsCount INT DEFAULT 0' }
      ];

      for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
          console.log(`🛠️ [MIGRATION] Missing column ${col.name}. Fixing...`);
          await pool.execute(col.definition);
        }
      }

      // Migration for campaigns table
      const [campColumns] = await pool.execute('SHOW COLUMNS FROM campaigns');
      const campColumnNames = campColumns.map(c => c.Field);
      if (!campColumnNames.includes('type')) {
        console.log(`🛠️ [MIGRATION] Missing column type in campaigns. Fixing...`);
        await pool.execute("ALTER TABLE campaigns ADD COLUMN type ENUM('follow', 'like', 'comment') DEFAULT 'follow'");
      }
      console.log("✅ [MIGRATION] Database schema is up to date.");
    } catch (migErr) {
      console.warn("⚠️ [MIGRATION] Migration check skipped or failed:", migErr.message);
    }

  } catch (err) { 
    isDemoMode = true;
    console.warn("⚠️ [DATABASE] MySQL not found or connection failed. Switching to DEMO MODE.");
  }
}
initializeDatabase();

// --- Middleware: Capture IP ---
const captureUserIp = (req, res, next) => {
  req.userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  next();
};

// --- API: Auth Forgot Password ---
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (isDemoMode) return res.status(400).json({ message: "وضع العرض: لا يمكن إرسال بريد إلكتروني." });

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "البريد الإلكتروني غير مسجل لدينا." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.execute('UPDATE users SET resetCode = ? WHERE email = ?', [code, email]);

    const mailOptions = {
      from: 'moha.taibi@edu.umi.ac.ma',
      to: email,
      subject: 'كود استعادة كلمة المرور - SocialBoost',
      html: `
        <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11d48;">SocialBoost Secure 🛡️</h2>
          <p>لقد طلبت استعادة كلمة المرور الخاصة بك.</p>
          <p>كود التحقق الخاص بك هو:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6; margin: 20px 0;">${code}</div>
          <p>إذا لم تطلب هذا الكود، يرجى تجاهل هذا البريد.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح." });
  } catch (err) {
    res.status(500).json({ message: "خطأ في إرسال البريد: " + err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (isDemoMode) return res.status(400).json({ message: "وضع العرض: لا يمكن تغيير كلمة المرور." });

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND resetCode = ?', [email, code]);
    if (users.length === 0) {
      return res.status(400).json({ message: "كود التحقق غير صحيح أو منتهي الصلاحية." });
    }

    await pool.execute('UPDATE users SET password = ?, resetCode = NULL WHERE email = ?', [newPassword, email]);
    res.json({ message: "تم تحديث كلمة المرور بنجاح ✅ يمكنك الآن تسجيل الدخول." });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر: " + err.message });
  }
});

// --- API: Users ---
app.get('/api/users', async (req, res) => {
  if (isDemoMode) return res.json([]);
  try {
    const [rows] = await pool.execute('SELECT * FROM users');
    res.json(rows.map(r => ({ 
      ...r, 
      linkedAccounts: JSON.parse(r.linkedAccounts || '[]'),
      linkingDismissed: !!r.linkingDismissed 
    })));
  } catch (err) { 
    console.error("❌ [API ERROR] /api/users (GET):", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.put('/api/users/:id', async (req, res) => {
  const u = req.body;
  try {
    if (!isDemoMode) {
      await pool.execute('UPDATE users SET username=?, points=?, avatar=?, trustScore=?, isSuspended=?, lastSpinDate=?, linkedAccounts=?, linkingDismissed=?, ipAddress=?, countryCode=?, totalFollowsDone=?, totalFollowersReceived=?, negativeRatingsCount=? WHERE id=?', 
      [
        u.username, 
        u.points, 
        u.avatar, 
        u.trustScore, 
        u.isSuspended ? 1 : 0, 
        u.lastSpinDate || '', 
        JSON.stringify(u.linkedAccounts || []),
        u.linkingDismissed ? 1 : 0,
        u.ipAddress || '',
        u.countryCode || 'MA',
        u.totalFollowsDone || 0,
        u.totalFollowersReceived || 0,
        u.negativeRatingsCount || 0,
        req.params.id
      ]);
    }
    res.json({ success: true });
  } catch (err) { 
    console.error("❌ [API ERROR] /api/users/:id (PUT):", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.put('/api/users/:id/security', async (req, res) => {
  const { id } = req.params;
  const { currentEmail, currentPassword, newEmail, newPassword } = req.body;
  
  if (isDemoMode) return res.status(400).json({ message: "وضع العرض: لا يمكن التعديل." });

  try {
    // 1. التحقق من الهوية أولاً (للأمان الإضافي في السيرفر)
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ? AND email = ? AND password = ?', [id, currentEmail, currentPassword]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "فشل التحقق من الهوية الحالية." });
    }

    // 2. تحديث البيانات
    let updates = [];
    let params = [];
    if (newEmail) {
      updates.push('email = ?');
      params.push(newEmail);
    }
    if (newPassword) {
      updates.push('password = ?');
      params.push(newPassword);
    }
    
    if (updates.length > 0) {
      let query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      params.push(id);
      
      await pool.execute(query, params);
      
      // تسجيل النشاط
      const logId = Math.random().toString(36).substr(2, 9);
      await pool.execute(
        'INSERT INTO audit_logs (id, userId, username, action, details) VALUES (?,?,?,?,?)',
        [logId, id, users[0].username, 'SECURITY_UPDATE', `Updated ${newEmail ? 'email' : ''} ${newPassword ? 'password' : ''}`]
      );

      res.json({ success: true, message: "تم تحديث البيانات الأمنية بنجاح ✅" });
    } else {
      res.json({ success: true, message: "لا توجد تغييرات لتحديثها." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "خطأ في السيرفر: " + err.message });
  }
});

// --- API: Transactions ---
app.get('/api/transactions', async (req, res) => {
  if (isDemoMode) return res.json([]);
  const { userId } = req.query;
  try {
    let query = 'SELECT * FROM transactions';
    let params = [];
    if (userId) {
      query += ' WHERE userId = ?';
      params.push(userId);
    }
    query += ' ORDER BY date DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) { 
    console.error("❌ [API ERROR] /api/transactions (GET):", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.post('/api/transactions', async (req, res) => {
  const { userId, type, amount, description, status, username } = req.body;
  try {
    if (!isDemoMode) {
      const id = Math.random().toString(36).substr(2, 9);
      await pool.execute(
        'INSERT INTO transactions (id, userId, username, type, amount, description, status) VALUES (?,?,?,?,?,?,?)',
        [id, userId, username || '', type, Number(amount), description, status || 'completed']
      );
    }
    res.json({ success: true });
  } catch (err) { 
    console.error("❌ [API ERROR] /api/transactions (POST):", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.post('/api/transactions/:id/process', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  
  if (isDemoMode) return res.json({ success: true, message: "وضع العرض: تم بنجاح." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [tRows] = await connection.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    if (tRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "العملية غير موجودة." });
    }

    const transaction = tRows[0];
    if (transaction.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ message: "العملية معالجة مسبقاً." });
    }

    if (action === 'approve') {
      await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [Number(transaction.amount), transaction.userId]);
      await connection.execute('UPDATE transactions SET status = "completed" WHERE id = ?', [id]);
      await connection.commit();
      res.status(200).json({ success: true, message: "تم شحن الرصيد بنجاح ✅" });
    } else {
      await connection.execute('UPDATE transactions SET status = "rejected" WHERE id = ?', [id]);
      await connection.commit();
      res.status(200).json({ success: true, message: "تم رفض العملية." });
    }
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: "خطأ في السيرفر: " + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// --- API: Verification Fix ---
app.post('/api/verify-profile', async (req, res) => {
  const { platform, url } = req.body;
  if (!url) return res.json({ isValid: false, message: "يرجى إدخال الرابط." });
  
  let isValid = false;
  let cleanUrl = url.split('?')[0].split('#')[0];
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
  
  const lowUrl = cleanUrl.toLowerCase();

  if (platform === 'youtube') {
    isValid = lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be');
  } else if (platform === 'instagram') {
    isValid = lowUrl.includes('instagram.com');
  } else if (platform === 'tiktok') {
    isValid = lowUrl.includes('tiktok.com');
  }

  res.json({ 
    isValid: isValid, 
    profileName: cleanUrl.split('/').filter(Boolean).pop()?.replace('@', '') || "User",
    message: isValid ? "الرابط متوافق." : "الرابط غير صحيح للمنصة المختارة."
  });
});

// --- API: Auth ---
app.post('/api/auth/verify-identity', async (req, res) => {
  const { userId, email, password } = req.body;
  if (isDemoMode) return res.status(400).json({ message: "وضع العرض: لا يمكن التحقق." });

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ? AND email = ? AND password = ?', [userId, email, password]);
    if (users.length === 0) {
      return res.json({ success: false, message: "البيانات الحالية غير صحيحة." });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر: " + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (isDemoMode) return res.status(400).json({ message: "وضع العرض: لا يمكن تسجيل الدخول." });

  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length === 0) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    }
    const user = users[0];
    if (user.isSuspended) {
      return res.status(403).json({ message: "تم تعليق حسابك. يرجى التواصل مع الإدارة." });
    }
    res.json({ 
      success: true, 
      user: { 
        ...user, 
        linkedAccounts: JSON.parse(user.linkedAccounts || '[]'),
        linkingDismissed: !!user.linkingDismissed 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر: " + err.message });
  }
});

app.post('/api/auth/register', captureUserIp, async (req, res) => {
  const u = req.body;
  console.log("📩 Tentative d'inscription pour:", u.email);
  try {
    if (!isDemoMode) {
      const userId = u.id || Math.random().toString(36).substr(2, 9);
      
      await pool.execute(
        'INSERT INTO users (id, username, email, password, points, ipAddress, countryCode, linkedAccounts) VALUES (?,?,?,?,?,?,?,?)',
        [userId, u.username, u.email, u.password, u.points || 200, req.userIp || '', 'MA', '[]']
      );

      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      const newUser = rows[0];

      console.log("✅ Inscription réussie pour:", u.email);
      return res.json({ 
        success: true, 
        user: { 
          ...newUser, 
          linkedAccounts: [],
          linkingDismissed: false 
        } 
      });
    }
    res.json({ success: true, user: { ...u, points: 200, linkedAccounts: [], linkingDismissed: false } });
  } catch (err) { 
    console.error("❌ [AUTH ERROR] Register failed:", err.message);
    res.status(500).json({ message: "خطأ في التسجيل: " + err.message }); 
  }
});

app.get('/api/campaigns', async (req, res) => {
  if (isDemoMode) return res.json([]);
  try {
    const [rows] = await pool.execute('SELECT * FROM campaigns');
    res.json(rows.map(r => ({ ...r, completers: JSON.parse(r.completers || '[]') })));
  } catch (err) { 
    console.error("❌ [API ERROR] /api/campaigns (GET):", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.post('/api/campaigns', async (req, res) => {
  const c = req.body;
  if (isDemoMode) return res.json({ success: true });
  try {
    await pool.execute(
      'INSERT INTO campaigns (id, userId, platform, type, username, url, targetCount, currentCount, pointsReward, active, completers) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [c.id, c.userId, c.platform, c.type || 'follow', c.username, c.url, Number(c.targetCount), 0, Number(c.pointsReward), 1, '[]']
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/campaigns/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { userId, username } = req.body;
  
  if (isDemoMode) return res.json({ success: true });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. الحصول على الحملة
    const [cRows] = await connection.execute('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (cRows.length === 0) throw new Error("الحملة غير موجودة.");
    const campaign = cRows[0];

    // 2. التأكد من عدم الإكمال المسبق
    const completers = JSON.parse(campaign.completers || '[]');
    if (completers.some(c => c.userId === userId)) {
      throw new Error("لقد قمت بإتمام هذه المهمة مسبقاً.");
    }

    // 3. إضافة المستخدم لقائمة المنجزين
    completers.push({ userId, username, date: new Date().toISOString(), rating: 'pending' });
    
    // 4. تحديث الحملة (زيادة العدد وإضافة المنجز)
    await connection.execute(
      'UPDATE campaigns SET currentCount = currentCount + 1, completers = ? WHERE id = ?',
      [JSON.stringify(completers), id]
    );

    // 5. تحديث نقاط المستخدم (اختياري هنا لأن App.tsx يقوم بذلك أيضاً، لكن للأمان نفعله هنا)
    // ملاحظة: App.tsx يقوم بتحديث النقاط محلياً وإرسال UPDATE للمستخدم، لذا قد يحدث تعارض
    // لكن الأفضل أن يتم كل شيء في السيرفر.
    // بما أن المستخدم طلب "Affecter les diamonds", سنقوم بذلك هنا.
    
    await connection.execute('UPDATE users SET points = points + ? WHERE id = ?', [campaign.pointsReward, userId]);

    // 6. تسجيل العملية المالية
    const transId = Math.random().toString(36).substr(2, 9);
    await connection.execute(
      'INSERT INTO transactions (id, userId, username, type, amount, description, status) VALUES (?,?,?,?,?,?,?)',
      [transId, userId, username, 'earn', campaign.pointsReward, `إكمال مهمة #${id}`, 'completed']
    );

    await connection.commit();
    res.json({ success: true, message: "مبروك! لقد ربحت الجواهر بنجاح 🔥 استمر في إتمام المهام للوصول للقمة!" });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/audit-logs', async (req, res) => {
  if (isDemoMode) return res.json([]);
  try {
    const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) { 
    console.error("❌ [API ERROR] /api/audit-logs:", err);
    res.status(500).json({ message: err.message }); 
  }
});

app.post('/api/audit-logs', async (req, res) => {
  const { userId, username, action, details } = req.body;
  try {
    if (!isDemoMode) {
      const id = Math.random().toString(36).substr(2, 9);
      await pool.execute(
        'INSERT INTO audit_logs (id, userId, username, action, details) VALUES (?,?,?,?,?)',
        [id, userId, username || '', action, details || '']
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- API: Rating System ---
app.post('/api/campaigns/rate', async (req, res) => {
  const { campaignId, completerId, rating } = req.body;
  if (isDemoMode) return res.json({ success: true, message: "وضع العرض: تم التقييم بنجاح." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. الحصول على الحملة
    const [cRows] = await connection.execute('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
    if (cRows.length === 0) throw new Error("الحملة غير موجودة.");
    const campaign = cRows[0];
    const completers = JSON.parse(campaign.completers || '[]');
    
    // 2. تحديث حالة المنجز في الحملة
    const completerIdx = completers.findIndex(c => c.userId === completerId);
    if (completerIdx === -1) throw new Error("المستخدم لم يكمل هذه المهمة.");
    
    if (completers[completerIdx].rating !== 'pending') {
      throw new Error("تم تقييم هذا المستخدم مسبقاً.");
    }
    
    completers[completerIdx].rating = rating;
    await connection.execute('UPDATE campaigns SET completers = ? WHERE id = ?', [JSON.stringify(completers), campaignId]);

    // 3. تحديث بيانات المستخدم المنجز (Trust Score)
    const [uRows] = await connection.execute('SELECT * FROM users WHERE id = ?', [completerId]);
    if (uRows.length === 0) throw new Error("المستخدم المنجز غير موجود.");
    const user = uRows[0];
    
    let trustScore = user.trustScore;
    let favorableCycle = user.favorableRatingCycle || 0;
    let negativeCycle = user.negativeRatingCycle || 0;
    let message = rating === 'favorable' ? "تم قبول التقييم بنجاح ✅" : "تم تسجيل البلاغ بنجاح ❌";

    if (rating === 'favorable') {
      favorableCycle += 1;
      if (favorableCycle >= 3) {
        if (trustScore < 100) {
          trustScore = Math.min(100, trustScore + 1);
          message = "رائع! حصل المستخدم على 3 تقييمات إيجابية وزاد مستوى ثقته 1% 🚀";
          if (trustScore === 100) {
            message = "مذهل! وصل المستخدم لثقة 100%، يمكنه الآن تدوير عجلة المكافآت! 🎡";
          }
        }
        favorableCycle = 0; // إعادة ضبط الدورة
      }
    } else {
      negativeCycle += 1;
      if (negativeCycle >= 3) {
        trustScore = Math.max(0, trustScore - 5);
        message = "تم تسجيل 3 بلاغات سلبية، انخفض مستوى ثقة المستخدم بنسبة 5% ⚠️";
        negativeCycle = 0; // إعادة ضبط الدورة
      }
    }

    await connection.execute(
      'UPDATE users SET trustScore = ?, favorableRatingCycle = ?, negativeRatingCycle = ? WHERE id = ?',
      [trustScore, favorableCycle, negativeCycle, completerId]
    );

    // 4. تسجيل في سجل الرقابة
    const logId = Math.random().toString(36).substr(2, 9);
    await connection.execute(
      'INSERT INTO audit_logs (id, userId, username, action, details) VALUES (?,?,?,?,?)',
      [logId, completerId, user.username, 'rating_received', `Received ${rating} rating. New Trust: ${trustScore}%`]
    );

    await connection.commit();
    res.json({ success: true, message, trustScore });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    if (connection) connection.release();
  }
});

// --- SERVING STATIC FILES (PRODUCTION) ---
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: return index.html for any unknown routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: "API route not found" });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 SocialBoost Core running on port ${PORT}`));
