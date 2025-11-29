import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  ArrowLeft,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Waves,
  Tv,
  Wind,
  Users,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { ReviewSection } from '../components/reviews';
import { hotelService, bookingService, billingService, type HotelData } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import styles from './HotelDetail.module.css';

export const HotelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);
  
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
    const fetchHotel = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await hotelService.getHotelById(id);
        if (response.success) {
          setHotel(response.data);
        } else {
          setError('Hotel not found');
        }
      } catch (err) {
        console.error('Error fetching hotel:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id]);

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) return <Wifi size={18} />;
    if (amenityLower.includes('parking')) return <Car size={18} />;
    if (amenityLower.includes('breakfast')) return <Coffee size={18} />;
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return <Dumbbell size={18} />;
    if (amenityLower.includes('pool')) return <Waves size={18} />;
    if (amenityLower.includes('tv')) return <Tv size={18} />;
    if (amenityLower.includes('air') || amenityLower.includes('ac')) return <Wind size={18} />;
    return <Check size={18} />;
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }
    setBookingError(null);
    setBookingStep('payment');
  };

  const handleConfirmBooking = async () => {
    if (!hotel || !user) return;
    
    setIsProcessing(true);
    setBookingError(null);
    
    const totalAmount = Math.round(totalPrice * 1.12);
    const userId = user.user_id || user.id;
    
    try {
      // Step 1: Create booking
      const bookingResponse = await bookingService.createBooking({
        user_id: userId,
        booking_type: 'hotel',
        listing_id: hotel.hotel_id,
        travel_date: checkIn,
        return_date: checkOut,
        quantity: rooms,
        total_amount: totalAmount,
        special_requests: `Room Type: ${selectedRoom?.type || 'Standard'}, Hotel: ${hotel.hotel_name}`,
      });

      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'Failed to create booking');
      }

      setBookingId(bookingResponse.data.booking_id);

      // Step 2: Process payment
      const paymentResponse = await billingService.processPayment({
        user_id: userId,
        booking_id: bookingResponse.data.booking_id,
        booking_type: 'hotel',
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

  const nextImage = () => {
    if (hotel?.images && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images!.length);
    }
  };

  const prevImage = () => {
    if (hotel?.images && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + hotel.images!.length) % hotel.images!.length);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Loading hotel details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h2>Unable to load hotel</h2>
            <p>{error || 'Hotel not found'}</p>
            <Button variant="primary" onClick={() => navigate('/hotels')}>
              Back to Hotels
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nights = calculateNights();
  const selectedRoom = hotel.room_types?.[selectedRoomType];
  const pricePerNight = selectedRoom?.price_per_night || 0;
  const totalPrice = pricePerNight * nights * rooms;
  const defaultImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={() => navigate('/hotels')}>
          <ArrowLeft size={20} />
          Back to Hotels
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.content}
        >
          {/* Image Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              <img 
                src={hotel.images?.[currentImageIndex]?.url || defaultImage} 
                alt={hotel.hotel_name} 
              />
              {hotel.images && hotel.images.length > 1 && (
                <>
                  <button className={styles.galleryNav} onClick={prevImage}>
                    <ChevronLeft size={24} />
                  </button>
                  <button className={`${styles.galleryNav} ${styles.next}`} onClick={nextImage}>
                    <ChevronRight size={24} />
                  </button>
                  <div className={styles.imageCounter}>
                    {currentImageIndex + 1} / {hotel.images.length}
                  </div>
                </>
              )}
            </div>
            {hotel.images && hotel.images.length > 1 && (
              <div className={styles.thumbnails}>
                {hotel.images.slice(0, 5).map((img, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${index === currentImageIndex ? styles.active : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={img.url} alt={`${hotel.hotel_name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hotel Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.starRating}>
                {Array(hotel.star_rating).fill(0).map((_, i) => (
                  <Star key={i} size={18} fill="#ff690f" color="#ff690f" />
                ))}
              </div>
              <h1 className={styles.title}>{hotel.hotel_name}</h1>
              <p className={styles.location}>
                <MapPin size={16} />
                {hotel.address}, {hotel.city}, {hotel.state} {hotel.zip_code}
              </p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.rating}>
                <div className={styles.ratingScore}>{hotel.hotel_rating.toFixed(1)}</div>
                <div className={styles.ratingInfo}>
                  <span className={styles.ratingLabel}>
                    {hotel.hotel_rating >= 4.5 ? 'Excellent' : hotel.hotel_rating >= 4 ? 'Very Good' : 'Good'}
                  </span>
                  <span className={styles.ratingCount}>{hotel.reviews?.length || 0} reviews</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mainContent}>
            {/* Left Column */}
            <div className={styles.leftColumn}>
              {/* Description */}
              <Card variant="bordered" className={styles.descriptionCard}>
                <h2 className={styles.sectionTitle}>About This Hotel</h2>
                <p className={styles.description}>
                  Experience luxury and comfort at {hotel.hotel_name}, located in the heart of {hotel.city}. 
                  Our {hotel.star_rating}-star property offers exceptional amenities and world-class service 
                  to make your stay unforgettable. Whether you're traveling for business or leisure, 
                  we have everything you need for a perfect stay.
                </p>
              </Card>

              {/* Amenities */}
              <Card variant="bordered" className={styles.amenitiesCard}>
                <h2 className={styles.sectionTitle}>Amenities</h2>
                <div className={styles.amenitiesGrid}>
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className={styles.amenityItem}>
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Room Types */}
              <Card variant="bordered" className={styles.roomsCard}>
                <h2 className={styles.sectionTitle}>Available Room Types</h2>
                <div className={styles.roomsList}>
                  {hotel.room_types?.map((room, index) => (
                    <div 
                      key={index} 
                      className={`${styles.roomItem} ${selectedRoomType === index ? styles.selected : ''}`}
                      onClick={() => setSelectedRoomType(index)}
                    >
                      <div className={styles.roomInfo}>
                        <h3 className={styles.roomName}>{room.type} Room</h3>
                        <p className={styles.roomDetails}>
                          {room.available_rooms} rooms available
                        </p>
                      </div>
                      <div className={styles.roomPrice}>
                        <span className={styles.roomPriceAmount}>${room.price_per_night}</span>
                        <span className={styles.roomPriceLabel}>per night</span>
                      </div>
                      <div className={styles.roomSelect}>
                        <input 
                          type="radio" 
                          checked={selectedRoomType === index}
                          onChange={() => setSelectedRoomType(index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Reviews Section */}
              <ReviewSection
                entityType="hotel"
                entityId={hotel.hotel_id}
                entityName={hotel.hotel_name}
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
                      <span className={styles.priceLabel}>From</span>
                      <div className={styles.price}>
                        <span className={styles.priceAmount}>${pricePerNight}</span>
                        <span className={styles.priceUnit}>/ night</span>
                      </div>
                    </div>

                    <div className={styles.bookingForm}>
                      <div className={styles.dateInputs}>
                        <div className={styles.formGroup}>
                          <label>
                            <Calendar size={16} />
                            Check-in
                          </label>
                          <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={styles.dateInput}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>
                            <Calendar size={16} />
                            Check-out
                          </label>
                          <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                            className={styles.dateInput}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>
                          <Users size={16} />
                          Rooms
                        </label>
                        <select
                          value={rooms}
                          onChange={(e) => setRooms(parseInt(e.target.value))}
                          className={styles.select}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.selectedRoom}>
                        <span>Selected: {selectedRoom?.type || 'Standard'} Room</span>
                      </div>

                      <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                          <span>${pricePerNight} × {nights} nights × {rooms} room{rooms > 1 ? 's' : ''}</span>
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
                    </div>

                    <div className={styles.policies}>
                      <div className={styles.policyItem}>
                        <Badge variant="success" size="sm">Free Cancellation</Badge>
                        <span>Cancel up to 24 hours before check-in</span>
                      </div>
                      <div className={styles.policyItem}>
                        <Badge variant="info" size="sm">Secure Payment</Badge>
                        <span>Your payment info is encrypted</span>
                      </div>
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
                      <p>{hotel.hotel_name}</p>
                      <p>{selectedRoom?.type || 'Standard'} Room × {rooms}</p>
                      <p>{checkIn} to {checkOut} ({nights} nights)</p>
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
                      Your reservation at {hotel.hotel_name} has been confirmed.
                    </p>
                    
                    <div className={styles.confirmationDetails}>
                      <div className={styles.confirmationRow}>
                        <span>Booking ID:</span>
                        <span>{bookingId}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Check-in:</span>
                        <span>{checkIn}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Check-out:</span>
                        <span>{checkOut}</span>
                      </div>
                      <div className={styles.confirmationRow}>
                        <span>Room:</span>
                        <span>{selectedRoom?.type || 'Standard'} × {rooms}</span>
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
                        onClick={() => navigate('/hotels')}
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

