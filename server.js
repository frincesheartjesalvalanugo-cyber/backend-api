const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); //import mysql
const PORT = process.env.PORT || 8080;

const app = express();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'casa_gracias',
    dateStrings: true
})

if (db.getConnection()) {
    console.log('Database Connected');
}

app.use(express.json());
app.use(cors());

app.get('/api/bookings', async (req, res) => {
    const [bookings] = await db.query('SELECT * FROM bookings');
    res.json(bookings);
})

app.post('/api/bookings', async (req, res) => {
    await db.query('INSERT INTO bookings (fullName, checkIn) VALUES (?,?) ', [req.body.fullName, req.body.checkIn]);
    res.status(201).json({ message: 'Booking created successfully' });
})

app.delete('/api/bookings/:id', async (req, res) => {
    await db.query('DELETE FROM bookings WHERE id = ?', req.params.id);
    res.json({ message: 'Booking deleted successfully' });
})

app.put('/api/bookings/:id', async (req, res) => {
    await db.query('UPDATE bookings SET fullName = ?, checkIn = ? WHERE id = ?', [req.body.fullName, req.body.checkIn, req.params.id]);
    res.json({ message: 'Booking updated successfully' });
})

app.listen(PORT, () => {
    console.log('Server running 8080');
})