import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  MapPin,
  Calendar,
  ArrowRight,
  Star,
  Filter,
  SortAsc,
  ChevronDown,
  Users,
  Fuel,
  Gauge,
  Snowflake,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { BookingModal } from '../components/booking';
import { carService, type CarData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './Cars.module.css';

export const Cars = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);

  // Search form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');

  // Filter state
  const [maxPrice, setMaxPrice] = useState(200);
  const [selectedCarTypes, setSelectedCarTypes] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Fetch cars on component mount
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await carService.getAllCars({
        limit: 50,
        sort_by: sortBy === 'price' ? 'daily_rental_price' : sortBy === 'rating' ? 'car_rating' : 'car_type',
        sort_order: sortBy === 'rating' ? 'desc' : 'asc',
      });
      if (response.success) {
        setCars(response.data);
      } else {
        setError('Failed to fetch cars');
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
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

      if (pickupLocation) params.city = pickupLocation;
      if (pickupDate) params.pickup_date = pickupDate;
      if (dropoffDate) params.return_date = dropoffDate;
      if (maxPrice < 200) params.max_price = maxPrice;
      if (selectedCarTypes.length === 1) params.car_type = selectedCarTypes[0];
      if (selectedTransmission.length === 1) params.transmission_type = selectedTransmission[0];

      const response = await carService.getAllCars(params);
      if (response.success) {
        setCars(response.data);
      } else {
        setError('No cars found');
      }
    } catch (err) {
      console.error('Error searching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to search cars');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!pickupDate || !dropoffDate) return 3; // Default to 3 days
    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const getCarTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SUV': 'SUV',
      'Sedan': 'Sedan',
      'Compact': 'Compact',
      'Hatchback': 'Hatchback',
      'Luxury': 'Luxury',
      'Van': 'Van',
      'Truck': 'Truck',
    };
    return labels[type] || type;
  };

  // Get unique values for filters
  const uniqueCarTypes = [...new Set(cars.map(c => c.car_type))];
  const uniqueCompanies = [...new Set(cars.map(c => c.company))];

  // Filter cars
  const filteredCars = cars.filter(car => {
    if (car.daily_rental_price > maxPrice) return false;
    if (selectedCarTypes.length > 0 && !selectedCarTypes.includes(car.car_type)) return false;
    if (selectedTransmission.length > 0 && !selectedTransmission.includes(car.transmission_type)) return false;
    if (selectedCompanies.length > 0 && !selectedCompanies.includes(car.company)) return false;
    return true;
  });

  // Sort cars
  const sortedCars = [...filteredCars].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.daily_rental_price - b.daily_rental_price;
      case 'rating':
        return b.car_rating - a.car_rating;
      case 'type':
        return a.car_type.localeCompare(b.car_type);
      default:
        return 0;
    }
  });

  const handleCarTypeToggle = (type: string) => {
    setSelectedCarTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleTransmissionToggle = (trans: string) => {
    setSelectedTransmission(prev =>
      prev.includes(trans) ? prev.filter(t => t !== trans) : [...prev, trans]
    );
  };

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const handleFuelTypeToggle = (fuel: string) => {
    setSelectedFuelTypes(prev =>
      prev.includes(fuel) ? prev.filter(f => f !== fuel) : [...prev, fuel]
    );
  };

  const handleBookCar = (car: CarData) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setSelectedCar(car);
    setBookingModalOpen(true);
  };

  const days = calculateDays();

  return (
    <div className={styles.page}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>
            <Car className={styles.titleIcon} />
            Search Rental Cars
          </h1>

          <div className={styles.searchBox}>
            <div className={styles.searchFields}>
              <div className={styles.searchField}>
                <MapPin size={18} className={styles.fieldIcon} />
                <input
                  type="text"
                  placeholder="Pick-up location (city)"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  type="date"
                  placeholder="Pick-up date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className={styles.searchField}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  type="date"
                  placeholder="Drop-off date"
                  value={dropoffDate}
                  onChange={(e) => setDropoffDate(e.target.value)}
                />
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
                  setMaxPrice(200);
                  setSelectedCarTypes([]);
                  setSelectedTransmission([]);
                  setSelectedFuelTypes([]);
                  setSelectedCompanies([]);
                }}>
                  Clear all
                </button>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Price per day</h4>
                <div className={styles.priceRange}>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  />
                  <div className={styles.priceLabels}>
                    <span>$20</span>
                    <span>${maxPrice}+</span>
                  </div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Car Type</h4>
                {['Economy', 'Compact', 'Sedan', 'SUV', 'Luxury', 'Van', 'Truck'].map(type => (
                  <label key={type} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedCarTypes.length === 0 || selectedCarTypes.includes(type)}
                      onChange={() => handleCarTypeToggle(type)}
                    />
                    <span>{type}</span>
                    <span className={styles.filterCount}>
                      {cars.filter(c => c.car_type === type).length}
                    </span>
                  </label>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Transmission</h4>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedTransmission.length === 0 || selectedTransmission.includes('Automatic')}
                    onChange={() => handleTransmissionToggle('Automatic')}
                  />
                  <span>Automatic</span>
                </label>
                <label className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedTransmission.length === 0 || selectedTransmission.includes('Manual')}
                    onChange={() => handleTransmissionToggle('Manual')}
                  />
                  <span>Manual</span>
                </label>
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Fuel Type</h4>
                {['Gasoline', 'Electric', 'Hybrid', 'Diesel'].map(fuel => (
                  <label key={fuel} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={selectedFuelTypes.length === 0 || selectedFuelTypes.includes(fuel)}
                      onChange={() => handleFuelTypeToggle(fuel)}
                    />
                    <span>{fuel}</span>
                  </label>
                ))}
              </div>

              <div className={styles.filterGroup}>
                <h4 className={styles.filterTitle}>Rental Company</h4>
                {uniqueCompanies.length > 0 ? (
                  uniqueCompanies.map(company => (
                    <label key={company} className={styles.filterOption}>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.length === 0 || selectedCompanies.includes(company)}
                        onChange={() => handleCompanyToggle(company)}
                      />
                      <span>{company}</span>
                    </label>
                  ))
                ) : (
                  ['Hertz', 'Enterprise', 'Avis', 'Budget'].map(company => (
                    <label key={company} className={styles.filterOption}>
                      <input type="checkbox" defaultChecked />
                      <span>{company}</span>
                    </label>
                  ))
                )}
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
                      <strong>{sortedCars.length}</strong> cars available
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
                      <option value="rating">Rating</option>
                      <option value="type">Car Type</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className={styles.loadingState}>
                  <Loader2 className={styles.spinner} size={40} />
                  <p>Finding the best rental cars...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className={styles.errorState}>
                  <AlertCircle size={48} />
                  <h3>Unable to load cars</h3>
                  <p>{error}</p>
                  <Button variant="primary" onClick={fetchCars}>
                    Try Again
                  </Button>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && sortedCars.length === 0 && (
                <div className={styles.emptyState}>
                  <Car size={48} />
                  <h3>No cars found</h3>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}

              {/* Car Cards */}
              {!loading && !error && sortedCars.length > 0 && (
                <div className={styles.carCards}>
                  {sortedCars.map((car, index) => {
                    const defaultImage = 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400';
                    const carImage = car.image_url || defaultImage;
                    const totalPrice = car.daily_rental_price * days;

                    return (
                      <motion.div
                        key={car._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/cars/${car.car_id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card variant="bordered" hover className={styles.carCard}>
                          <div className={styles.carImage}>
                            <img src={carImage} alt={`${car.company} ${car.model}`} />
                          </div>

                          <div className={styles.carContent}>
                            <div className={styles.carHeader}>
                              <div>
                                <div className={styles.carType}>{getCarTypeLabel(car.car_type)}</div>
                                <h3 className={styles.carName}>{car.company} {car.model}</h3>
                              </div>
                              <div className={styles.companyInfo}>
                                <div className={styles.companyLogo}>
                                  {car.company.substring(0, 1).toUpperCase()}
                                </div>
                                <span>{car.company}</span>
                              </div>
                            </div>

                            <div className={styles.carSpecs}>
                              <div className={styles.spec}>
                                <Users size={16} />
                                <span>{car.num_seats} seats</span>
                              </div>
                              <div className={styles.spec}>
                                <Gauge size={16} />
                                <span>{car.transmission_type}</span>
                              </div>
                              <div className={styles.spec}>
                                <Fuel size={16} />
                                <span>{car.year}</span>
                              </div>
                              <div className={styles.spec}>
                                <Snowflake size={16} />
                                <span>A/C</span>
                              </div>
                            </div>

                            <div className={styles.carFeatures}>
                              <span className={styles.feature}>
                                <Check size={12} />
                                GPS
                              </span>
                              <span className={styles.feature}>
                                <Check size={12} />
                                Bluetooth
                              </span>
                              <span className={styles.feature}>
                                <Check size={12} />
                                USB Charging
                              </span>
                            </div>

                            <div className={styles.carTags}>
                              <Badge variant="success" size="sm">
                                Free Cancellation
                              </Badge>
                              <Badge variant="info" size="sm">
                                Unlimited Mileage
                              </Badge>
                            </div>
                          </div>

                          <div className={styles.carPricing}>
                            <div className={styles.rating}>
                              <Star size={14} fill="currentColor" />
                              <span>{car.car_rating.toFixed(1)}</span>
                              <span className={styles.reviewCount}>
                                ({car.reviews?.length || 0})
                              </span>
                            </div>
                            <div className={styles.priceSection}>
                              <span className={styles.price}>${car.daily_rental_price}</span>
                              <span className={styles.priceLabel}>per day</span>
                            </div>
                            <div className={styles.totalPrice}>
                              ${totalPrice} total for {days} days
                            </div>
                            <Button variant="primary" fullWidth onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/cars/${car.car_id}`); }}>
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
      {selectedCar && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedCar(null);
          }}
          bookingType="car"
          listingId={selectedCar.car_id}
          listingName={`${selectedCar.company} ${selectedCar.model}`}
          pricePerUnit={selectedCar.daily_rental_price}
          travelDate={pickupDate}
          returnDate={dropoffDate}
          quantity={1}
          additionalInfo={{
            pickupLocation: pickupLocation || selectedCar.location?.city || '',
            dropoffLocation: pickupLocation || selectedCar.location?.city || '',
          }}
        />
      )}
    </div>
  );
};
