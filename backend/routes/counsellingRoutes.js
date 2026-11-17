const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware'); // adjust path
const { createCounselling} = require('../controller/counsellingController');
const { createBooking,getAvailability,getMyBookings,getBooking,cancelBooking } = require('../controller/bookingController');
router.post('/', authMiddleware, createCounselling);
router.post('/bookings', authMiddleware, createBooking);
router.get('/availability', authMiddleware, getAvailability);
router.get('/bookings/me', authMiddleware, getMyBookings); // keep above any /bookings/:id
router.get('/bookings/:id', authMiddleware, getBooking);
router.patch('/bookings/:id/cancel', authMiddleware, cancelBooking);
module.exports = router;