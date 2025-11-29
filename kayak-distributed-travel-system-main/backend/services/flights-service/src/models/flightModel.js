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
  seats: { type: Number, required: true, default: 1 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now }
});

const flightSchema = new mongoose.Schema({
  flight_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  airline: { 
    type: String, 
    required: true 
  },
  departure_airport: { 
    type: String, 
    required: true 
  },
  arrival_airport: { 
    type: String, 
    required: true 
  },
  departure_datetime: { 
    type: Date, 
    required: true 
  },
  arrival_datetime: { 
    type: Date, 
    required: true 
  },
  duration: { 
    type: Number, 
    required: true  // in minutes
  },
  flight_class: { 
    type: String, 
    enum: ['Economy', 'Business', 'First'],
    default: 'Economy'
  },
  ticket_price: { 
    type: Number, 
    required: true 
  },
  total_seats: { 
    type: Number, 
    required: true 
  },
  available_seats: { 
    type: Number, 
    required: true 
  },
  flight_rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  image_url: { 
    type: String, 
    default: '' 
  },
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
flightSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Method to update rating
flightSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.flight_rating = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.flight_rating = Math.round((sum / this.reviews.length) * 10) / 10;
};

// Method to check seat availability
flightSchema.methods.hasAvailableSeats = function(requestedSeats = 1) {
  return this.available_seats >= requestedSeats;
};

// Index for faster queries
flightSchema.index({ departure_airport: 1, arrival_airport: 1 });
flightSchema.index({ departure_datetime: 1 });
flightSchema.index({ ticket_price: 1 });
flightSchema.index({ flight_class: 1 });
flightSchema.index({ airline: 1 });

module.exports = mongoose.model('Flight', flightSchema);
