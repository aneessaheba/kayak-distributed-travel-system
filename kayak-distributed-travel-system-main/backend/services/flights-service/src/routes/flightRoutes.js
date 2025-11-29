const express = require('express');
const router = express.Router();
const FlightController = require('../controllers/flightController');
const upload = require('../config/upload');
const { adminOnly } = require('../middleware/authMiddleware');

// Public routes (anyone can access)
router.get('/', FlightController.getAllFlights);
router.get('/:id', FlightController.getFlightById);
router.get('/:id/availability', FlightController.checkAvailability);
router.get('/:id/reviews', FlightController.getReviews);

// User routes (booking & reviews)
router.post('/:id/book', FlightController.bookFlight);
router.post('/:id/reviews', FlightController.addReview);

// Admin only routes (CRUD)
router.post('/', adminOnly, FlightController.createFlight);
router.put('/:id', adminOnly, FlightController.updateFlight);
router.delete('/:id', adminOnly, FlightController.deleteFlight);
router.post('/:id/upload-image', adminOnly, upload.single('image'), FlightController.uploadImage);

module.exports = router;
