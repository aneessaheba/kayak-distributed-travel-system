import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plane,
  Hotel,
  Car,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { bookingService, billingService, type BookingData, type BillingData } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import styles from './Bookings.module.css';

type TabType = 'all' | 'upcoming' | 'past' | 'cancelled';

export const Bookings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [billings, setBillings] = useState<BillingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const userId = user?.user_id || user?.id;

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const fetchBookings = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [bookingsRes, billingsRes] = await Promise.allSettled([
        bookingService.getUserBookings(userId),
        billingService.getUserBillings(userId),
      ]);

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
        setBookings(bookingsRes.value.data);
      }

      if (billingsRes.status === 'fulfilled' && billingsRes.value.success) {
        setBillings(billingsRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const response = await bookingService.cancelBooking(bookingId);
      if (response.success) {
        // Update local state
        setBookings(prev => 
          prev.map(b => b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b)
        );
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane size={20} />;
      case 'hotel':
        return <Hotel size={20} />;
      case 'car':
        return <Car size={20} />;
      default:
        return <Calendar size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success"><CheckCircle size={12} /> Confirmed</Badge>;
      case 'pending':
        return <Badge variant="warning"><Clock size={12} /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="error"><XCircle size={12} /> Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isUpcoming = (travelDate: string) => {
    return new Date(travelDate) > new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case 'upcoming':
        return booking.status !== 'cancelled' && isUpcoming(booking.travel_date);
      case 'past':
        return booking.status !== 'cancelled' && !isUpcoming(booking.travel_date);
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  const getBillingForBooking = (bookingId: string) => {
    return billings.find(b => b.booking_id === bookingId);
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <h2>Please log in</h2>
            <p>You need to be logged in to view your bookings.</p>
            <Button variant="primary" onClick={() => window.location.href = '/login'}>
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>My Bookings</h1>
            <p>View and manage all your travel bookings</p>
          </div>
          <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={fetchBookings}>
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['all', 'upcoming', 'past', 'cancelled'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'all' && <span className={styles.count}>{bookings.length}</span>}
              {tab === 'upcoming' && (
                <span className={styles.count}>
                  {bookings.filter(b => b.status !== 'cancelled' && isUpcoming(b.travel_date)).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={40} />
            <p>Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h3>Unable to load bookings</h3>
            <p>{error}</p>
            <Button variant="primary" onClick={fetchBookings}>
              Try Again
            </Button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <h3>No bookings found</h3>
            <p>
              {activeTab === 'all'
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings.`}
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/flights'}>
              Start Exploring
            </Button>
          </div>
        ) : (
          <div className={styles.bookingsList}>
            {filteredBookings.map((booking, index) => {
              const billing = getBillingForBooking(booking.booking_id);
              
              return (
                <motion.div
                  key={booking.booking_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="bordered" className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <div className={styles.bookingType}>
                        <div className={styles.typeIcon}>
                          {getBookingIcon(booking.booking_type)}
                        </div>
                        <div>
                          <span className={styles.typeLabel}>
                            {booking.booking_type.charAt(0).toUpperCase() + booking.booking_type.slice(1)} Booking
                          </span>
                          <span className={styles.bookingId}>#{booking.booking_id}</span>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className={styles.bookingDetails}>
                      <div className={styles.detailRow}>
                        <Calendar size={16} />
                        <span>
                          {formatDate(booking.travel_date)}
                          {booking.return_date && ` - ${formatDate(booking.return_date)}`}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <MapPin size={16} />
                        <span>Listing ID: {booking.listing_id}</span>
                      </div>
                      {booking.quantity > 1 && (
                        <div className={styles.detailRow}>
                          <span>Quantity: {booking.quantity}</span>
                        </div>
                      )}
                      {booking.special_requests && (
                        <div className={styles.specialRequests}>
                          <span>Special Requests:</span>
                          <p>{booking.special_requests}</p>
                        </div>
                      )}
                    </div>

                    <div className={styles.bookingFooter}>
                      <div className={styles.priceInfo}>
                        <DollarSign size={16} />
                        <span className={styles.price}>{formatCurrency(booking.total_amount)}</span>
                        {billing && (
                          <Badge 
                            variant={billing.transaction_status === 'completed' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {billing.transaction_status === 'completed' ? 'Paid' : billing.transaction_status}
                          </Badge>
                        )}
                      </div>

                      <div className={styles.actions}>
                        {billing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Download size={14} />}
                            onClick={() => billingService.downloadInvoice(billing.billing_id)}
                          >
                            Invoice
                          </Button>
                        )}
                        {booking.status === 'pending' || (booking.status === 'confirmed' && isUpcoming(booking.travel_date)) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            disabled={cancellingId === booking.booking_id}
                          >
                            {cancellingId === booking.booking_id ? (
                              <Loader2 className={styles.spinner} size={14} />
                            ) : (
                              'Cancel'
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Billing Summary */}
        {billings.length > 0 && (
          <div className={styles.billingSummary}>
            <h2>Payment Summary</h2>
            <div className={styles.summaryCards}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <DollarSign size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <span className={styles.summaryLabel}>Total Spent</span>
                  <span className={styles.summaryValue}>
                    {formatCurrency(
                      billings
                        .filter(b => b.transaction_status === 'completed')
                        .reduce((sum, b) => sum + b.total_amount, 0)
                    )}
                  </span>
                </div>
              </Card>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <span className={styles.summaryLabel}>Completed Payments</span>
                  <span className={styles.summaryValue}>
                    {billings.filter(b => b.transaction_status === 'completed').length}
                  </span>
                </div>
              </Card>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <Clock size={24} />
                </div>
                <div className={styles.summaryContent}>
                  <span className={styles.summaryLabel}>Pending Payments</span>
                  <span className={styles.summaryValue}>
                    {billings.filter(b => b.transaction_status === 'pending').length}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
