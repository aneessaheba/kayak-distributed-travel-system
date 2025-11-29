// User Types
export interface User {
  id: string; // SSN format XXX-XX-XXXX
  user_id: string; // Same as id, for backend compatibility
  firstName: string;
  first_name?: string; // Backend format
  lastName: string;
  last_name?: string; // Backend format
  email: string;
  phone: string;
  phone_number?: string; // Backend format
  address: string;
  city: string;
  state: string;
  zipCode: string;
  zip_code?: string; // Backend format
  profileImage?: string;
  profile_image?: string; // Backend format
  creditCard?: PaymentDetails;
  bookingHistory?: Booking[];
  reviews?: Review[];
  createdAt?: Date;
  created_at?: string; // Backend format
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
}

// Flight Types
export interface Flight {
  id: string;
  airline: string;
  operatorName: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: Date;
  arrivalDateTime: Date;
  duration: number; // in minutes
  flightClass: 'economy' | 'business' | 'first';
  ticketPrice: number;
  totalAvailableSeats: number;
  rating: number;
  reviews: Review[];
  stops: number;
}

// Hotel Types
export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  starRating: number;
  numberOfRooms: number;
  roomTypes: RoomType[];
  pricePerNight: number;
  amenities: string[];
  rating: number;
  reviews: Review[];
  images: string[];
}

export interface RoomType {
  type: 'single' | 'double' | 'suite' | 'deluxe';
  price: number;
  available: number;
}

// Car Types
export interface Car {
  id: string;
  carType: 'suv' | 'sedan' | 'compact' | 'luxury' | 'minivan';
  company: string;
  model: string;
  year: number;
  transmission: 'automatic' | 'manual';
  seats: number;
  dailyPrice: number;
  rating: number;
  reviews: Review[];
  available: boolean;
  image?: string;
}

// Booking Types
export interface Booking {
  id: string;
  userId: string;
  type: 'flight' | 'hotel' | 'car';
  itemId: string;
  bookingDate: Date;
  startDate: Date;
  endDate?: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

// Billing Types
export interface Billing {
  id: string;
  userId: string;
  bookingType: 'flight' | 'hotel' | 'car';
  bookingId: string;
  transactionDate: Date;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'paypal' | 'debit_card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoice?: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

// Admin Types
export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  role: 'kayak_admin' | 'provider_admin' | 'super_admin' | 'admin' | 'moderator';
  accessLevel: number;
  providerType?: 'flight' | 'hotel' | 'car';
  providerName?: string;
  profileImage?: string;
}

// Search Types
export interface FlightSearchParams {
  departureAirport: string;
  arrivalAirport: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  flightClass: 'economy' | 'business' | 'first';
  tripType: 'roundtrip' | 'oneway';
}

export interface HotelSearchParams {
  city: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
  starRating?: number;
  priceRange?: [number, number];
}

export interface CarSearchParams {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: Date;
  dropoffDate: Date;
  carType?: string;
}

// AI Agent Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: TravelBundle[];
}

export interface TravelBundle {
  id: string;
  flight?: Flight;
  hotel?: Hotel;
  car?: Car;
  totalPrice: number;
  fitScore: number;
  whyThis: string;
  whatToWatch: string;
  tags: string[];
}

export interface Deal {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  item: Flight | Hotel | Car;
  originalPrice: number;
  dealPrice: number;
  discount: number;
  expiresAt: Date;
  tags: string[];
}


