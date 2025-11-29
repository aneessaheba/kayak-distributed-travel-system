const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  booking_id: { type: String, required: true },
  user_id: { type: String, required: true },
  room_type: { type: String, required: true },
  rooms: { type: Number, required: true, default: 1 },
  check_in_date: { type: Date, required: true },
  check_out_date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now }
});

const roomTypeSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Family', 'Presidential'],
    required: true 
  },
  price_per_night: { type: Number, required: true },
  total_rooms: { type: Number, required: true },
  available_rooms: { type: Number, required: true },
  amenities: [{ type: String }]
});

const hotelSchema = new mongoose.Schema({
  hotel_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  hotel_name: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    required: true 
  },
  zip_code: { 
    type: String, 
    required: true 
  },
  star_rating: { 
    type: Number, 
    min: 1, 
    max: 5,
    default: 3
  },
  room_types: [roomTypeSchema],
  amenities: [{ 
    type: String 
  }],  // Wi-Fi, Breakfast, Parking, Pool, Gym, etc.
  hotel_rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  images: [{
    url: { type: String, required: true },
    caption: { type: String, default: '' }
  }],
  reviews: [reviewSchema],
  bookings: [bookingSchema],
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Update timestamp on save
hotelSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Method to update rating
hotelSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.hotel_rating = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.hotel_rating = Math.round((sum / this.reviews.length) * 10) / 10;
};

// Method to check room availability for dates
hotelSchema.methods.isRoomAvailable = function(roomType, checkIn, checkOut, requestedRooms = 1) {
  const room = this.room_types.find(r => r.type === roomType);
  if (!room) return false;
  
  // Count overlapping bookings
  const overlappingBookings = this.bookings.filter(booking => {
    if (booking.room_type !== roomType) return false;
    if (booking.status === 'cancelled') return false;
    
    const bookingStart = new Date(booking.check_in_date);
    const bookingEnd = new Date(booking.check_out_date);
    const reqStart = new Date(checkIn);
    const reqEnd = new Date(checkOut);
    
    return reqStart < bookingEnd && reqEnd > bookingStart;
  });
  
  const bookedRooms = overlappingBookings.reduce((sum, b) => sum + b.rooms, 0);
  return (room.total_rooms - bookedRooms) >= requestedRooms;
};

// Method to get available rooms for dates
hotelSchema.methods.getAvailableRooms = function(roomType, checkIn, checkOut) {
  const room = this.room_types.find(r => r.type === roomType);
  if (!room) return 0;
  
  const overlappingBookings = this.bookings.filter(booking => {
    if (booking.room_type !== roomType) return false;
    if (booking.status === 'cancelled') return false;
    
    const bookingStart = new Date(booking.check_in_date);
    const bookingEnd = new Date(booking.check_out_date);
    const reqStart = new Date(checkIn);
    const reqEnd = new Date(checkOut);
    
    return reqStart < bookingEnd && reqEnd > bookingStart;
  });
  
  const bookedRooms = overlappingBookings.reduce((sum, b) => sum + b.rooms, 0);
  return room.total_rooms - bookedRooms;
};

// Index for faster queries
hotelSchema.index({ city: 1 });
hotelSchema.index({ state: 1 });
hotelSchema.index({ star_rating: 1 });
hotelSchema.index({ hotel_rating: -1 });
hotelSchema.index({ 'room_types.price_per_night': 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
