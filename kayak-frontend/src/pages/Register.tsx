import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Plane, ArrowRight, User, Phone, MapPin, Hash } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/api';
import styles from './Auth.module.css';

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// SSN format validation (XXX-XX-XXXX)
const validateSSN = (ssn: string): boolean => {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
};

// ZIP code validation (##### or #####-####)
const validateZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step form
  const [formData, setFormData] = useState({
    userId: '', // SSN format
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-format SSN as user types
    if (name === 'userId') {
      const cleaned = value.replace(/\D/g, '').slice(0, 9);
      let formatted = cleaned;
      if (cleaned.length > 3) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      }
      if (cleaned.length > 5) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3, 5) + '-' + cleaned.slice(5);
      }
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    setErrors({ ...errors, [name]: '' });
    setApiError(null);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.userId) {
      newErrors.userId = 'User ID (SSN) is required';
    } else if (!validateSSN(formData.userId)) {
      newErrors.userId = 'Invalid format. Use XXX-XX-XXXX';
    }
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    } else if (!US_STATES.includes(formData.state.toUpperCase())) {
      newErrors.state = 'Invalid US state';
    }
    
    if (!formData.zipCode) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await userService.register({
        user_id: formData.userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state.toUpperCase(),
        zip_code: formData.zipCode,
      });

      if (response.success) {
        // Generate a simple token for user session
        const token = btoa(`${response.data.user_id}:${Date.now()}`);
        localStorage.setItem('kayak-token', token);

        // Update auth store
        login(
          {
            id: response.data.user_id,
            user_id: response.data.user_id,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            email: response.data.email,
            phone: response.data.phone_number || '',
            address: response.data.address || '',
            city: response.data.city || '',
            state: response.data.state || '',
            zipCode: response.data.zip_code || '',
            profileImage: response.data.profile_image,
            bookingHistory: [],
            reviews: [],
            createdAt: new Date(response.data.created_at || Date.now()),
          },
          token
        );

        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.formWrapper}
        >
          <Card variant="bordered" className={styles.card}>
            <div className={styles.header}>
              <Link to="/" className={styles.logo}>
                <div className={styles.logoIcon}>
                  <Plane size={24} />
                </div>
                <span>KAYAK</span>
              </Link>
              <h1 className={styles.title}>Create an account</h1>
              <p className={styles.subtitle}>
                {step === 1 ? 'Enter your personal information' : 'Set up your password and address'}
              </p>
            </div>

            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
              <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                <span className={styles.stepNumber}>1</span>
                <span className={styles.stepLabel}>Personal Info</span>
              </div>
              <div className={styles.stepLine} />
              <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                <span className={styles.stepNumber}>2</span>
                <span className={styles.stepLabel}>Security & Address</span>
              </div>
            </div>

            {apiError && (
              <div className={styles.errorAlert}>
                {apiError}
              </div>
            )}

            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className={styles.form}>
              {step === 1 ? (
                <>
                  <Input
                    label="User ID (SSN Format)"
                    name="userId"
                    placeholder="XXX-XX-XXXX"
                    value={formData.userId}
                    onChange={handleChange}
                    error={errors.userId}
                    leftIcon={<Hash size={18} />}
                  />

                  <div className={styles.row}>
                    <Input
                      label="First Name"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      leftIcon={<User size={18} />}
                    />
                    <Input
                      label="Last Name"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      leftIcon={<User size={18} />}
                    />
                  </div>

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    leftIcon={<Mail size={18} />}
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    leftIcon={<Phone size={18} />}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div className={styles.passwordField}>
                    <Input
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      leftIcon={<Lock size={18} />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={styles.eyeBtn}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </div>

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    leftIcon={<Lock size={18} />}
                  />

                  <Input
                    label="Street Address"
                    name="address"
                    placeholder="123 Main Street"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    leftIcon={<MapPin size={18} />}
                  />

                  <div className={styles.row}>
                    <Input
                      label="City"
                      name="city"
                      placeholder="San Francisco"
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                    />
                    <div className={styles.selectWrapper}>
                      <label className={styles.selectLabel}>State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`${styles.select} ${errors.state ? styles.selectError : ''}`}
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && <span className={styles.selectErrorText}>{errors.state}</span>}
                    </div>
                  </div>

                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    placeholder="94102"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={errors.zipCode}
                  />

                  <label className={styles.terms}>
                    <input type="checkbox" required />
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" className={styles.link}>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className={styles.link}>
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <div className={styles.buttonRow}>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight size={18} />}
                      style={{ flex: 1 }}
                    >
                      Create Account
                    </Button>
                  </div>
                </>
              )}
            </form>

            <p className={styles.footer}>
              Already have an account?{' '}
              <Link to="/login" className={styles.link}>
                Sign in
              </Link>
            </p>
          </Card>
        </motion.div>
      </div>

      <div className={styles.background}>
        <div className={styles.glow} />
      </div>
    </div>
  );
};
