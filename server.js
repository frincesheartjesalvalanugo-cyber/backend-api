const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 8080;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'casa-admin-secret-2026';

const app = express();
app.use(express.json());
app.use(cors());


const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'casa_gracias',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 5,
 
  ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
});


async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      receiptNo VARCHAR(40),
      fullName VARCHAR(150) NOT NULL,
      email VARCHAR(150),
      roomName VARCHAR(150),
      roomId VARCHAR(50),
      roomUnitId VARCHAR(50),
      unitNumber VARCHAR(20),
      checkIn DATE NOT NULL,
      checkOut DATE,
      guests INT DEFAULT 1,
      pricePerNight DECIMAL(10,2) DEFAULT 0,
      totalPrice VARCHAR(40),
      status VARCHAR(20) DEFAULT 'Pending',
      dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Database ready (bookings table OK)');
}


(async function connectWithRetry() {
  try {
    await initDb();
  } catch (err) {
    console.error('Database not ready, retrying in 10s:', err.message);
    setTimeout(connectWithRetry, 10000);
  }
})();

// ---------- Helpers ----------
function requireAdmin(req, res, next) {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  const key = req.headers['x-admin-auth'] || bearer;
  if (key !== ADMIN_SECRET) return res.status(403).json({ message: 'Admin credentials required.' });
  next();
}

// ---------- Routes ----------
app.get('/', (req, res) => res.json({ status: 'ok', service: 'casa-gracia-backend' }));

app.get('/api/bookings', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM bookings ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/bookings', async (req, res) => {
  const b = req.body || {};
  if (!b.fullName || !b.checkIn) {
    return res.status(400).json({ message: 'fullName and checkIn are required.' });
  }
  const checkOut = b.checkOut || b.checkIn;


  if (b.roomUnitId) {
    const [clash] = await db.query(
      `SELECT id FROM bookings
       WHERE roomUnitId = ? AND status <> 'Cancelled'
         AND checkIn < ? AND checkOut > ? LIMIT 1`,
      [b.roomUnitId, checkOut, b.checkIn]
    );
    if (clash.length) {
      return res.status(409).json({ message: 'This room is already reserved for the selected dates.' });
    }
  }

  const [result] = await db.query(
    `INSERT INTO bookings
      (fullName, email, roomName, roomId, roomUnitId, unitNumber, checkIn, checkOut, guests, pricePerNight, totalPrice)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [b.fullName, b.email || null, b.roomName || null, b.roomId || null, b.roomUnitId || null,
     b.unitNumber || null, b.checkIn, checkOut, Number(b.guests) || 1,
     Number(b.pricePerNight) || 0, b.totalPrice || null]
  );
  const receiptNo = `RCP-${result.insertId}`;
  await db.query('UPDATE bookings SET receiptNo = ? WHERE id = ?', [receiptNo, result.insertId]);
  res.status(201).json({ id: result.insertId, receiptNo, status: 'Pending', message: 'Booking created successfully' });
});

app.put('/api/bookings/:id', requireAdmin, async (req, res) => {
  const allowed = ['fullName', 'email', 'checkIn', 'checkOut', 'guests', 'status'];
  const fields = allowed.filter((k) => req.body[k] !== undefined);
  if (!fields.length) return res.status(400).json({ message: 'Nothing to update.' });
  await db.query(
    `UPDATE bookings SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`,
    [...fields.map((f) => req.body[f]), req.params.id]
  );
  res.json({ message: 'Booking updated successfully' });
});

app.delete('/api/bookings/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
  res.json({ message: 'Booking deleted successfully' });
});


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', detail: err.code || err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));