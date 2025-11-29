import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Plane,
  Hotel,
  Car,
} from 'lucide-react';
import { Button, Input } from '../ui';
import { bookingService, billingService, type CreateBookingData, type ProcessPaymentData } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import styles from './BookingModal.module.css';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: 'flight' | 'hotel' | 'car';
  listingId: string;
  listingName: string;
  pricePerUnit: number;
  travelDate?: string;
  returnDate?: string;
  quantity?: number;
  additionalInfo?: {
    departure?: string;
    arrival?: string;
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
  };
}

type Step = 'details' | 'payment' | 'confirmation';
type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'stripe';

export const BookingModal = ({
  isOpen,
  onClose,
  bookingType,
  listingId,
  listingName,
  pricePerUnit,
  travelDate: initialTravelDate,
  returnDate: initialReturnDate,
  quantity: initialQuantity = 1,
  additionalInfo,
}: BookingModalProps) => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking details
  const [travelDate, setTravelDate] = useState(initialTravelDate || '');
  const [returnDate, setReturnDate] = useState(initialReturnDate || '');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Result
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [billingId, setBillingId] = useState<string | null>(null);

  const calculateTotal = () => {
    if (bookingType === 'hotel' && travelDate && returnDate) {
      const start = new Date(travelDate);
      const end = new Date(returnDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return pricePerUnit * nights * quantity;
    }
    if (bookingType === 'car' && travelDate && returnDate) {
      const start = new Date(travelDate);
      const end = new Date(returnDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      return pricePerUnit * days;
    }
    return pricePerUnit * quantity;
  };

  const totalAmount = calculateTotal();

  const getBookingIcon = () => {
    switch (bookingType) {
      case 'flight':
        return <Plane size={24} />;
      case 'hotel':
        return <Hotel size={24} />;
      case 'car':
        return <Car size={24} />;
    }
  };

  const userId = user?.user_id || user?.id;

  const handleBookingSubmit = async () => {
    if (!userId) {
      setError('Please log in to make a booking');
      return;
    }

    if (!travelDate) {
      setError('Please select a travel date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData: CreateBookingData = {
        user_id: userId,
        booking_type: bookingType,
        listing_id: listingId,
        travel_date: travelDate,
        return_date: returnDate || undefined,
        quantity,
        total_amount: totalAmount,
        special_requests: specialRequests || undefined,
      };

      const response = await bookingService.createBooking(bookingData);

      if (response.success) {
        setBookingId(response.data.booking_id);
        setStep('payment');
      } else {
        setError('Failed to create booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!bookingId || !userId) {
      setError('Invalid booking');
      return;
    }

    // Basic validation for credit/debit card
    if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && 
        (!cardNumber || !cardExpiry || !cardCvc || !cardName)) {
      setError('Please fill in all card details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData: ProcessPaymentData = {
        user_id: userId,
        booking_type: bookingType,
        booking_id: bookingId,
        total_amount: totalAmount,
        payment_method: paymentMethod,
      };

      const response = await billingService.processPayment(paymentData);

      if (response.success) {
        setBillingId(response.data.billing_id);
        
        // Update booking status to confirmed if payment successful
        if (response.data.transaction_status === 'completed') {
          await bookingService.updateBookingStatus(bookingId, 'confirmed');
        }
        
        setStep('confirmation');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleClose = () => {
    setStep('details');
    setError(null);
    setBookingId(null);
    setBillingId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay} onClick={handleClose}>
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.headerIcon}>{getBookingIcon()}</div>
              <div>
                <h2>
                  {step === 'details' && 'Complete Your Booking'}
                  {step === 'payment' && 'Payment Details'}
                  {step === 'confirmation' && 'Booking Confirmed!'}
                </h2>
                <p>{listingName}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={handleClose}>
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className={styles.progress}>
            <div className={`${styles.progressStep} ${step === 'details' || step === 'payment' || step === 'confirmation' ? styles.active : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Details</span>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${step === 'payment' || step === 'confirmation' ? styles.active : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Payment</span>
            </div>
            <div className={styles.progressLine} />
            <div className={`${styles.progressStep} ${step === 'confirmation' ? styles.active : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Confirm</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Step Content */}
          <div className={styles.content}>
            {/* Step 1: Booking Details */}
            {step === 'details' && (
              <div className={styles.detailsStep}>
                <div className={styles.formGroup}>
                  <label>
                    <Calendar size={16} />
                    {bookingType === 'flight' ? 'Departure Date' : bookingType === 'hotel' ? 'Check-in Date' : 'Pickup Date'}
                  </label>
                  <Input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {(bookingType === 'hotel' || bookingType === 'car') && (
                  <div className={styles.formGroup}>
                    <label>
                      <Calendar size={16} />
                      {bookingType === 'hotel' ? 'Check-out Date' : 'Return Date'}
                    </label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={travelDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                {bookingType !== 'car' && (
                  <div className={styles.formGroup}>
                    <label>
                      <Users size={16} />
                      {bookingType === 'flight' ? 'Passengers' : 'Rooms'}
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className={styles.select}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Special Requests (Optional)</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requirements or requests..."
                    rows={3}
                    className={styles.textarea}
                  />
                </div>

                {/* Price Summary */}
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span>Price per {bookingType === 'flight' ? 'person' : bookingType === 'hotel' ? 'night' : 'day'}</span>
                    <span>${pricePerUnit}</span>
                  </div>
                  {quantity > 1 && (
                    <div className={styles.priceRow}>
                      <span>Quantity</span>
                      <span>x {quantity}</span>
                    </div>
                  )}
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <div className={styles.paymentStep}>
                <div className={styles.paymentMethods}>
                  <label className={styles.paymentMethod}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                    />
                    <CreditCard size={20} />
                    <span>Credit Card</span>
                  </label>
                  <label className={styles.paymentMethod}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'debit_card'}
                      onChange={() => setPaymentMethod('debit_card')}
                    />
                    <CreditCard size={20} />
                    <span>Debit Card</span>
                  </label>
                  <label className={styles.paymentMethod}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                    />
                    <span className={styles.paypalIcon}>P</span>
                    <span>PayPal</span>
                  </label>
                </div>

                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div className={styles.cardForm}>
                    <div className={styles.formGroup}>
                      <label>Card Number</label>
                      <Input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Cardholder Name</label>
                      <Input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className={styles.cardRow}>
                      <div className={styles.formGroup}>
                        <label>Expiry Date</label>
                        <Input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>CVC</label>
                        <Input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className={styles.paypalInfo}>
                    <p>You will be redirected to PayPal to complete your payment.</p>
                  </div>
                )}

                <div className={styles.secureNote}>
                  <Lock size={14} />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                {/* Payment Summary */}
                <div className={styles.priceSummary}>
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Amount to Pay</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirmation' && (
              <div className={styles.confirmationStep}>
                <div className={styles.successIcon}>
                  <CheckCircle size={64} />
                </div>
                <h3>Thank you for your booking!</h3>
                <p>Your booking has been confirmed and a confirmation email will be sent shortly.</p>
                
                <div className={styles.confirmationDetails}>
                  <div className={styles.confirmationRow}>
                    <span>Booking ID</span>
                    <span className={styles.confirmationValue}>#{bookingId}</span>
                  </div>
                  <div className={styles.confirmationRow}>
                    <span>Transaction ID</span>
                    <span className={styles.confirmationValue}>#{billingId}</span>
                  </div>
                  <div className={styles.confirmationRow}>
                    <span>Amount Paid</span>
                    <span className={styles.confirmationValue}>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            {step === 'details' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBookingSubmit}
                  disabled={loading || !travelDate}
                >
                  {loading ? <Loader2 className={styles.spinner} size={18} /> : 'Continue to Payment'}
                </Button>
              </>
            )}
            {step === 'payment' && (
              <>
                <Button variant="outline" onClick={() => setStep('details')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePaymentSubmit}
                  disabled={loading}
                  leftIcon={<Lock size={16} />}
                >
                  {loading ? <Loader2 className={styles.spinner} size={18} /> : `Pay $${totalAmount.toFixed(2)}`}
                </Button>
              </>
            )}
            {step === 'confirmation' && (
              <>
                <Button variant="outline" onClick={() => window.location.href = '/bookings'}>
                  View My Bookings
                </Button>
                <Button variant="primary" onClick={handleClose}>
                  Done
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

