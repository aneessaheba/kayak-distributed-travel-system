const express = require('express');
const router = express.Router();
const CarController = require('../controllers/carController');
const upload = require('../config/upload');
const { adminOnly } = require('../middleware/authMiddleware');

// Public routes (anyone can access)
router.get('/', CarController.getAllCars);
router.get('/:id', CarController.getCarById);
router.get('/:id/availability', CarController.checkAvailability);
router.get('/:id/reviews', CarController.getReviews);

// User routes (booking & reviews)
router.post('/:id/book', CarController.bookCar);
router.post('/:id/reviews', CarController.addReview);

// Admin only routes (CRUD)
router.post('/', adminOnly, CarController.createCar);
router.put('/:id', adminOnly, CarController.updateCar);
router.delete('/:id', adminOnly, CarController.deleteCar);
router.post('/:id/upload-image', adminOnly, upload.single('image'), CarController.uploadImage);

module.exports = router;