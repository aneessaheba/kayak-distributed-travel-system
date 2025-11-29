// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('kayak-token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    // Handle network errors or JSON parsing errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}

// ==================== USER SERVICE API ====================

export interface UserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: UserData;
}

export interface CreateUserData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_image?: string;
}

export const userService = {
  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Create new user (register)
  async register(userData: CreateUserData): Promise<{ success: boolean; message: string; data: UserData }> {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Get user by ID
  async getUserById(userId: string): Promise<{ success: boolean; data: UserData }> {
    return apiRequest(`/users/${encodeURIComponent(userId)}`);
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<{ success: boolean; data: UserData }> {
    return apiRequest(`/users/email/${encodeURIComponent(email)}`);
  },

  // Update user
  async updateUser(userId: string, updates: UpdateUserData): Promise<{ success: boolean; message: string; data: UserData }> {
    return apiRequest(`/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete user
  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },

  // Get all users (admin)
  async getAllUsers(limit = 100, offset = 0): Promise<{ success: boolean; data: UserData[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> {
    return apiRequest(`/users?limit=${limit}&offset=${offset}`);
  },

  // Get user statistics
  async getUserStats(): Promise<{ success: boolean; data: { totalUsers: number } }> {
    return apiRequest('/users/stats');
  },
};

// ==================== REVIEWS SERVICE API ====================

export interface ReviewData {
  _id: string;
  entity_type: 'hotel' | 'flight' | 'car';
  entity_id: string;
  entity_name: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  images?: string[];
  helpful_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewData {
  entity_name: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  images?: string[];
}

export interface UpdateReviewData {
  user_id: string;
  rating?: number;
  review_text?: string;
  images?: string[];
}

export const reviewsService = {
  // Get reviews for an entity
  async getReviewsByEntity(
    entityType: 'hotel' | 'flight' | 'car',
    entityId: string,
    options?: { limit?: number; offset?: number; sort?: string }
  ): Promise<{ success: boolean; count: number; data: ReviewData[] }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sort) params.append('sort', options.sort);
    
    const queryString = params.toString();
    return apiRequest(`/reviews/${entityType}/${entityId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get review statistics for an entity
  async getReviewStats(
    entityType: 'hotel' | 'flight' | 'car',
    entityId: string
  ): Promise<{ success: boolean; data: ReviewStats }> {
    return apiRequest(`/reviews/${entityType}/${entityId}/stats`);
  },

  // Create a new review
  async createReview(
    entityType: 'hotel' | 'flight' | 'car',
    entityId: string,
    reviewData: CreateReviewData
  ): Promise<{ success: boolean; message: string; data: ReviewData }> {
    return apiRequest(`/reviews/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Check if user has reviewed an entity
  async checkUserReview(
    userId: string,
    entityType: 'hotel' | 'flight' | 'car',
    entityId: string
  ): Promise<{ success: boolean; has_reviewed: boolean; review?: ReviewData }> {
    return apiRequest(`/reviews/check?user_id=${encodeURIComponent(userId)}&entity_type=${entityType}&entity_id=${entityId}`);
  },

  // Get reviews by user
  async getUserReviews(userId: string): Promise<{ success: boolean; count: number; data: ReviewData[] }> {
    return apiRequest(`/reviews/user/${encodeURIComponent(userId)}/my-reviews`);
  },

  // Get review by ID
  async getReviewById(reviewId: string): Promise<{ success: boolean; data: ReviewData }> {
    return apiRequest(`/reviews/review/${reviewId}`);
  },

  // Update review
  async updateReview(
    reviewId: string,
    updateData: UpdateReviewData
  ): Promise<{ success: boolean; message: string; data: ReviewData }> {
    return apiRequest(`/reviews/review/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete review
  async deleteReview(reviewId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/reviews/review/${reviewId}`, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<{ success: boolean; message: string; helpful_count: number }> {
    return apiRequest(`/reviews/review/${reviewId}/helpful`, {
      method: 'POST',
    });
  },

  // Get total review count
  async getTotalReviews(): Promise<{ success: boolean; data: { total_reviews: number } }> {
    return apiRequest('/reviews/stats/total');
  },
};

// ==================== ADMIN SERVICE API ====================

export interface AdminData {
  adminId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'kayak_admin' | 'provider_admin';
  providerType?: 'flight' | 'hotel' | 'car';
  providerName?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: AdminData;
  };
}

export interface AnalyticsOverview {
  summary: {
    totalRevenue: string;
    totalBookings: number;
    year: number;
    providerType: string;
    providerName?: string;
  };
  topProperties: TopProperty[];
  cityRevenue: CityRevenue[];
  topProviders: TopProvider[];
}

export interface TopProperty {
  property_id: string;
  property_name: string;
  property_type: string;
  total_revenue: string;
  total_bookings: number;
}

export interface CityRevenue {
  city: string;
  total_revenue: string;
  total_bookings: number;
}

export interface TopProvider {
  provider_name: string;
  provider_type: string;
  total_bookings: number;
  total_revenue: string;
}

export const adminService = {
  // Admin login
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    return apiRequest<AdminLoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get admin profile
  async getProfile(): Promise<{ success: boolean; data: AdminData }> {
    return apiRequest('/admin/auth/profile');
  },

  // Logout
  async logout(): Promise<{ success: boolean; message: string }> {
    return apiRequest('/admin/auth/logout', {
      method: 'POST',
    });
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiRequest('/admin/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Get dashboard overview
  async getDashboardOverview(): Promise<{ success: boolean; data: AnalyticsOverview }> {
    return apiRequest('/admin/analytics/overview');
  },

  // Get top properties by revenue
  async getTopProperties(
    year: number,
    type: 'all' | 'flight' | 'hotel' | 'car' = 'all'
  ): Promise<{ success: boolean; data: TopProperty[]; filters: { year: number; type: string } }> {
    return apiRequest(`/admin/analytics/top-properties?year=${year}&type=${type}`);
  },

  // Get city-wise revenue
  async getCityRevenue(
    year: number,
    type: 'all' | 'flight' | 'hotel' | 'car' = 'all'
  ): Promise<{ success: boolean; data: CityRevenue[]; filters: { year: number; type: string } }> {
    return apiRequest(`/admin/analytics/city-revenue?year=${year}&type=${type}`);
  },

  // Get top providers
  async getTopProviders(
    type: 'flight' | 'hotel' | 'car'
  ): Promise<{ success: boolean; data: TopProvider[]; filters: { type: string; period: string } }> {
    return apiRequest(`/admin/analytics/top-providers?type=${type}`);
  },
};

// ==================== FLIGHT SERVICE API ====================

export interface FlightData {
  _id: string;
  flight_id: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  duration: number; // in minutes
  flight_class: 'Economy' | 'Business' | 'First';
  ticket_price: number;
  total_seats: number;
  available_seats: number;
  flight_rating: number;
  image_url?: string;
  reviews?: Array<{
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  bookings?: Array<{
    booking_id: string;
    user_id: string;
    seats: number;
    status: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface FlightSearchParams {
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  flight_class?: string;
  min_price?: number;
  max_price?: number;
  airline?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BookFlightData {
  user_id: string;
  seats: number;
}

export const flightService = {
  // Get all flights with optional filters
  async getAllFlights(params?: FlightSearchParams): Promise<{ success: boolean; count: number; data: FlightData[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const response = await apiRequest<{ flights: FlightData[]; pagination: { total_flights: number } }>(`/flights${queryString ? `?${queryString}` : ''}`);
    // Transform backend response to expected format
    return {
      success: true,
      count: response.pagination?.total_flights || response.flights?.length || 0,
      data: response.flights || [],
    };
  },

  // Get flight by ID
  async getFlightById(id: string): Promise<{ success: boolean; data: FlightData }> {
    const response = await apiRequest<FlightData>(`/flights/${id}`);
    // Backend returns flight directly, wrap it in expected format
    return {
      success: true,
      data: response,
    };
  },

  // Check flight availability
  async checkAvailability(id: string, seats?: number): Promise<{ success: boolean; available: boolean; available_seats: number }> {
    const query = seats ? `?seats=${seats}` : '';
    return apiRequest(`/flights/${id}/availability${query}`);
  },

  // Get flight reviews
  async getReviews(id: string): Promise<{ success: boolean; data: FlightData['reviews'] }> {
    return apiRequest(`/flights/${id}/reviews`);
  },

  // Book a flight
  async bookFlight(id: string, bookingData: BookFlightData): Promise<{ success: boolean; message: string; booking: object }> {
    return apiRequest(`/flights/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Add review to flight
  async addReview(id: string, reviewData: { user_id: string; rating: number; comment: string }): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/flights/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Admin: Create flight
  async createFlight(flightData: Partial<FlightData>): Promise<{ success: boolean; message: string; data: FlightData }> {
    return apiRequest('/flights', {
      method: 'POST',
      body: JSON.stringify(flightData),
    });
  },

  // Admin: Update flight
  async updateFlight(id: string, flightData: Partial<FlightData>): Promise<{ success: boolean; message: string; data: FlightData }> {
    return apiRequest(`/flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flightData),
    });
  },

  // Admin: Delete flight
  async deleteFlight(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/flights/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== HOTEL SERVICE API ====================

export interface RoomTypeData {
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe' | 'Family' | 'Presidential';
  price_per_night: number;
  total_rooms: number;
  available_rooms: number;
  amenities?: string[];
}

export interface HotelData {
  _id: string;
  hotel_id: string;
  hotel_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  star_rating: number;
  room_types: RoomTypeData[];
  amenities: string[];
  hotel_rating: number;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  reviews?: Array<{
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  bookings?: Array<{
    booking_id: string;
    user_id: string;
    room_type: string;
    rooms: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface HotelSearchParams {
  city?: string;
  state?: string;
  star_rating?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string;
  check_in?: string;
  check_out?: string;
  room_type?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BookHotelData {
  user_id: string;
  room_type: string;
  rooms: number;
  check_in_date: string;
  check_out_date: string;
}

export const hotelService = {
  // Get all hotels with optional filters
  async getAllHotels(params?: HotelSearchParams): Promise<{ success: boolean; count: number; data: HotelData[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const response = await apiRequest<{ hotels: HotelData[]; pagination: { total_hotels: number } }>(`/hotels${queryString ? `?${queryString}` : ''}`);
    // Transform backend response to expected format
    return {
      success: true,
      count: response.pagination?.total_hotels || response.hotels?.length || 0,
      data: response.hotels || [],
    };
  },

  // Get hotel by ID
  async getHotelById(id: string): Promise<{ success: boolean; data: HotelData }> {
    const response = await apiRequest<HotelData>(`/hotels/${id}`);
    // Backend returns hotel directly, wrap it in expected format
    return {
      success: true,
      data: response,
    };
  },

  // Check hotel availability
  async checkAvailability(
    id: string,
    params: { room_type: string; check_in: string; check_out: string; rooms?: number }
  ): Promise<{ success: boolean; available: boolean; available_rooms: number }> {
    const queryParams = new URLSearchParams(params as Record<string, string>);
    return apiRequest(`/hotels/${id}/availability?${queryParams.toString()}`);
  },

  // Get hotel reviews
  async getReviews(id: string): Promise<{ success: boolean; data: HotelData['reviews'] }> {
    return apiRequest(`/hotels/${id}/reviews`);
  },

  // Book a hotel
  async bookHotel(id: string, bookingData: BookHotelData): Promise<{ success: boolean; message: string; booking: object }> {
    return apiRequest(`/hotels/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Add review to hotel
  async addReview(id: string, reviewData: { user_id: string; rating: number; comment: string }): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/hotels/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Admin: Create hotel
  async createHotel(hotelData: Partial<HotelData>): Promise<{ success: boolean; message: string; data: HotelData }> {
    return apiRequest('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotelData),
    });
  },

  // Admin: Update hotel
  async updateHotel(id: string, hotelData: Partial<HotelData>): Promise<{ success: boolean; message: string; data: HotelData }> {
    return apiRequest(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotelData),
    });
  },

  // Admin: Delete hotel
  async deleteHotel(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/hotels/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== CAR SERVICE API ====================

export interface CarData {
  _id: string;
  car_id: string;
  car_type: 'SUV' | 'Sedan' | 'Compact' | 'Hatchback' | 'Luxury' | 'Van' | 'Truck';
  company: string;
  model: string;
  year: number;
  transmission_type: 'Automatic' | 'Manual';
  num_seats: number;
  daily_rental_price: number;
  car_rating: number;
  availability_status: boolean;
  location: {
    city: string;
    state: string;
    zip_code: string;
  };
  image_url?: string;
  reviews?: Array<{
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
  bookings?: Array<{
    booking_id: string;
    user_id: string;
    pickup_date: string;
    return_date: string;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CarSearchParams {
  city?: string;
  state?: string;
  car_type?: string;
  transmission_type?: string;
  min_price?: number;
  max_price?: number;
  min_seats?: number;
  company?: string;
  pickup_date?: string;
  return_date?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BookCarData {
  user_id: string;
  pickup_date: string;
  return_date: string;
}

export const carService = {
  // Get all cars with optional filters
  async getAllCars(params?: CarSearchParams): Promise<{ success: boolean; count: number; data: CarData[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const response = await apiRequest<{ cars: CarData[]; pagination: { total_cars: number } }>(`/cars${queryString ? `?${queryString}` : ''}`);
    // Transform backend response to expected format
    return {
      success: true,
      count: response.pagination?.total_cars || response.cars?.length || 0,
      data: response.cars || [],
    };
  },

  // Get car by ID
  async getCarById(id: string): Promise<{ success: boolean; data: CarData }> {
    const response = await apiRequest<CarData>(`/cars/${id}`);
    // Backend returns car directly, wrap it in expected format
    return {
      success: true,
      data: response,
    };
  },

  // Check car availability
  async checkAvailability(
    id: string,
    params: { pickup_date: string; return_date: string }
  ): Promise<{ success: boolean; available: boolean }> {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/cars/${id}/availability?${queryParams.toString()}`);
  },

  // Get car reviews
  async getReviews(id: string): Promise<{ success: boolean; data: CarData['reviews'] }> {
    return apiRequest(`/cars/${id}/reviews`);
  },

  // Book a car
  async bookCar(id: string, bookingData: BookCarData): Promise<{ success: boolean; message: string; booking: object }> {
    return apiRequest(`/cars/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Add review to car
  async addReview(id: string, reviewData: { user_id: string; rating: number; comment: string }): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/cars/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Admin: Create car
  async createCar(carData: Partial<CarData>): Promise<{ success: boolean; message: string; data: CarData }> {
    return apiRequest('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },

  // Admin: Update car
  async updateCar(id: string, carData: Partial<CarData>): Promise<{ success: boolean; message: string; data: CarData }> {
    return apiRequest(`/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carData),
    });
  },

  // Admin: Delete car
  async deleteCar(id: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/cars/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== BOOKING SERVICE API ====================

export interface BookingData {
  booking_id: string;
  user_id: string;
  booking_type: 'flight' | 'hotel' | 'car';
  listing_id: string;
  travel_date: string;
  return_date?: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  special_requests?: string;
  booking_date: string;
}

export interface CreateBookingData {
  user_id: string;
  booking_type: 'flight' | 'hotel' | 'car';
  listing_id: string;
  travel_date: string;
  return_date?: string;
  quantity?: number;
  total_amount: number;
  special_requests?: string;
}

export const bookingService = {
  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<{ success: boolean; message: string; data: { booking_id: string; status: string; total_amount: number } }> {
    return apiRequest('/bookings/create', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<{ success: boolean; data: BookingData }> {
    return apiRequest(`/bookings/${bookingId}`);
  },

  // Get user's all bookings
  async getUserBookings(userId: string): Promise<{ success: boolean; count: number; data: BookingData[] }> {
    return apiRequest(`/bookings/user/${encodeURIComponent(userId)}`);
  },

  // Get user's upcoming bookings
  async getUpcomingBookings(userId: string): Promise<{ success: boolean; count: number; data: BookingData[] }> {
    return apiRequest(`/bookings/user/${encodeURIComponent(userId)}/upcoming`);
  },

  // Check if user has completed booking (for reviews)
  async hasCompletedBooking(userId: string, bookingType: 'flight' | 'hotel' | 'car', listingId: string): Promise<{ success: boolean; has_booking: boolean }> {
    return apiRequest(`/bookings/has-booking?user_id=${encodeURIComponent(userId)}&booking_type=${bookingType}&listing_id=${listingId}`);
  },

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
    });
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== BILLING/PAYMENT SERVICE API ====================

export interface BillingData {
  billing_id: string;
  user_id: string;
  booking_type: 'flight' | 'hotel' | 'car';
  booking_id: string;
  total_amount: number | string; // MySQL returns string, but we accept both
  payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe';
  transaction_status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoice_url?: string;
  transaction_date: string;
}

export interface ProcessPaymentData {
  user_id: string;
  booking_type: 'flight' | 'hotel' | 'car';
  booking_id: string;
  total_amount: number;
  payment_method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe';
}

export interface UserBillingStats {
  total_transactions: number;
  total_spent: number;
}

export interface RevenueStats {
  booking_type: string;
  total_transactions: number;
  total_revenue: number;
}

export const billingService = {
  // Process payment
  async processPayment(paymentData: ProcessPaymentData): Promise<{ success: boolean; message: string; data: { billing_id: string; transaction_status: string; amount: number } }> {
    return apiRequest('/billing/process-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Get billing by ID
  async getBillingById(billingId: string): Promise<{ success: boolean; data: BillingData }> {
    return apiRequest(`/billing/${billingId}`);
  },

  // Get user's billing history
  async getUserBillings(userId: string): Promise<{ success: boolean; count: number; data: BillingData[] }> {
    return apiRequest(`/billing/user/${encodeURIComponent(userId)}`);
  },

  // Get billing by booking ID
  async getBillingByBookingId(bookingId: string): Promise<{ success: boolean; data: BillingData }> {
    return apiRequest(`/billing/booking/${bookingId}`);
  },

  // Download invoice
  async downloadInvoice(billingId: string): Promise<{ success: boolean; message: string; data: BillingData }> {
    return apiRequest(`/billing/${billingId}/invoice`);
  },

  // Update billing status
  async updateBillingStatus(billingId: string, status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/billing/${billingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get revenue statistics (admin)
  async getRevenueStats(bookingType: 'flight' | 'hotel' | 'car'): Promise<{ success: boolean; data: RevenueStats }> {
    return apiRequest(`/billing/stats/revenue?booking_type=${bookingType}`);
  },

  // Get user spending statistics
  async getUserStats(userId: string): Promise<{ success: boolean; data: UserBillingStats }> {
    return apiRequest(`/billing/stats/user/${encodeURIComponent(userId)}`);
  },
};

// Export all services
export default {
  user: userService,
  reviews: reviewsService,
  admin: adminService,
  flight: flightService,
  hotel: hotelService,
  car: carService,
  booking: bookingService,
  billing: billingService,
};

