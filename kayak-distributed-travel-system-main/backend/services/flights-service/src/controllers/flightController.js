const Flight = require('../models/flightModel');
const { generateFlightId, generateBookingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');
const { getCache, setCache, deleteCache, clearCachePattern } = require('../config/redis');

class FlightController {

  // Create new flight listing
  static async createFlight(req, res) {
    try {
      const {
        flight_id,
        airline,
        departure_airport,
        arrival_airport,
        departure_datetime,
        arrival_datetime,
        duration,
        flight_class,
        ticket_price,
        total_seats,
        image_url
      } = req.body;

      // Validation
      if (!airline || !departure_airport || !arrival_airport || !departure_datetime || 
          !arrival_datetime || !duration || !ticket_price || !total_seats) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Use provided flight_id or generate one
      const finalFlightId = flight_id || generateFlightId(airline);

      // Check if flight_id already exists
      const existingFlight = await Flight.findOne({ flight_id: finalFlightId });
      if (existingFlight) {
        return res.status(400).json({ error: 'Flight ID already exists' });
      }

      const newFlight = new Flight({
        flight_id: finalFlightId,
        airline,
        departure_airport: departure_airport.toUpperCase(),
        arrival_airport: arrival_airport.toUpperCase(),
        departure_datetime: new Date(departure_datetime),
        arrival_datetime: new Date(arrival_datetime),
        duration,
        flight_class: flight_class || 'Economy',
        ticket_price,
        total_seats,
        available_seats: total_seats,
        image_url: image_url || ''
      });

      await newFlight.save();

      // Clear flights list cache
      await clearCachePattern('flights:*');

      res.status(201).json({
        message: 'Flight created successfully',
        flight: newFlight
      });

    } catch (error) {
      console.error('Error creating flight:', error.message);
      res.status(500).json({ error: 'Failed to create flight' });
    }
  }

  // Get all flights with filters
  static async getAllFlights(req, res) {
    try {
      const {
        airline,
        departure_airport,
        arrival_airport,
        flight_class,
        min_price,
        max_price,
        departure_date,
        page = 1,
        limit = 10
      } = req.query;

      // Build cache key
      const cacheKey = `flights:list:${JSON.stringify(req.query)}`;

      // Check cache
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for flights list');
        return res.json(cached);
      }

      // Build filter
      const filter = { available_seats: { $gt: 0 } };

      if (airline) filter.airline = { $regex: airline, $options: 'i' };
      if (departure_airport) filter.departure_airport = departure_airport.toUpperCase();
      if (arrival_airport) filter.arrival_airport = arrival_airport.toUpperCase();
      if (flight_class) filter.flight_class = flight_class;
      
      if (min_price || max_price) {
        filter.ticket_price = {};
        if (min_price) filter.ticket_price.$gte = parseFloat(min_price);
        if (max_price) filter.ticket_price.$lte = parseFloat(max_price);
      }

      if (departure_date) {
        const startDate = new Date(departure_date);
        const endDate = new Date(departure_date);
        endDate.setDate(endDate.getDate() + 1);
        filter.departure_datetime = { $gte: startDate, $lt: endDate };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const flights = await Flight.find(filter)
        .select('-reviews -bookings')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ departure_datetime: 1, ticket_price: 1 });

      const total = await Flight.countDocuments(filter);

      const result = {
        flights,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_flights: total
        }
      };

      // Set cache (5 minutes)
      await setCache(cacheKey, result, 300);

      res.json(result);

    } catch (error) {
      console.error('Error fetching flights:', error.message);
      res.status(500).json({ error: 'Failed to fetch flights' });
    }
  }

  // Get flight by ID
  static async getFlightById(req, res) {
    try {
      const { id } = req.params;

      // Check cache
      const cacheKey = `flights:${id}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for flight:', id);
        return res.json(cached);
      }

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Set cache (10 minutes)
      await setCache(cacheKey, flight, 600);

      res.json(flight);

    } catch (error) {
      console.error('Error fetching flight:', error.message);
      res.status(500).json({ error: 'Failed to fetch flight' });
    }
  }

  // Update flight
  static async updateFlight(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Update allowed fields
      const allowedUpdates = [
        'airline', 'departure_airport', 'arrival_airport', 'departure_datetime',
        'arrival_datetime', 'duration', 'flight_class', 'ticket_price',
        'total_seats', 'available_seats', 'image_url'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'departure_airport' || field === 'arrival_airport') {
            flight[field] = updates[field].toUpperCase();
          } else if (field === 'departure_datetime' || field === 'arrival_datetime') {
            flight[field] = new Date(updates[field]);
          } else {
            flight[field] = updates[field];
          }
        }
      });

      await flight.save();

      // Clear cache
      await deleteCache(`flights:${id}`);
      await clearCachePattern('flights:list:*');

      res.json({
        message: 'Flight updated successfully',
        flight
      });

    } catch (error) {
      console.error('Error updating flight:', error.message);
      res.status(500).json({ error: 'Failed to update flight' });
    }
  }

  // Delete flight
  static async deleteFlight(req, res) {
    try {
      const { id } = req.params;

      const flight = await Flight.findOneAndDelete({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Clear cache
      await deleteCache(`flights:${id}`);
      await clearCachePattern('flights:list:*');

      res.json({ message: 'Flight deleted successfully' });

    } catch (error) {
      console.error('Error deleting flight:', error.message);
      res.status(500).json({ error: 'Failed to delete flight' });
    }
  }

  // Check seat availability
  static async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { seats = 1 } = req.query;

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      const requestedSeats = parseInt(seats);
      const isAvailable = flight.hasAvailableSeats(requestedSeats);

      res.json({
        flight_id: id,
        requested_seats: requestedSeats,
        available_seats: flight.available_seats,
        available: isAvailable
      });

    } catch (error) {
      console.error('Error checking availability:', error.message);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  // Book a flight
  static async bookFlight(req, res) {
    try {
      const { id } = req.params;
      const { user_id, seats = 1, payment_method = 'credit_card' } = req.body;

      // Validation
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      const requestedSeats = parseInt(seats);

      // Check availability
      if (!flight.hasAvailableSeats(requestedSeats)) {
        return res.status(400).json({ error: 'Not enough seats available' });
      }

      // Calculate total amount
      const total_amount = requestedSeats * flight.ticket_price;

      // Generate booking ID
      const booking_id = generateBookingId();

      // Add booking to flight
      flight.bookings.push({
        booking_id,
        user_id,
        seats: requestedSeats,
        status: 'pending'
      });

      // Reserve seats (will be confirmed after payment)
      flight.available_seats -= requestedSeats;

      await flight.save();

      // Clear cache
      await deleteCache(`flights:${id}`);
      await clearCachePattern('flights:list:*');

      // Publish to Kafka
      await publishEvent('booking.created', {
        booking_id,
        user_id,
        booking_type: 'flight',
        listing_id: id,
        travel_date: flight.departure_datetime.toISOString().split('T')[0],
        quantity: requestedSeats,
        total_amount,
        payment_method
      });

      res.status(201).json({
        message: 'Booking created, payment processing...',
        booking: {
          booking_id,
          flight_id: id,
          user_id,
          airline: flight.airline,
          departure_airport: flight.departure_airport,
          arrival_airport: flight.arrival_airport,
          departure_datetime: flight.departure_datetime,
          seats: requestedSeats,
          total_amount,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Error booking flight:', error.message);
      res.status(500).json({ error: 'Failed to book flight' });
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

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Add review
      flight.reviews.push({
        user_id,
        rating,
        comment: comment || ''
      });

      // Update flight rating
      flight.updateRating();

      await flight.save();

      // Clear cache
      await deleteCache(`flights:${id}`);

      res.status(201).json({
        message: 'Review added successfully',
        flight_rating: flight.flight_rating,
        total_reviews: flight.reviews.length
      });

    } catch (error) {
      console.error('Error adding review:', error.message);
      res.status(500).json({ error: 'Failed to add review' });
    }
  }

  // Get reviews for a flight
  static async getReviews(req, res) {
    try {
      const { id } = req.params;

      const flight = await Flight.findOne({ flight_id: id }).select('flight_id flight_rating reviews');

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      res.json({
        flight_id: flight.flight_id,
        flight_rating: flight.flight_rating,
        total_reviews: flight.reviews.length,
        reviews: flight.reviews.sort((a, b) => b.created_at - a.created_at)
      });

    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // Upload flight image
  static async uploadImage(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const flight = await Flight.findOne({ flight_id: id });

      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      // Generate image URL
      const image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Update flight with image URL
      flight.image_url = image_url;
      await flight.save();

      // Clear cache
      await deleteCache(`flights:${id}`);
      await clearCachePattern('flights:list:*');

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

module.exports = FlightController;
