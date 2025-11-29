const Hotel = require('../models/hotelModel');
const { generateHotelId, generateBookingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');
const { getCache, setCache, deleteCache, clearCachePattern } = require('../config/redis');

class HotelController {

  // Create new hotel listing
  static async createHotel(req, res) {
    try {
      const {
        hotel_name,
        address,
        city,
        state,
        zip_code,
        star_rating,
        room_types,
        amenities,
        images
      } = req.body;

      // Validation
      if (!hotel_name || !address || !city || !state || !zip_code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!room_types || room_types.length === 0) {
        return res.status(400).json({ error: 'At least one room type is required' });
      }

      const hotel_id = generateHotelId();

      // Process room_types to set available_rooms = total_rooms initially
      const processedRoomTypes = room_types.map(room => ({
        ...room,
        available_rooms: room.total_rooms
      }));

      const newHotel = new Hotel({
        hotel_id,
        hotel_name,
        address,
        city,
        state: state.toUpperCase(),
        zip_code,
        star_rating: star_rating || 3,
        room_types: processedRoomTypes,
        amenities: amenities || [],
        images: images || []
      });

      await newHotel.save();

      // Clear hotels list cache
      await clearCachePattern('hotels:*');

      res.status(201).json({
        message: 'Hotel created successfully',
        hotel: newHotel
      });

    } catch (error) {
      console.error('Error creating hotel:', error.message);
      res.status(500).json({ error: 'Failed to create hotel' });
    }
  }

  // Get all hotels with filters
  static async getAllHotels(req, res) {
    try {
      const {
        city,
        state,
        star_rating,
        min_price,
        max_price,
        amenities,
        room_type,
        page = 1,
        limit = 10
      } = req.query;

      // Build cache key
      const cacheKey = `hotels:list:${JSON.stringify(req.query)}`;

      // Check cache
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for hotels list');
        return res.json(cached);
      }

      // Build filter
      const filter = {};

      if (city) filter.city = { $regex: city, $options: 'i' };
      if (state) filter.state = state.toUpperCase();
      if (star_rating) filter.star_rating = { $gte: parseInt(star_rating) };
      
      if (amenities) {
        const amenityList = amenities.split(',').map(a => a.trim());
        filter.amenities = { $all: amenityList };
      }

      if (room_type) {
        filter['room_types.type'] = room_type;
      }

      if (min_price || max_price) {
        filter['room_types.price_per_night'] = {};
        if (min_price) filter['room_types.price_per_night'].$gte = parseFloat(min_price);
        if (max_price) filter['room_types.price_per_night'].$lte = parseFloat(max_price);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const hotels = await Hotel.find(filter)
        .select('-reviews -bookings')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ hotel_rating: -1, star_rating: -1 });

      const total = await Hotel.countDocuments(filter);

      const result = {
        hotels,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_hotels: total
        }
      };

      // Set cache (5 minutes)
      await setCache(cacheKey, result, 300);

      res.json(result);

    } catch (error) {
      console.error('Error fetching hotels:', error.message);
      res.status(500).json({ error: 'Failed to fetch hotels' });
    }
  }

  // Get hotel by ID
  static async getHotelById(req, res) {
    try {
      const { id } = req.params;

      // Check cache
      const cacheKey = `hotels:${id}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache hit for hotel:', id);
        return res.json(cached);
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Set cache (10 minutes)
      await setCache(cacheKey, hotel, 600);

      res.json(hotel);

    } catch (error) {
      console.error('Error fetching hotel:', error.message);
      res.status(500).json({ error: 'Failed to fetch hotel' });
    }
  }

  // Update hotel
  static async updateHotel(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Update allowed fields
      const allowedUpdates = [
        'hotel_name', 'address', 'city', 'state', 'zip_code',
        'star_rating', 'room_types', 'amenities', 'images'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'state') {
            hotel[field] = updates[field].toUpperCase();
          } else {
            hotel[field] = updates[field];
          }
        }
      });

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({
        message: 'Hotel updated successfully',
        hotel
      });

    } catch (error) {
      console.error('Error updating hotel:', error.message);
      res.status(500).json({ error: 'Failed to update hotel' });
    }
  }

  // Delete hotel
  static async deleteHotel(req, res) {
    try {
      const { id } = req.params;

      const hotel = await Hotel.findOneAndDelete({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({ message: 'Hotel deleted successfully' });

    } catch (error) {
      console.error('Error deleting hotel:', error.message);
      res.status(500).json({ error: 'Failed to delete hotel' });
    }
  }

  // Check room availability for dates
  static async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { room_type, check_in_date, check_out_date, rooms = 1 } = req.query;

      if (!room_type || !check_in_date || !check_out_date) {
        return res.status(400).json({ error: 'room_type, check_in_date, and check_out_date are required' });
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      const requestedRooms = parseInt(rooms);
      const availableRooms = hotel.getAvailableRooms(room_type, check_in_date, check_out_date);
      const isAvailable = availableRooms >= requestedRooms;

      // Get room price
      const roomInfo = hotel.room_types.find(r => r.type === room_type);

      res.json({
        hotel_id: id,
        room_type,
        check_in_date,
        check_out_date,
        requested_rooms: requestedRooms,
        available_rooms: availableRooms,
        available: isAvailable,
        price_per_night: roomInfo ? roomInfo.price_per_night : null
      });

    } catch (error) {
      console.error('Error checking availability:', error.message);
      res.status(500).json({ error: 'Failed to check availability' });
    }
  }

  // Book a hotel room
  static async bookHotel(req, res) {
    try {
      const { id } = req.params;
      const { user_id, room_type, check_in_date, check_out_date, rooms = 1, payment_method = 'credit_card' } = req.body;

      // Validation
      if (!user_id || !room_type || !check_in_date || !check_out_date) {
        return res.status(400).json({ error: 'user_id, room_type, check_in_date, and check_out_date are required' });
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      const requestedRooms = parseInt(rooms);

      // Check availability
      if (!hotel.isRoomAvailable(room_type, check_in_date, check_out_date, requestedRooms)) {
        return res.status(400).json({ error: 'Rooms not available for selected dates' });
      }

      // Get room info and calculate total
      const roomInfo = hotel.room_types.find(r => r.type === room_type);
      if (!roomInfo) {
        return res.status(400).json({ error: 'Invalid room type' });
      }

      // Calculate nights
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const total_amount = nights * roomInfo.price_per_night * requestedRooms;

      // Generate booking ID
      const booking_id = generateBookingId();

      // Add booking to hotel
      hotel.bookings.push({
        booking_id,
        user_id,
        room_type,
        rooms: requestedRooms,
        check_in_date: checkIn,
        check_out_date: checkOut,
        status: 'pending'
      });

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      // Publish to Kafka
      await publishEvent('booking.created', {
        booking_id,
        user_id,
        booking_type: 'hotel',
        listing_id: id,
        travel_date: check_in_date,
        return_date: check_out_date,
        quantity: requestedRooms,
        total_amount,
        payment_method
      });

      res.status(201).json({
        message: 'Booking created, payment processing...',
        booking: {
          booking_id,
          hotel_id: id,
          hotel_name: hotel.hotel_name,
          user_id,
          room_type,
          rooms: requestedRooms,
          check_in_date,
          check_out_date,
          nights,
          total_amount,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Error booking hotel:', error.message);
      res.status(500).json({ error: 'Failed to book hotel' });
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

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Add review
      hotel.reviews.push({
        user_id,
        rating,
        comment: comment || ''
      });

      // Update hotel rating
      hotel.updateRating();

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);

      res.status(201).json({
        message: 'Review added successfully',
        hotel_rating: hotel.hotel_rating,
        total_reviews: hotel.reviews.length
      });

    } catch (error) {
      console.error('Error adding review:', error.message);
      res.status(500).json({ error: 'Failed to add review' });
    }
  }

  // Get reviews for a hotel
  static async getReviews(req, res) {
    try {
      const { id } = req.params;

      const hotel = await Hotel.findOne({ hotel_id: id }).select('hotel_id hotel_name hotel_rating reviews');

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      res.json({
        hotel_id: hotel.hotel_id,
        hotel_name: hotel.hotel_name,
        hotel_rating: hotel.hotel_rating,
        total_reviews: hotel.reviews.length,
        reviews: hotel.reviews.sort((a, b) => b.created_at - a.created_at)
      });

    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // Upload single hotel image
  static async uploadImage(req, res) {
    try {
      const { id } = req.params;
      const { caption } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Generate image URL
      const image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      // Add image to hotel
      hotel.images.push({
        url: image_url,
        caption: caption || ''
      });

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({
        message: 'Image uploaded successfully',
        image: {
          url: image_url,
          caption: caption || ''
        },
        total_images: hotel.images.length
      });

    } catch (error) {
      console.error('Error uploading image:', error.message);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }

  // Upload multiple hotel images
  static async uploadMultipleImages(req, res) {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Process all uploaded files
      const uploadedImages = req.files.map(file => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        caption: ''
      }));

      // Add images to hotel
      hotel.images.push(...uploadedImages);

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({
        message: `${uploadedImages.length} images uploaded successfully`,
        images: uploadedImages,
        total_images: hotel.images.length
      });

    } catch (error) {
      console.error('Error uploading images:', error.message);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }

  // Add image by URL
  static async addImageUrl(req, res) {
    try {
      const { id } = req.params;
      const { url, caption } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      // Add image URL to hotel
      hotel.images.push({
        url,
        caption: caption || ''
      });

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({
        message: 'Image URL added successfully',
        image: {
          url,
          caption: caption || ''
        },
        total_images: hotel.images.length
      });

    } catch (error) {
      console.error('Error adding image URL:', error.message);
      res.status(500).json({ error: 'Failed to add image URL' });
    }
  }

  // Delete an image
  static async deleteImage(req, res) {
    try {
      const { id, imageIndex } = req.params;

      const hotel = await Hotel.findOne({ hotel_id: id });

      if (!hotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      const index = parseInt(imageIndex);
      if (index < 0 || index >= hotel.images.length) {
        return res.status(400).json({ error: 'Invalid image index' });
      }

      // Remove image
      hotel.images.splice(index, 1);

      await hotel.save();

      // Clear cache
      await deleteCache(`hotels:${id}`);
      await clearCachePattern('hotels:list:*');

      res.json({
        message: 'Image deleted successfully',
        total_images: hotel.images.length
      });

    } catch (error) {
      console.error('Error deleting image:', error.message);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }

}

module.exports = HotelController;
