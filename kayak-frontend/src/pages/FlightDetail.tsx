import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Wifi,
  Tv,
  UtensilsCrossed,
  Luggage,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Check,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { ReviewSection } from '../components/reviews';
import { flightService, bookingService, billingService, type FlightData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './FlightDetail.module.css';

export const FlightDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [flight, setFlight] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState(1);

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
    const fetchFlight = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await flightService.getFlightById(id);
        if (response.success) {
          setFlight(response.data);
        } else {
          setError('Flight not found');
        }
      } catch (err) {
        console.error('Error fetching flight:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flight details');
      } finally {
        setLoading(false);
      }
    };

    fetchFlight();
  }, [id]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingError(null);
    setBookingStep('payment');
  };

  const handleConfirmBooking = async () => {
    if (!flight || !user) return;
    
    setIsProcessing(true);
    setBookingError(null);
    
    const totalAmount = Math.round(flight.ticket_price * passengers * 1.12);
    const userId = user.user_id || user.id;
    
    try {
      // Step 1: Create booking
      const bookingResponse = await bookingService.createBooking({
        user_id: userId,
        booking_type: 'flight',
        listing_id: flight.flight_id,
        travel_date: flight.departure_datetime.split('T')[0],
        return_date: flight.arrival_datetime.split('T')[0],
        quantity: passengers,
        total_amount: totalAmount,
        special_requests: `Class: ${flight.flight_class}, Flight: ${flight.airline} - ${flight.departure_airport} to ${flight.arrival_airport}`,
      });

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'Failed to create booking');
      }

      setBookingId(bookingResponse.data.booking_id);

      // Step 2: Process payment
      const paymentResponse = await billingService.processPayment({
        user_id: userId,
        booking_id: bookingResponse.data.booking_id,
        booking_type: 'flight',
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
            <p>Loading flight details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h2>Unable to load flight</h2>
            <p>{error || 'Flight not found'}</p>
            <Button variant="primary" onClick={() => navigate('/flights')}>
              Back to Flights
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = flight.ticket_price * passengers;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={() => navigate('/flights')}>
          <ArrowLeft size={20} />
          Back to Flights
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.content}
        >
          {/* Flight Header */}
          <div className={styles.header}>
            <div className={styles.airlineInfo}>
              <div className={styles.airlineLogo}>
                {flight.airline.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className={styles.title}>{flight.airline}</h1>
                <p className={styles.subtitle}>Flight {flight.flight_id}</p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.rating}>
                <Star size={20} fill="#ff690f" color="#ff690f" />
                <span className={styles.ratingValue}>{flight.flight_rating.toFixed(1)}</span>
                <span className={styles.ratingCount}>({flight.reviews?.length || 0} reviews)</span>
              </div>
              <Badge variant="info" size="md">{flight.flight_class}</Badge>
            </div>
          </div>

          <div className={styles.mainContent}>
            {/* Left Column - Flight Details */}
            <div className={styles.leftColumn}>
              {/* Route Card */}
              <Card variant="bordered" className={styles.routeCard}>
                <h2 className={styles.sectionTitle}>Flight Route</h2>
                
                <div className={styles.route}>
                  <div className={styles.routePoint}>
                    <div className={styles.routeTime}>{formatTime(flight.departure_datetime)}</div>
                    <div className={styles.routeAirport}>
                      <MapPin size={16} />
                      {flight.departure_airport}
                    </div>
                    <div className={styles.routeDate}>{formatDate(flight.departure_datetime)}</div>
                  </div>

                  <div className={styles.routeLine}>
                    <div className={styles.dot} />
                    <div className={styles.line}>
                      <Plane size={20} className={styles.planeIcon} />
                    </div>
                    <div className={styles.dot} />
                    <div className={styles.durationBadge}>
                      <Clock size={14} />
                      {formatDuration(flight.duration)}
                    </div>
                  </div>

                  <div className={styles.routePoint}>
                    <div className={styles.routeTime}>{formatTime(flight.arrival_datetime)}</div>
                    <div className={styles.routeAirport}>
                      <MapPin size={16} />
                      {flight.arrival_airport}
                    </div>
                    <div className={styles.routeDate}>{formatDate(flight.arrival_datetime)}</div>
                  </div>
                </div>
              </Card>

              {/* Amenities Card */}
              <Card variant="bordered" className={styles.amenitiesCard}>
                <h2 className={styles.sectionTitle}>In-Flight Amenities</h2>
                <div className={styles.amenitiesList}>
                  <div className={styles.amenityItem}>
                    <Wifi size={20} />
                    <span>Wi-Fi Available</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <Tv size={20} />
                    <span>In-Flight Entertainment</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <UtensilsCrossed size={20} />
                    <span>{flight.flight_class === 'Economy' ? 'Snacks & Beverages' : 'Full Meal Service'}</span>
                  </div>
                  <div className={styles.amenityItem}>
                    <Luggage size={20} />
                    <span>{flight.flight_class === 'Economy' ? '1 Carry-on' : '2 Checked Bags'}</span>
                  </div>
                </div>
              </Card>

              {/* Flight Info Card */}
              <Card variant="bordered" className={styles.infoCard}>
                <h2 className={styles.sectionTitle}>Flight Information</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Flight Number</span>
                    <span className={styles.infoValue}>{flight.flight_id}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Aircraft</span>
                    <span className={styles.infoValue}>Boeing 737-800</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Class</span>
                    <span className={styles.infoValue}>{flight.flight_class}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Available Seats</span>
                    <span className={styles.infoValue}>{flight.available_seats}</span>
                  </div>
                </div>
              </Card>

              {/* Reviews Section */}
              <ReviewSection
                entityType="flight"
                entityId={flight.flight_id}
                entityName={`${flight.airline} - ${flight.departure_airport} to ${flight.arrival_airport}`}
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
                      <span className={styles.priceLabel}>Price per person</span>
                      <div className={styles.price}>
                        <span className={styles.priceAmount}>${flight.ticket_price}</span>
                      </div>
                    </div>

                    <div className={styles.bookingForm}>
                      <div className={styles.formGroup}>
                        <label>
                          <Users size={16} />
                          Passengers
                        </label>
                        <select
                          value={passengers}
                          onChange={(e) => setPassengers(parseInt(e.target.value))}
                          className={styles.select}
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                          <span>${flight.ticket_price} × {passengers}</span>
                          <span>${totalPrice}</span>
                        </div>
                        <div className={styles.totalRow}>
                          <span>Taxes & Fees (12%)</span>
                          <span>${Math.round(totalPrice * 0.12)}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                          <span>Total</span>
                          <span>${Math.round(totalPrice * 1.12)}</span>
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

                      {flight.available_seats < 10 && (
                        <div className={styles.seatsWarning}>
                          <AlertCircle size={16} />
                          Only {flight.available_seats} seats left at this price!
                        </div>
                      )}
                    </div>

                    <div className={styles.policies}>
                      <h4>Fare Includes:</h4>
                      <ul>
                        <li>✓ {flight.flight_class === 'Economy' ? '1 personal item' : '2 checked bags'}</li>
                        <li>✓ Seat selection</li>
                        <li>✓ In-flight entertainment</li>
                        <li>✓ {flight.flight_class === 'Economy' ? 'Snacks' : 'Full meals'}</li>
                      </ul>
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
                      <p>{flight.airline}</p>
                      <p>{flight.departure_airport} → {flight.arrival_airport}</p>
                      <p>{formatDate(flight.departure_datetime)}</p>
                      <p>{passengers} passenger{passengers > 1 ? 's' : ''}</p>
                      <div className={styles.summaryTotal}>
                        <span>Total:</span>
                        <span>${Math.round(totalPrice * 1.12)}</span>
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
                      Your flight with {flight.airline} has been booked successfully.
                    </p>
                    
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span>Booking ID:</span>
                        <span>{bookingId}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Route:</span>
                        <span>{flight.departure_airport} → {flight.arrival_airport}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Date:</span>
                        <span>{formatDate(flight.departure_datetime)}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Passengers:</span>
                        <span>{passengers}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Total Paid:</span>
                        <span>${Math.round(totalPrice * 1.12)}</span>
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
                        onClick={() => navigate('/flights')}
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
