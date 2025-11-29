import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  ArrowLeft,
  Users,
  Gauge,
  Fuel,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  Snowflake,
  Radio,
  Usb,
  Navigation,
  Shield,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { ReviewSection } from '../components/reviews';
import { carService, bookingService, billingService, type CarData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './CarDetail.module.css';

export const CarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [car, setCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');

  // Booking flow states
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirmed'>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'debit_card'>('credit_card');

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await carService.getCarById(id);
        if (response.success) {
          setCar(response.data);
          setPickupLocation(response.data.location?.city || '');
        } else {
          setError('Car not found');
        }
      } catch (err) {
        console.error('Error fetching car:', err);
        setError(err instanceof Error ? err.message : 'Failed to load car details');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id]);

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!pickupDate || !returnDate) {
      setBookingError('Please select pickup and return dates');
      return;
    }
    setBookingError(null);
    setBookingStep('payment');
  };

  const handleConfirmBooking = async () => {
    if (!car || !user) return;
    
    setIsProcessing(true);
    setBookingError(null);
    
    const totalAmount = Math.round(totalPrice * 1.10);
    const userId = user.user_id || user.id;
    
    try {
      // Step 1: Create booking
      const bookingResponse = await bookingService.createBooking({
        user_id: userId,
        booking_type: 'car',
        listing_id: car.car_id,
        travel_date: pickupDate,
        return_date: returnDate,
        quantity: 1,
        total_amount: totalAmount,
        special_requests: `Pickup Location: ${pickupLocation}, Car: ${car.company} ${car.model}`,
      });

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'Failed to create booking');
      }

      setBookingId(bookingResponse.data.booking_id);

      // Step 2: Process payment
      const paymentResponse = await billingService.processPayment({
        user_id: userId,
        booking_id: bookingResponse.data.booking_id,
        booking_type: 'car',
        total_amount: totalAmount,
        payment_method: paymentMethod,
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'Payment failed');
      }

      setBookingStep('confirmed');
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Loading car details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h2>Unable to load car</h2>
            <p>{error || 'Car not found'}</p>
            <Button variant="primary" onClick={() => navigate('/cars')}>
              Back to Cars
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const days = calculateDays();
  const totalPrice = car.daily_rental_price * days;
  const defaultImage = 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={() => navigate('/cars')}>
          <ArrowLeft size={20} />
          Back to Cars
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.content}
        >
          <div className={styles.topSection}>
            {/* Car Image */}
            <div className={styles.imageSection}>
              <img 
                src={car.image_url || defaultImage} 
                alt={`${car.company} ${car.model}`} 
              />
              <Badge variant="info" size="md" className={styles.typeBadge}>
                {car.car_type}
              </Badge>
            </div>

            {/* Car Info */}
            <div className={styles.infoSection}>
              <div className={styles.header}>
                <div className={styles.companyLogo}>
                  {car.company.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className={styles.company}>{car.company}</p>
                  <h1 className={styles.title}>{car.model}</h1>
                </div>
              </div>

              <div className={styles.rating}>
                <Star size={18} fill="#ff690f" color="#ff690f" />
                <span className={styles.ratingValue}>{car.car_rating.toFixed(1)}</span>
                <span className={styles.ratingCount}>({car.reviews?.length || 0} reviews)</span>
              </div>

              <div className={styles.location}>
                <MapPin size={16} />
                <span>{car.location?.city || 'N/A'}, {car.location?.state || 'N/A'}</span>
              </div>

              <div className={styles.specs}>
                <div className={styles.specItem}>
                  <Users size={20} />
                  <div>
                    <span className={styles.specValue}>{car.num_seats}</span>
                    <span className={styles.specLabel}>Seats</span>
                  </div>
                </div>
                <div className={styles.specItem}>
                  <Gauge size={20} />
                  <div>
                    <span className={styles.specValue}>{car.transmission_type}</span>
                    <span className={styles.specLabel}>Transmission</span>
                  </div>
                </div>
                <div className={styles.specItem}>
                  <Calendar size={20} />
                  <div>
                    <span className={styles.specValue}>{car.year}</span>
                    <span className={styles.specLabel}>Year</span>
                  </div>
                </div>
                <div className={styles.specItem}>
                  <Fuel size={20} />
                  <div>
                    <span className={styles.specValue}>Gasoline</span>
                    <span className={styles.specLabel}>Fuel Type</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mainContent}>
            {/* Left Column */}
            <div className={styles.leftColumn}>
              {/* Features Card */}
              <Card variant="bordered" className={styles.featuresCard}>
                <h2 className={styles.sectionTitle}>Car Features</h2>
                <div className={styles.featuresGrid}>
                  <div className={styles.featureItem}>
                    <Snowflake size={20} />
                    <span>Air Conditioning</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Radio size={20} />
                    <span>Bluetooth Audio</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Usb size={20} />
                    <span>USB Charging</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Navigation size={20} />
                    <span>GPS Navigation</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Shield size={20} />
                    <span>Backup Camera</span>
                  </div>
                  <div className={styles.featureItem}>
                    <Check size={20} />
                    <span>Cruise Control</span>
                  </div>
                </div>
              </Card>

              {/* Rental Policies Card */}
              <Card variant="bordered" className={styles.policiesCard}>
                <h2 className={styles.sectionTitle}>Rental Policies</h2>
                <div className={styles.policiesList}>
                  <div className={styles.policyItem}>
                    <Check size={18} className={styles.policyIcon} />
                    <div>
                      <h4>Free Cancellation</h4>
                      <p>Cancel up to 24 hours before pickup for a full refund</p>
                    </div>
                  </div>
                  <div className={styles.policyItem}>
                    <Check size={18} className={styles.policyIcon} />
                    <div>
                      <h4>Unlimited Mileage</h4>
                      <p>Drive as much as you want with no extra charges</p>
                    </div>
                  </div>
                  <div className={styles.policyItem}>
                    <Check size={18} className={styles.policyIcon} />
                    <div>
                      <h4>Insurance Included</h4>
                      <p>Basic collision damage waiver included</p>
                    </div>
                  </div>
                  <div className={styles.policyItem}>
                    <Check size={18} className={styles.policyIcon} />
                    <div>
                      <h4>24/7 Roadside Assistance</h4>
                      <p>Help is just a phone call away</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Reviews Section */}
              <ReviewSection
                entityType="car"
                entityId={car.car_id}
                entityName={`${car.company} ${car.model}`}
              />
            </div>

            {/* Right Column - Booking Card */}
            <div className={styles.rightColumn}>
              <Card variant="bordered" className={styles.bookingCard}>
                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                  <div className={`${styles.step} ${bookingStep === 'details' ? styles.active : ''} ${bookingStep !== 'details' ? styles.completed : ''}`}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepLabel}>Details</span>
                  </div>
                  <div className={styles.stepLine} />
                  <div className={`${styles.step} ${bookingStep === 'payment' ? styles.active : ''} ${bookingStep === 'confirmed' ? styles.completed : ''}`}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepLabel}>Payment</span>
                  </div>
                  <div className={styles.stepLine} />
                  <div className={`${styles.step} ${bookingStep === 'confirmed' ? styles.active : ''}`}>
                    <span className={styles.stepNumber}>3</span>
                    <span className={styles.stepLabel}>Confirm</span>
                  </div>
                </div>

                {/* Step 1: Details */}
                {bookingStep === 'details' && (
                  <>
                    <div className={styles.priceSection}>
                      <span className={styles.priceLabel}>Daily Rate</span>
                      <div className={styles.price}>
                        <span className={styles.priceAmount}>${car.daily_rental_price}</span>
                        <span className={styles.priceUnit}>/ day</span>
                      </div>
                    </div>

                    <div className={styles.bookingForm}>
                      <div className={styles.formGroup}>
                        <label>
                          <MapPin size={16} />
                          Pickup Location
                        </label>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          placeholder="Enter pickup location"
                          className={styles.textInput}
                        />
                      </div>

                      <div className={styles.dateInputs}>
                        <div className={styles.formGroup}>
                          <label>
                            <Calendar size={16} />
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={styles.dateInput}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>
                            <Calendar size={16} />
                            Return Date
                          </label>
                          <input
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            min={pickupDate || new Date().toISOString().split('T')[0]}
                            className={styles.dateInput}
                          />
                        </div>
                      </div>

                      <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                          <span>${car.daily_rental_price} × {days} day{days > 1 ? 's' : ''}</span>
                          <span>${totalPrice}</span>
                        </div>
                        <div className={styles.totalRow}>
                          <span>Insurance</span>
                          <span>$0 (Included)</span>
                        </div>
                        <div className={styles.totalRow}>
                          <span>Taxes & Fees (10%)</span>
                          <span>${Math.round(totalPrice * 0.10)}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                          <span>Total</span>
                          <span>${Math.round(totalPrice * 1.10)}</span>
                        </div>
                      </div>

                      {bookingError && (
                        <div className={styles.errorMessage}>
                          <AlertCircle size={16} />
                          {bookingError}
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleProceedToPayment}
                        rightIcon={<ArrowRight size={18} />}
                      >
                        {isAuthenticated ? 'Continue to Payment' : 'Login to Book'}
                      </Button>
                    </div>

                    <div className={styles.badges}>
                      <Badge variant="success" size="sm">Free Cancellation</Badge>
                      <Badge variant="info" size="sm">Unlimited Mileage</Badge>
                      <Badge variant="warning" size="sm">Insurance Included</Badge>
                    </div>
                  </>
                )}

                {/* Step 2: Payment */}
                {bookingStep === 'payment' && (
                  <div className={styles.paymentSection}>
                    <h3 className={styles.paymentTitle}>
                      <CreditCard size={20} />
                      Payment Details
                    </h3>

                    <div className={styles.bookingSummary}>
                      <h4>Booking Summary</h4>
                      <p>{car.company} {car.model}</p>
                      <p>Pickup: {pickupDate}</p>
                      <p>Return: {returnDate} ({days} days)</p>
                      <p>Location: {pickupLocation}</p>
                      <div className={styles.summaryTotal}>
                        <span>Total:</span>
                        <span>${Math.round(totalPrice * 1.10)}</span>
                      </div>
                    </div>

                    <div className={styles.paymentForm}>
                      <div className={styles.formGroup}>
                        <label>Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as 'credit_card' | 'debit_card')}
                          className={styles.select}
                        >
                          <option value="credit_card">Credit Card</option>
                          <option value="debit_card">Debit Card</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setCardNumber(value);
                          }}
                          maxLength={19}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.formGroup}>
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2);
                              }
                              setExpiryDate(value);
                            }}
                            maxLength={5}
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            maxLength={3}
                            className={styles.input}
                          />
                        </div>
                      </div>

                      {bookingError && (
                        <div className={styles.errorMessage}>
                          <AlertCircle size={16} />
                          {bookingError}
                        </div>
                      )}

                      <div className={styles.paymentActions}>
                        <Button
                          variant="outline"
                          onClick={() => setBookingStep('details')}
                          disabled={isProcessing}
                        >
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleConfirmBooking}
                          isLoading={isProcessing}
                          disabled={!cardNumber || !cardName || !expiryDate || !cvv}
                          rightIcon={<Check size={18} />}
                        >
                          Confirm & Pay
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmed */}
                {bookingStep === 'confirmed' && (
                  <div className={styles.confirmationSection}>
                    <div className={styles.confirmationIcon}>
                      <CheckCircle size={64} />
                    </div>
                    <h3 className={styles.confirmationTitle}>Booking Confirmed!</h3>
                    <p className={styles.confirmationMessage}>
                      Your {car.company} {car.model} rental has been confirmed.
                    </p>
                    
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span>Booking ID:</span>
                        <span>{bookingId}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Pickup:</span>
                        <span>{pickupDate}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Return:</span>
                        <span>{returnDate}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Location:</span>
                        <span>{pickupLocation}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Total Paid:</span>
                        <span>${Math.round(totalPrice * 1.10)}</span>
                      </div>
                    </div>

                    <div className={styles.confirmationActions}>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => navigate('/bookings')}
                      >
                        View My Bookings
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => navigate('/cars')}
                      >
                        Continue Browsing
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
