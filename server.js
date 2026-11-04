const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

app.use(express.json());
app.use(cors());

const ADMIN_AUTH_SECRET = 'casa-admin-secret-2026';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'casa_gracias',
  dateStrings: true
});

db.getConnection((err, connection) => {
  if (err) {
    console.log('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to XAMPP MySQL');
  connection.release();
});

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-auth'] !== ADMIN_AUTH_SECRET) {
    return res.status(403).json({ message: 'Admin credentials required' });
  }
  next();
}

function showList(action) {
  db.query('SELECT id, fullName FROM bookings', (err, rows) => {
    if (err) return console.log(err.message);
    console.log(`--- ${action} ---`);
    rows.forEach((b) => console.log(`${b.id}. ${b.fullName}`));
    console.log('');
  });
}

app.get('/api/bookings', requireAdmin, (req, res) => {
  db.query('SELECT * FROM bookings', (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    showList('Loaded');
    res.json(rows);
  });
});

app.post('/api/bookings', (req, res) => {
  const { fullName, checkIn } = req.body;

  db.query(
    'INSERT INTO bookings (fullName, checkIn) VALUES (?, ?)',
    [fullName, checkIn],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      showList('Added');
      res.json({ id: result.insertId, fullName, checkIn });
    }
  );
});

app.put('/api/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { fullName, checkIn } = req.body;

  db.query(
    'UPDATE bookings SET fullName = ?, checkIn = ? WHERE id = ?',
    [fullName, checkIn, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      showList('Edited');
      res.json({ id: Number(id), fullName, checkIn });
    }
  );
});

app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM bookings WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    showList('Deleted');
    res.json({ id: Number(id) });
  });
});

app.listen(8080, () => {
  console.log('Backend server running on port 8080');
});