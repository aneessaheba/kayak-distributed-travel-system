const express = require('express');
const router = express.Router();
const HotelController = require('../controllers/hotelController');
const upload = require('../config/upload');
const { adminOnly } = require('../middleware/authMiddleware');

// Public routes (anyone can access)
router.get('/', HotelController.getAllHotels);
router.get('/:id', HotelController.getHotelById);
router.get('/:id/availability', HotelController.checkAvailability);
router.get('/:id/reviews', HotelController.getReviews);

// User routes (booking & reviews)
router.post('/:id/book', HotelController.bookHotel);
router.post('/:id/reviews', HotelController.addReview);

// Admin only routes (CRUD)
router.post('/', adminOnly, HotelController.createHotel);
router.put('/:id', adminOnly, HotelController.updateHotel);
router.delete('/:id', adminOnly, HotelController.deleteHotel);

// Admin only - Image management
router.post('/:id/upload-image', adminOnly, upload.single('image'), HotelController.uploadImage);
router.post('/:id/upload-images', adminOnly, upload.array('images', 10), HotelController.uploadMultipleImages);
router.post('/:id/add-image-url', adminOnly, HotelController.addImageUrl);
router.delete('/:id/images/:imageIndex', adminOnly, HotelController.deleteImage);

module.exports = router;
