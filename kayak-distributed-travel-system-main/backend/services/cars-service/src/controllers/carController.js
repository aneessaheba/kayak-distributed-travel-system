const Car = require('../models/carModel');
const { generateCarId, generateBookingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');
const { getCache, setCache, deleteCache, clearCachePattern } = require('../config/redis');

class CarController {

  // Create new car listing
  static async createCar(req, res) {
    try {
      const {
        car_type,
        company,
        model,
        year,
        transmission_type,
        num_seats,
        daily_rental_price,
        location,
        image_url
      } = req.body;

      // Validation
      if (!car_type || !company || !model || !year || !transmission_type || !num_seats || !daily_rental_price || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const car_id = generateCarId();

      const newCar = new Car({
        car_id,
        car_type,
        company,
        model,
        year,
        transmission_type,
        num_seats,
        daily_rental_price,
        location,
        image_url: image_url || ''
      });

      await newCar.save();

      // Clear cars list cache
      await clearCachePattern('cars:*');

      res.status(201).json({
        message: 'Car created successfully',
        car: newCar
      });

    } catch (error) {
      console.error('Error creating car:', error.message);
      res.status(500).json({ error: 'Failed to create car' });
    }
  }

  // Get all cars with filters
  static async getAllCars(req, res) {
    try {
      const {
        car_type,
        min_price,
        max_price,
        transmission_type,
        city,
        num_seats,
        page = 1,
        limit = 10
      } = req.query;

      // Build cache key
      const cacheKey = `cars:list:${JSON.stringify(req.query)}`;
      
      // Check cache
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for cars list');
        return res.json(cached);
      }

      // Build filter
      const filter = { availability_status: true };

      if (car_type) filter.car_type = car_type;
      if (transmission_type) filter.transmission_type = transmission_type;
      if (city) filter['location.city'] = { $regex: city, $options: 'i' };
      if (num_seats) filter.num_seats = { $gte: parseInt(num_seats) };
      if (min_price || max_price) {
        filter.daily_rental_price = {};
        if (min_price) filter.daily_rental_price.$gte = parseFloat(min_price);
        if (max_price) filter.daily_rental_price.$lte = parseFloat(max_price);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const cars = await Car.find(filter)
        .select('-reviews -bookings')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ car_rating: -1 });

      const total = await Car.countDocuments(filter);

      const result = {
        cars,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_cars: total
        }
      };

      // Set cache (5 minutes)
      await setCache(cacheKey, result, 300);

      res.json(result);

    } catch (error) {
      console.error('Error fetching cars:', error.message);
      res.status(500).json({ error: 'Failed to fetch cars' });
    }
  }

  // Get car by ID
  static async getCarById(req, res) {
    try {
      const { id } = req.params;

      // Check cache
      const cacheKey = `cars:${id}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for car:', id);
        return res.json(cached);
      }

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Set cache (10 minutes)
      await setCache(cacheKey, car, 600);

      res.json(car);

    } catch (error) {
      console.error('Error fetching car:', error.message);
      res.status(500).json({ error: 'Failed to fetch car' });
    }
  }

  // Update car
  static async updateCar(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Update allowed fields
      const allowedUpdates = [
        'car_type', 'company', 'model', 'year', 'transmission_type',
        'num_seats', 'daily_rental_price', 'location', 'image_url', 'availability_status'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          car[field] = updates[field];
        }
      });

      await car.save();

      // Clear cache
      await deleteCache(`cars:${id}`);
      await clearCachePattern('cars:list:*');

      res.json({
        message: 'Car updated successfully',
        car
      });

    } catch (error) {
      console.error('Error updating car:', error.message);
      res.status(500).json({ error: 'Failed to update car' });
    }
  }

  // Delete car
  static async deleteCar(req, res) {
    try {
      const { id } = req.params;

      const car = await Car.findOneAndDelete({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Clear cache
      await deleteCache(`cars:${id}`);
      await clearCachePattern('cars:list:*');

      res.json({ message: 'Car deleted successfully' });

    } catch (error) {
      console.error('Error deleting car:', error.message);
      res.status(500).json({ error: 'Failed to delete car' });
    }
  }

  // Check availability for dates
  static async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { pickup_date, return_date } = req.query;

      if (!pickup_date || !return_date) {
        return res.status(400).json({ error: 'pickup_date and return_date are required' });
      }

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      const isAvailable = car.isAvailableForDates(pickup_date, return_date);

      res.json({
        car_id: id,
        pickup_date,
        return_date,
        available: isAvailable
      });

    } catch (error) {
      console.error('Error checking availability:', error.message);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  // Book a car
  static async bookCar(req, res) {
    try {
      const { id } = req.params;
      const { user_id, pickup_date, return_date, payment_method = 'credit_card' } = req.body;

      // Validation
      if (!user_id || !pickup_date || !return_date) {
        return res.status(400).json({ error: 'user_id, pickup_date, and return_date are required' });
      }

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Check availability
      if (!car.isAvailableForDates(pickup_date, return_date)) {
        return res.status(400).json({ error: 'Car is not available for selected dates' });
      }

      // Calculate total amount
      const pickup = new Date(pickup_date);
      const returnD = new Date(return_date);
      const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
      const total_amount = days * car.daily_rental_price;

      // Generate booking ID
      const booking_id = generateBookingId();

      // Add booking to car
      car.bookings.push({
        booking_id,
        user_id,
        pickup_date: pickup,
        return_date: returnD,
        status: 'pending'
      });

      await car.save();

      // Clear cache
      await deleteCache(`cars:${id}`);
      await clearCachePattern('cars:list:*');

      // Publish to Kafka
      await publishEvent('booking.created', {
        booking_id,
        user_id,
        booking_type: 'car',
        listing_id: id,
        travel_date: pickup_date,
        return_date: return_date,
        quantity: 1,
        total_amount,
        payment_method
      });

      res.status(201).json({
        message: 'Booking created, payment processing...',
        booking: {
          booking_id,
          car_id: id,
          user_id,
          pickup_date,
          return_date,
          days,
          total_amount,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Error booking car:', error.message);
      res.status(500).json({ error: 'Failed to book car' });
    }
  }

  // Add review
  static async addReview(req, res) {
    try {
      const { id } = req.params;
      const { user_id, rating, comment } = req.body;

      if (!user_id || !rating) {
        return res.status(400).json({ error: 'user_id and rating are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Add review
      car.reviews.push({
        user_id,
        rating,
        comment: comment || ''
      });

      // Update car rating
      car.updateRating();

      await car.save();

      // Clear cache
      await deleteCache(`cars:${id}`);

      res.status(201).json({
        message: 'Review added successfully',
        car_rating: car.car_rating,
        total_reviews: car.reviews.length
      });

    } catch (error) {
      console.error('Error adding review:', error.message);
      res.status(500).json({ error: 'Failed to add review' });
    }
  }

  // Get reviews for a car
  static async getReviews(req, res) {
    try {
      const { id } = req.params;

      const car = await Car.findOne({ car_id: id }).select('car_id car_rating reviews');

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      res.json({
        car_id: car.car_id,
        car_rating: car.car_rating,
        total_reviews: car.reviews.length,
        reviews: car.reviews.sort((a, b) => b.created_at - a.created_at)
      });

    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }
  
  // Upload car image
  static async uploadImage(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const car = await Car.findOne({ car_id: id });

      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }

      // Generate image URL
      const image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Update car with image URL
      car.image_url = image_url;
      await car.save();

      // Clear cache
      await deleteCache(`cars:${id}`);
      await clearCachePattern('cars:list:*');

      res.json({
        message: 'Image uploaded successfully',
        image_url
      });

    } catch (error) {
      console.error('Error uploading image:', error.message);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }

}

module.exports = CarController;