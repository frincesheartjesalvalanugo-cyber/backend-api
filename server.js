const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

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

app.get('/api/bookings', (req, res) => {
  console.log(bookings);
  res.json(bookings);
});

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
  console.log(newBooking);
  res.json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  const editID = bookings.findIndex((b) => b.id === id);

  if (editID === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }

  bookings[editID] = {
    ...bookings[editID],
    fullName: req.body.fullName,
    checkIn: req.body.checkIn
  };

  res.json(bookings[editID]);
  console.log(bookings[editID]);
});

app.delete('/api/bookings/:id', (req, res) => {
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