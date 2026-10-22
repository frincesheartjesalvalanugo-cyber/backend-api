const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const ADMIN_EMAILS = [
  "frincesheartlanugo@gmail.com",
  "francesheartjesalvalanugo@gmail.com",
  "admin@casagracias.com",
];

const ADMIN_AUTH_SECRET = "casa-admin-secret-2026";

/**
 * Middleware: Enforce Admin permission on protected backend endpoints
 */
function requireAdmin(req, res, next) {
  const adminEmail = (req.headers['x-admin-email'] || '').toLowerCase().trim();
  const adminAuth = req.headers['x-admin-auth'];
  const authHeader = req.headers['authorization'];

  const isEmailAdmin = adminEmail && ADMIN_EMAILS.includes(adminEmail);
  const isSecretAdmin = adminAuth === ADMIN_AUTH_SECRET;
  const isBearerAdmin = authHeader && (authHeader === `Bearer ${ADMIN_AUTH_SECRET}` || authHeader.startsWith('Bearer '));

  if (isEmailAdmin || isSecretAdmin || isBearerAdmin) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied. Admin permission required to access booking backend data."
  });
}

let bookings = [
  {
    id: "1",
    fullName: "Heart Jesalva",
    email: "francesheartjesalvalanugo@gmail.com",
    roomName: "Kubo Type Room",
    roomId: "kubo",
    checkIn: "2026-09-03",
    checkOut: "2026-09-07",
    guests: 3,
    totalPrice: "₱10,000",
    status: "Confirmed"
  },
  {
    id: "2",
    fullName: "Ej Von Lanugo",
    email: "ejvon@gmail.com",
    roomName: "Kubo Type Room",
    roomId: "kubo",
    checkIn: "2026-09-10",
    checkOut: "2026-09-11",
    guests: 3,
    totalPrice: "₱2,500",
    status: "Cancelled"
  }
];

// Protected: Only Admin can fetch the full booking list
app.get('/api/bookings', requireAdmin, (req, res) => {
  console.log("Admin authorized fetch:", bookings.length, "bookings");
  res.json(bookings);
});

// Public: Guests can submit booking reservations
app.post('/api/bookings', (req, res) => {
  console.log(req.body);

  const nextId = String(
    bookings.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0) + 1
  );

  const newBooking = {
    id: nextId,
    fullName: req.body.fullName,
    email: req.body.email,
    roomName: req.body.roomName,
    roomId: req.body.roomId,
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    guests: req.body.guests,
    totalPrice: req.body.totalPrice,
    status: "Pending"
  };

  bookings.push(newBooking);
  console.log("New booking created:", newBooking);
  res.json(newBooking);
});

// Protected: Only Admin can edit booking records
app.put('/api/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const editID = bookings.findIndex((b) => b.id === id);

  if (editID === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }

  bookings[editID] = {
    ...bookings[editID],
    fullName: req.body.fullName || bookings[editID].fullName,
    checkIn: req.body.checkIn || bookings[editID].checkIn
  };

  res.json(bookings[editID]);
  console.log("Updated booking:", bookings[editID]);
});

// Protected: Only Admin can delete booking records
app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const deleteIndex = bookings.findIndex((b) => b.id === id);

  if (deleteIndex === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const deleted = bookings.splice(deleteIndex, 1)[0];

  res.json(deleted);
  console.log("Deleted:", deleted);
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});