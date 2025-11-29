import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hotel,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Star,
  Filter,
  SortAsc,
  ChevronDown,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Heart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { BookingModal } from '../components/booking';
import { hotelService, type HotelData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './Hotels.module.css';

export const Hotels = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);

  // Search form state
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);

  // Filter state
  const [maxPrice, setMaxPrice] = useState(800);
  const [minStarRating, setMinStarRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Fetch hotels on component mount
  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await hotelService.getAllHotels({
        limit: 50,
        sort_by: sortBy === 'price-low' ? 'room_types.price_per_night' : sortBy === 'rating' ? 'hotel_rating' : 'star_rating',
        sort_order: sortBy === 'price-high' ? 'desc' : sortBy === 'rating' || sortBy === 'stars' ? 'desc' : 'asc',
      });
      if (response.success) {
        setHotels(response.data);
      } else {
        setError('Failed to fetch hotels');
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        limit: 50,
      };

      if (city) params.city = city;
      if (checkIn) params.check_in = checkIn;
      if (checkOut) params.check_out = checkOut;
      if (minStarRating > 0) params.star_rating = minStarRating;
      if (maxPrice < 800) params.max_price = maxPrice;
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities.join(',');

      const response = await hotelService.getAllHotels(params);
      if (response.success) {
        setHotels(response.data);
      } else {
        setError('No hotels found');
      }
    } catch (err) {
      console.error('Error searching hotels:', err);
      setError(err instanceof Error ? err.message : 'Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) return <Wifi size={14} />;
    if (amenityLower.includes('parking')) return <Car size={14} />;
    if (amenityLower.includes('breakfast')) return <Coffee size={14} />;
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return <Dumbbell size={14} />;
    if (amenityLower.includes('pool')) return <Waves size={14} />;
    return null;
  };

  const getLowestPrice = (hotel: HotelData) => {
    if (!hotel.room_types || hotel.room_types.length === 0) return 0;
    return Math.min(...hotel.room_types.map(r => r.price_per_night));
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Fair';
  };

  // Filter hotels
  const filteredHotels = hotels.filter(hotel => {
    const lowestPrice = getLowestPrice(hotel);
    if (lowestPrice > maxPrice) return false;
    if (minStarRating > 0 && hotel.star_rating < minStarRating) return false;
    if (selectedAmenities.length > 0) {
      const hotelAmenities = hotel.amenities.map(a => a.toLowerCase());
      const hasAllAmenities = selectedAmenities.every(selected =>
        hotelAmenities.some(a => a.includes(selected.toLowerCase()))
      );
      if (!hasAllAmenities) return false;
    }
    return true;
  });

  // Sort hotels
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return getLowestPrice(a) - getLowestPrice(b);
      case 'price-high':
        return getLowestPrice(b) - getLowestPrice(a);
      case 'rating':
        return b.hotel_rating - a.hotel_rating;
      case 'stars':
        return b.star_rating - a.star_rating;
      default:
        return b.hotel_rating - a.hotel_rating; // recommended = by rating
    }
  });

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleBookHotel = (hotel: HotelData) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSelectedHotel(hotel);
    setBookingModalOpen(true);
  };

  return (
    <div className={styles.page}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>
            <Hotel className={styles.titleIcon} />
            Search Hotels
          </h1>

          <div className={styles.searchBox}>
            <div className={styles.searchFields}>
              <div className={styles.searchField}>
                <MapPin size={18} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="Where are you going?"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  type="date"
                  placeholder="Check-in"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  type="date"
                  placeholder="Check-out"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Users size={18} className={styles.fieldIcon} />
                <select
                  value={`${guests} Adults, ${rooms} Room`}
                  onChange={(e) => {
                    const match = e.target.value.match(/(\d+) Adults?, (\d+) Room/);
                    if (match) {
                      setGuests(parseInt(match[1]));
                      setRooms(parseInt(match[2]));
                    }
                  }}
                >
                  <option>1 Adult, 1 Room</option>
                  <option>2 Adults, 1 Room</option>
                  <option>2 Adults, 2 Rooms</option>
                  <option>3 Adults, 1 Room</option>
                  <option>4 Adults, 2 Rooms</option>
                </select>
              </div>
              <Button variant="primary" rightIcon={<ArrowRight size={18} />} onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className={styles.resultsSection}>
        <div className={styles.container}>
          <div className={styles.resultsLayout}>
            {/* Filters Sidebar */}
            <aside className={`${styles.filtersSidebar} ${showFilters ? styles.showFilters : ''}`}>
              <div className={styles.filtersHeader}>
                <h3>Filters</h3>
                <button className={styles.clearFilters} onClick={() => {
                  setMaxPrice(800);
                  setMinStarRating(0);
                  setSelectedAmenities([]);
                }}>
                  Clear all
                </button>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Price per night</h4>
                <div className={styles.priceRange}>
                  <input
                    type="range"
                    min="50"
                    max="800"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  />
                  <div className={styles.priceLabels}>
                    <span>$50</span>
                    <span>${maxPrice}+</span>
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Star Rating</h4>
                <div className={styles.starFilters}>
                  {[5, 4, 3, 2].map((stars) => (
                    <label key={stars} className={styles.starOption}>
                      <input
                        type="checkbox"
                        checked={minStarRating === 0 || stars >= minStarRating}
                        onChange={() => setMinStarRating(minStarRating === stars ? 0 : stars)}
                      />
                      <span className={styles.stars}>
                        {Array(stars)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Amenities</h4>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes('wifi')}
                    onChange={() => handleAmenityToggle('wifi')}
                  />
                  <Wifi size={16} />
                  <span>Free WiFi</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes('parking')}
                    onChange={() => handleAmenityToggle('parking')}
                  />
                  <Car size={16} />
                  <span>Free Parking</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes('breakfast')}
                    onChange={() => handleAmenityToggle('breakfast')}
                  />
                  <Coffee size={16} />
                  <span>Breakfast Included</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes('gym')}
                    onChange={() => handleAmenityToggle('gym')}
                  />
                  <Dumbbell size={16} />
                  <span>Fitness Center</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes('pool')}
                    onChange={() => handleAmenityToggle('pool')}
                  />
                  <Waves size={16} />
                  <span>Pool</span>
                </label>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Booking Options</h4>
                <label className={styles.filterOption}>
                  <input type="checkbox" defaultChecked />
                  <span>Free Cancellation</span>
                </label>
                <label className={styles.filterOption}>
                  <input type="checkbox" />
                  <span>Pay at Property</span>
                </label>
              </div>
            </aside>

            {/* Results List */}
            <div className={styles.resultsList}>
              <div className={styles.resultsHeader}>
                <div className={styles.resultsCount}>
                  {loading ? (
                    <span>Searching...</span>
                  ) : (
                    <>
                      <strong>{sortedHotels.length}</strong> hotels found {city && `in ${city}`}
                    </>
                  )}
                </div>
                <div className={styles.resultsActions}>
                  <button
                    className={styles.filterToggle}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={18} />
                    Filters
                  </button>
                  <div className={styles.sortDropdown}>
                    <SortAsc size={18} />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="recommended">Recommended</option>
                      <option value="price-low">Price (Low to High)</option>
                      <option value="price-high">Price (High to Low)</option>
                      <option value="rating">Guest Rating</option>
                      <option value="stars">Star Rating</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className={styles.loadingState}>
                  <Loader2 className={styles.spinner} size={40} />
                  <p>Finding the best hotels for you...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className={styles.errorState}>
                  <AlertCircle size={48} />
                  <h3>Unable to load hotels</h3>
                  <p>{error}</p>
                  <Button variant="primary" onClick={fetchHotels}>
                    Try Again
                  </Button>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && sortedHotels.length === 0 && (
                <div className={styles.emptyState}>
                  <Hotel size={48} />
                  <h3>No hotels found</h3>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}

              {/* Hotel Cards */}
              {!loading && !error && sortedHotels.length > 0 && (
                <div className={styles.hotelCards}>
                  {sortedHotels.map((hotel, index) => {
                    const lowestPrice = getLowestPrice(hotel);
                    const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                    const hotelImage = hotel.images && hotel.images.length > 0 ? hotel.images[0].url : defaultImage;

                    return (
                      <motion.div
                        key={hotel._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/hotels/${hotel.hotel_id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card variant="bordered" hover className={styles.hotelCard}>
                          <div className={styles.hotelImage}>
                            <img src={hotelImage} alt={hotel.hotel_name} />
                            <button
                              className={`${styles.favoriteBtn} ${favorites.includes(hotel._id) ? styles.favorited : ''}`}
                              onClick={() => toggleFavorite(hotel._id)}
                            >
                              <Heart
                                size={20}
                                fill={favorites.includes(hotel._id) ? 'currentColor' : 'none'}
                              />
                            </button>
                          </div>

                          <div className={styles.hotelContent}>
                            <div className={styles.hotelHeader}>
                              <div>
                                <div className={styles.starRating}>
                                  {Array(hotel.star_rating)
                                    .fill(0)
                                    .map((_, i) => (
                                      <Star key={i} size={14} fill="currentColor" />
                                    ))}
                                </div>
                                <h3 className={styles.hotelName}>{hotel.hotel_name}</h3>
                                <p className={styles.hotelLocation}>
                                  <MapPin size={14} />
                                  {hotel.address}, {hotel.city}, {hotel.state}
                                </p>
                              </div>
                              <div className={styles.userRating}>
                                <div className={styles.ratingScore}>{hotel.hotel_rating.toFixed(1)}</div>
                                <div className={styles.ratingLabel}>
                                  {getRatingLabel(hotel.hotel_rating)}
                                  <span>{hotel.reviews?.length || 0} reviews</span>
                                </div>
                              </div>
                            </div>

                            <div className={styles.hotelAmenities}>
                              {hotel.amenities.slice(0, 5).map((amenity) => (
                                <span key={amenity} className={styles.amenity}>
                                  {getAmenityIcon(amenity)}
                                  <span>{amenity}</span>
                                </span>
                              ))}
                            </div>

                            <div className={styles.hotelTags}>
                              <Badge variant="success" size="sm">
                                Free Cancellation
                              </Badge>
                              {hotel.amenities.some(a => a.toLowerCase().includes('breakfast')) && (
                                <Badge variant="info" size="sm">
                                  Breakfast Included
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className={styles.hotelPricing}>
                            <div className={styles.roomType}>
                              {hotel.room_types && hotel.room_types.length > 0
                                ? `${hotel.room_types[0].type} Room`
                                : 'Standard Room'}
                            </div>
                            <div className={styles.priceSection}>
                              <span className={styles.price}>${lowestPrice}</span>
                              <span className={styles.priceLabel}>per night</span>
                            </div>
                            <div className={styles.totalPrice}>
                              ${lowestPrice * 3} total for 3 nights
                            </div>
                            <Button variant="primary" fullWidth onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/hotels/${hotel.hotel_id}`); }}>
                              View Details
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedHotel && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedHotel(null);
          }}
          bookingType="hotel"
          listingId={selectedHotel.hotel_id}
          listingName={selectedHotel.hotel_name}
          pricePerUnit={getLowestPrice(selectedHotel)}
          travelDate={checkIn}
          returnDate={checkOut}
          quantity={rooms}
          additionalInfo={{
            checkIn: checkIn,
            checkOut: checkOut,
            roomType: selectedHotel.room_types?.[0]?.type || 'Standard',
          }}
        />
      )}
    </div>
  );
};
