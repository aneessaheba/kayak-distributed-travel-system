import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  Star,
  Filter,
  SortAsc,
  ChevronDown,
  Wifi,
  Tv,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { BookingModal } from '../components/booking';
import { flightService, type FlightData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './Flights.module.css';

export const Flights = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);

  // Search form state
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState('Economy');

  // Filter state
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [stopsFilter, setStopsFilter] = useState<string[]>(['nonstop', '1stop']);

  // Fetch flights on component mount
  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await flightService.getAllFlights({
        limit: 50,
        sort_by: sortBy === 'price' ? 'ticket_price' : sortBy === 'duration' ? 'duration' : 'departure_datetime',
        sort_order: 'asc',
      });
      if (response.success) {
        setFlights(response.data);
      } else {
        setError('Failed to fetch flights');
      }
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flights');
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
        sort_by: sortBy === 'price' ? 'ticket_price' : sortBy === 'duration' ? 'duration' : 'departure_datetime',
        sort_order: 'asc',
      };

      if (fromAirport) params.departure_airport = fromAirport;
      if (toAirport) params.arrival_airport = toAirport;
      if (departureDate) params.departure_date = departureDate;
      if (flightClass) params.flight_class = flightClass;
      if (maxPrice) params.max_price = maxPrice;

      const response = await flightService.getAllFlights(params);
      if (response.success) {
        setFlights(response.data);
      } else {
        setError('No flights found');
      }
    } catch (err) {
      console.error('Error searching flights:', err);
      setError(err instanceof Error ? err.message : 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAirportCode = (airport: string) => {
    // Extract airport code if it's in format "City (CODE)" or just return first 3 chars
    const match = airport.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : airport.substring(0, 3).toUpperCase();
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi size={14} />;
      case 'entertainment':
        return <Tv size={14} />;
      case 'meals':
        return <UtensilsCrossed size={14} />;
      default:
        return null;
    }
  };

  // Get unique airlines from flights
  const uniqueAirlines = [...new Set(flights.map(f => f.airline))];

  // Filter flights based on selected filters
  const filteredFlights = flights.filter(flight => {
    if (flight.ticket_price > maxPrice) return false;
    if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.airline)) return false;
    return true;
  });

  // Sort flights
  const sortedFlights = [...filteredFlights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.ticket_price - b.ticket_price;
      case 'duration':
        return a.duration - b.duration;
      case 'departure':
        return new Date(a.departure_datetime).getTime() - new Date(b.departure_datetime).getTime();
      case 'rating':
        return b.flight_rating - a.flight_rating;
      default:
        return 0;
    }
  });

  const handleAirlineToggle = (airline: string) => {
    setSelectedAirlines(prev =>
      prev.includes(airline) ? prev.filter(a => a !== airline) : [...prev, airline]
    );
  };

  const handleBookFlight = (flight: FlightData) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSelectedFlight(flight);
    setBookingModalOpen(true);
  };

  return (
    <div className={styles.page}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>
            <Plane className={styles.titleIcon} />
            Search Flights
          </h1>

          <div className={styles.searchBox}>
            <div className={styles.tripTypes}>
              <button
                className={`${styles.tripType} ${tripType === 'roundtrip' ? styles.active : ''}`}
                onClick={() => setTripType('roundtrip')}
              >
                Round-trip
              </button>
              <button
                className={`${styles.tripType} ${tripType === 'oneway' ? styles.active : ''}`}
                onClick={() => setTripType('oneway')}
              >
                One-way
              </button>
            </div>

            <div className={styles.searchFields}>
              <div className={styles.searchField}>
                <MapPin size={18} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="From (e.g., SFO)"
                  value={fromAirport}
                  onChange={(e) => setFromAirport(e.target.value)}
                />
              </div>
              <button className={styles.swapButton} onClick={() => {
                const temp = fromAirport;
                setFromAirport(toAirport);
                setToAirport(temp);
              }}>
                <ArrowLeftRight size={18} />
              </button>
              <div className={styles.searchField}>
                <MapPin size={18} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="To (e.g., JFK)"
                  value={toAirport}
                  onChange={(e) => setToAirport(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  type="date"
                  placeholder="Departure"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              {tripType === 'roundtrip' && (
                <div className={styles.searchField}>
                  <Calendar size={18} className={styles.fieldIcon} />
                  <input
                    type="date"
                    placeholder="Return"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              )}
              <div className={styles.searchField}>
                <Users size={18} className={styles.fieldIcon} />
                <select
                  value={`${passengers} ${flightClass}`}
                  onChange={(e) => {
                    const [p, ...c] = e.target.value.split(' ');
                    setPassengers(parseInt(p));
                    setFlightClass(c.join(' '));
                  }}
                >
                  <option>1 Economy</option>
                  <option>1 Business</option>
                  <option>1 First</option>
                  <option>2 Economy</option>
                  <option>2 Business</option>
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
                  setMaxPrice(1000);
                  setSelectedAirlines([]);
                  setStopsFilter(['nonstop', '1stop']);
                }}>
                  Clear all
                </button>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Stops</h4>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={stopsFilter.includes('nonstop')}
                    onChange={() => setStopsFilter(prev =>
                      prev.includes('nonstop') ? prev.filter(s => s !== 'nonstop') : [...prev, 'nonstop']
                    )}
                  />
                  <span>Non-stop</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={stopsFilter.includes('1stop')}
                    onChange={() => setStopsFilter(prev =>
                      prev.includes('1stop') ? prev.filter(s => s !== '1stop') : [...prev, '1stop']
                    )}
                  />
                  <span>1 Stop</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={stopsFilter.includes('2+stops')}
                    onChange={() => setStopsFilter(prev =>
                      prev.includes('2+stops') ? prev.filter(s => s !== '2+stops') : [...prev, '2+stops']
                    )}
                  />
                  <span>2+ Stops</span>
                </label>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Price Range</h4>
                <div className={styles.priceRange}>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  />
                  <div className={styles.priceLabels}>
                    <span>$100</span>
                    <span>${maxPrice}</span>
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Airlines</h4>
                {uniqueAirlines.length > 0 ? (
                  uniqueAirlines.map(airline => (
                    <label key={airline} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={selectedAirlines.length === 0 || selectedAirlines.includes(airline)}
                        onChange={() => handleAirlineToggle(airline)}
                      />
                      <span>{airline}</span>
                    </label>
                  ))
                ) : (
                  <>
                    <label className={styles.filterOption}>
                      <input type="checkbox" defaultChecked />
                      <span>All Airlines</span>
                    </label>
                  </>
                )}
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Departure Time</h4>
                <label className={styles.filterOption}>
                  <input type="checkbox" defaultChecked />
                  <span>Morning (6am - 12pm)</span>
                </label>
                <label className={styles.filterOption}>
                  <input type="checkbox" defaultChecked />
                  <span>Afternoon (12pm - 6pm)</span>
                </label>
                <label className={styles.filterOption}>
                  <input type="checkbox" />
                  <span>Evening (6pm - 12am)</span>
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
                      <strong>{sortedFlights.length}</strong> flights found
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
                      <option value="price">Price (Low to High)</option>
                      <option value="duration">Duration</option>
                      <option value="departure">Departure Time</option>
                      <option value="rating">Rating</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className={styles.loadingState}>
                  <Loader2 className={styles.spinner} size={40} />
                  <p>Searching for the best flights...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className={styles.errorState}>
                  <AlertCircle size={48} />
                  <h3>Unable to load flights</h3>
                  <p>{error}</p>
                  <Button variant="primary" onClick={fetchFlights}>
                    Try Again
                  </Button>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && sortedFlights.length === 0 && (
                <div className={styles.emptyState}>
                  <Plane size={48} />
                  <h3>No flights found</h3>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}

              {/* Flight Cards */}
              {!loading && !error && sortedFlights.length > 0 && (
                <div className={styles.flightCards}>
                  {sortedFlights.map((flight, index) => (
                    <motion.div
                      key={flight._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/flights/${flight.flight_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card variant="bordered" hover className={styles.flightCard}>
                        <div className={styles.flightMain}>
                          <div className={styles.airlineInfo}>
                            <div className={styles.airlineLogo}>
                              {flight.airline.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className={styles.airlineName}>{flight.airline}</div>
                              <div className={styles.flightClass}>{flight.flight_class}</div>
                            </div>
                          </div>

                          <div className={styles.flightRoute}>
                            <div className={styles.flightTime}>
                              <div className={styles.time}>{formatTime(flight.departure_datetime)}</div>
                              <div className={styles.airport}>{getAirportCode(flight.departure_airport)}</div>
                            </div>

                            <div className={styles.flightDuration}>
                              <div className={styles.durationLine}>
                                <div className={styles.dot} />
                                <div className={styles.line} />
                                <Plane size={16} className={styles.planeIcon} />
                              </div>
                              <div className={styles.durationText}>
                                <Clock size={12} />
                                {formatDuration(flight.duration)}
                                <span className={styles.stopText}>· Non-stop</span>
                              </div>
                            </div>

                            <div className={styles.flightTime}>
                              <div className={styles.time}>{formatTime(flight.arrival_datetime)}</div>
                              <div className={styles.airport}>{getAirportCode(flight.arrival_airport)}</div>
                            </div>
                          </div>

                          <div className={styles.flightAmenities}>
                            {getAmenityIcon('wifi')}
                            {getAmenityIcon('entertainment')}
                            {flight.flight_class !== 'Economy' && getAmenityIcon('meals')}
                          </div>
                        </div>

                        <div className={styles.flightPricing}>
                          <div className={styles.rating}>
                            <Star size={14} fill="currentColor" />
                            {flight.flight_rating.toFixed(1)}
                          </div>
                          {flight.available_seats < 10 && (
                            <Badge variant="warning" size="sm">
                              {flight.available_seats} seats left
                            </Badge>
                          )}
                          <div className={styles.price}>
                            <span className={styles.priceAmount}>${flight.ticket_price}</span>
                            <span className={styles.priceLabel}>per person</span>
                          </div>
                          <Button variant="primary" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/flights/${flight.flight_id}`); }}>
                            View Details
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedFlight && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedFlight(null);
          }}
          bookingType="flight"
          listingId={selectedFlight.flight_id}
          listingName={`${selectedFlight.airline} - ${selectedFlight.departure_airport} to ${selectedFlight.arrival_airport}`}
          pricePerUnit={selectedFlight.ticket_price}
          travelDate={selectedFlight.departure_datetime.split('T')[0]}
          quantity={passengers}
          additionalInfo={{
            departure: selectedFlight.departure_airport,
            arrival: selectedFlight.arrival_airport,
          }}
        />
      )}
    </div>
  );
};
