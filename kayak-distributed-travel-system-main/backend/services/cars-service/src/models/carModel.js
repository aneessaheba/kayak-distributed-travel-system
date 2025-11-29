const mongoose = require('mongoose');

// Review sub-schema
const reviewSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Booking sub-schema (for tracking booked dates)
const bookingDateSchema = new mongoose.Schema({
  booking_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  pickup_date: {
    type: Date,
    required: true
  },
  return_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  }
});

// Main Car schema
const carSchema = new mongoose.Schema({
  car_id: {
    type: String,
    required: true,
    unique: true
  },
  car_type: {
    type: String,
    required: true,
    enum: ['SUV', 'Sedan', 'Compact', 'Hatchback', 'Luxury', 'Van', 'Truck']
  },
  company: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  transmission_type: {
    type: String,
    required: true,
    enum: ['Automatic', 'Manual']
  },
  num_seats: {
    type: Number,
    required: true,
    min: 2,
    max: 15
  },
  daily_rental_price: {
    type: Number,
    required: true,
    min: 0
  },
  car_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [reviewSchema],
  bookings: [bookingDateSchema],
  availability_status: {
    type: Boolean,
    default: true
  },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true }
  },
  image_url: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update rating when review is added
carSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.car_rating = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.car_rating = Math.round((sum / this.reviews.length) * 10) / 10;
  }
};

// Check if car is available for given dates
carSchema.methods.isAvailableForDates = function(pickupDate, returnDate) {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);

  for (const booking of this.bookings) {
    if (booking.status === 'cancelled') continue;
    
    const bookedPickup = new Date(booking.pickup_date);
    const bookedReturn = new Date(booking.return_date);

    // Check for overlap
    if (pickup <= bookedReturn && returnD >= bookedPickup) {
      return false;
    }
  }
  return true;
};

// Update updated_at before saving
carSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Car = mongoose.model('Car', carSchema);

module.exports = Car;