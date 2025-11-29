import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Camera,
  Save,
  Shield,
  Bell,
  Globe,
  Star,
  Loader2,
  DollarSign,
  Receipt,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { userService, reviewsService, billingService, type ReviewData, type BillingData } from '../../services/api';
import styles from './Profile.module.css';

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userBillings, setUserBillings] = useState<BillingData[]>([]);
  const [billingsLoading, setBillingsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Payment History', icon: Receipt },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const response = await userService.getUserById(user.id);
        if (response.success) {
          const userData = response.data;
          setFormData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone_number || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zip_code || '',
          });
          
          // Update auth store with latest data
          updateUser({
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            phone: userData.phone_number || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zip_code || '',
            profileImage: userData.profile_image,
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Fetch user reviews when reviews tab is active
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (activeTab !== 'reviews' || !user?.id) return;
      
      setReviewsLoading(true);
      try {
        const response = await reviewsService.getUserReviews(user.id);
        if (response.success) {
          setUserReviews(response.data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchUserReviews();
  }, [activeTab, user?.id]);

  // Fetch user billings when billing tab is active
  useEffect(() => {
    const fetchUserBillings = async () => {
      const userId = user?.user_id || user?.id;
      if (activeTab !== 'billing' || !userId) return;
      
      setBillingsLoading(true);
      try {
        const response = await billingService.getUserBillings(userId);
        if (response.success) {
          setUserBillings(response.data);
        }
      } catch (err) {
        console.error('Error fetching billings:', err);
      } finally {
        setBillingsLoading(false);
      }
    };

    fetchUserBillings();
  }, [activeTab, user?.id, user?.user_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userService.updateUser(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state.toUpperCase(),
        zip_code: formData.zipCode,
      });

      if (response.success) {
        // Update local auth store
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        });
        
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user?.id) return;
    
    try {
      await reviewsService.deleteReview(reviewId, user.id);
      setUserReviews(userReviews.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={40} />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.title}>Account Settings</h1>
          <p className={styles.subtitle}>Manage your profile and preferences</p>
        </motion.div>

        <div className={styles.content}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {formData.firstName[0]}
                  {formData.lastName[0]}
                </div>
                <button className={styles.avatarEdit}>
                  <Camera size={16} />
                </button>
              </div>
              <h3 className={styles.userName}>
                {formData.firstName} {formData.lastName}
              </h3>
              <p className={styles.userEmail}>{formData.email}</p>
              <p className={styles.userId}>ID: {user?.id}</p>
            </div>

            <nav className={styles.nav}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {activeTab === 'profile' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Personal Information</h2>
                    <p className={styles.cardSubtitle}>
                      Update your personal details and contact information
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Save size={16} />}
                      onClick={handleSave}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {success && <div className={styles.successAlert}>{success}</div>}

                <div className={styles.formGrid}>
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    leftIcon={<User size={18} />}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    leftIcon={<User size={18} />}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    leftIcon={<Mail size={18} />}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    leftIcon={<Phone size={18} />}
                  />
                </div>

                <div className={styles.divider} />

                <h3 className={styles.sectionTitle}>Address</h3>
                <div className={styles.formGrid}>
                  <div className={styles.fullWidth}>
                    <Input
                      label="Street Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      leftIcon={<MapPin size={18} />}
                    />
                  </div>
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <div className={styles.selectWrapper}>
                    <label className={styles.selectLabel}>State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={styles.select}
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.divider} />

                <h3 className={styles.sectionTitle}>Payment Methods</h3>
                <div className={styles.paymentCards}>
                  <div className={styles.paymentCard}>
                    <div className={styles.cardIcon}>
                      <CreditCard size={24} />
                    </div>
                    <div className={styles.cardDetails}>
                      <span className={styles.cardType}>Visa ending in 4242</span>
                      <span className={styles.cardExpiry}>Expires 12/25</span>
                    </div>
                    <span className={styles.defaultBadge}>Default</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Add Payment Method
                  </Button>
                </div>
              </Card>
            )}

            {activeTab === 'billing' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Payment History</h2>
                    <p className={styles.cardSubtitle}>
                      View all your payment transactions
                    </p>
                  </div>
                </div>

                {billingsLoading ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={24} />
                    <p>Loading payment history...</p>
                  </div>
                ) : userBillings.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Receipt size={48} className={styles.emptyIcon} />
                    <h3>No payments yet</h3>
                    <p>You haven't made any payments yet. Book a trip to see your payment history here!</p>
                  </div>
                ) : (
                  <>
                    {/* Summary Stats */}
                    <div className={styles.billingStats}>
                      <div className={styles.billingStat}>
                        <DollarSign size={20} />
                        <div>
                          <span className={styles.statValue}>
                            ${userBillings
                              .filter(b => b.transaction_status === 'completed')
                              .reduce((sum, b) => sum + parseFloat(String(b.total_amount)), 0)
                              .toFixed(2)}
                          </span>
                          <span className={styles.statLabel}>Total Spent</span>
                        </div>
                      </div>
                      <div className={styles.billingStat}>
                        <CheckCircle size={20} />
                        <div>
                          <span className={styles.statValue}>
                            {userBillings.filter(b => b.transaction_status === 'completed').length}
                          </span>
                          <span className={styles.statLabel}>Completed</span>
                        </div>
                      </div>
                      <div className={styles.billingStat}>
                        <Clock size={20} />
                        <div>
                          <span className={styles.statValue}>
                            {userBillings.filter(b => b.transaction_status === 'pending').length}
                          </span>
                          <span className={styles.statLabel}>Pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Billing List */}
                    <div className={styles.billingList}>
                      {userBillings.map((billing) => (
                        <div key={billing.billing_id} className={styles.billingItem}>
                          <div className={styles.billingIcon}>
                            <CreditCard size={20} />
                          </div>
                          <div className={styles.billingDetails}>
                            <div className={styles.billingHeader}>
                              <span className={styles.billingType}>
                                {billing.booking_type.charAt(0).toUpperCase() + billing.booking_type.slice(1)} Booking
                              </span>
                              <Badge
                                variant={
                                  billing.transaction_status === 'completed' ? 'success' :
                                  billing.transaction_status === 'pending' ? 'warning' :
                                  billing.transaction_status === 'refunded' ? 'info' : 'error'
                                }
                                size="sm"
                              >
                                {billing.transaction_status === 'completed' && <CheckCircle size={12} />}
                                {billing.transaction_status === 'pending' && <Clock size={12} />}
                                {billing.transaction_status === 'failed' && <XCircle size={12} />}
                                {billing.transaction_status}
                              </Badge>
                            </div>
                            <div className={styles.billingMeta}>
                              <span>#{billing.billing_id}</span>
                              <span>•</span>
                              <span>{new Date(billing.transaction_date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{billing.payment_method.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div className={styles.billingAmount}>
                            <span className={styles.amount}>${parseFloat(String(billing.total_amount)).toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Download size={14} />}
                              onClick={() => billingService.downloadInvoice(billing.billing_id)}
                            >
                              Invoice
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}

            {activeTab === 'reviews' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>My Reviews</h2>
                    <p className={styles.cardSubtitle}>
                      Reviews you've written for hotels, flights, and cars
                    </p>
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={24} />
                    <p>Loading reviews...</p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Star size={48} className={styles.emptyIcon} />
                    <h3>No reviews yet</h3>
                    <p>You haven't written any reviews yet. Book a trip and share your experience!</p>
                  </div>
                ) : (
                  <div className={styles.reviewsList}>
                    {userReviews.map((review) => (
                      <div key={review._id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <div>
                            <h4 className={styles.reviewEntityName}>{review.entity_name}</h4>
                            <span className={styles.reviewEntityType}>{review.entity_type}</span>
                          </div>
                          <div className={styles.reviewRating}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < review.rating ? '#ff690f' : 'none'}
                                color={i < review.rating ? '#ff690f' : '#6b7280'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className={styles.reviewText}>{review.review_text}</p>
                        <div className={styles.reviewFooter}>
                          <span className={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReview(review._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'security' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Security Settings</h2>
                    <p className={styles.cardSubtitle}>
                      Manage your password and security preferences
                    </p>
                  </div>
                </div>

                <div className={styles.securitySection}>
                  <div className={styles.securityItem}>
                    <div>
                      <h4>Password</h4>
                      <p>Last changed 30 days ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>

                  <div className={styles.securityItem}>
                    <div>
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className={styles.securityItem}>
                    <div>
                      <h4>Active Sessions</h4>
                      <p>Manage your active login sessions</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Sessions
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Notification Preferences</h2>
                    <p className={styles.cardSubtitle}>
                      Choose how you want to be notified
                    </p>
                  </div>
                </div>

                <div className={styles.notificationSection}>
                  {[
                    { label: 'Price Alerts', desc: 'Get notified when prices drop' },
                    { label: 'Booking Confirmations', desc: 'Receive booking confirmations via email' },
                    { label: 'Travel Tips', desc: 'Get personalized travel recommendations' },
                    { label: 'Promotional Offers', desc: 'Receive special deals and offers' },
                  ].map((item) => (
                    <label key={item.label} className={styles.notificationItem}>
                      <div>
                        <h4>{item.label}</h4>
                        <p>{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className={styles.toggle} />
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card variant="bordered" className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Travel Preferences</h2>
                    <p className={styles.cardSubtitle}>
                      Customize your travel experience
                    </p>
                  </div>
                </div>

                <div className={styles.preferenceSection}>
                  <div className={styles.preferenceItem}>
                    <label>Preferred Currency</label>
                    <select defaultValue="USD">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className={styles.preferenceItem}>
                    <label>Preferred Language</label>
                    <select defaultValue="en">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div className={styles.preferenceItem}>
                    <label>Default Flight Class</label>
                    <select defaultValue="economy">
                      <option value="economy">Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First Class</option>
                    </select>
                  </div>

                  <div className={styles.preferenceItem}>
                    <label>Home Airport</label>
                    <select defaultValue="SFO">
                      <option value="SFO">San Francisco (SFO)</option>
                      <option value="LAX">Los Angeles (LAX)</option>
                      <option value="JFK">New York (JFK)</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
