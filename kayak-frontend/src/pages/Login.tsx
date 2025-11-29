import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Plane, ArrowRight, Shield } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { userService, adminService } from '../services/api';
import styles from './Auth.module.css';

type LoginMode = 'user' | 'admin';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginAdmin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      if (loginMode === 'admin') {
        // Admin login
        const response = await adminService.login(formData.email, formData.password);
        
        if (response.success) {
          // Store token
          localStorage.setItem('kayak-token', response.data.token);
          
          // Update auth store
          loginAdmin(
            {
              id: response.data.admin.adminId,
              firstName: response.data.admin.firstName,
              lastName: response.data.admin.lastName,
              email: response.data.admin.email,
              phone: '',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              role: response.data.admin.role,
              accessLevel: response.data.admin.role === 'kayak_admin' ? 10 : 5,
            },
            response.data.token
          );
          
          navigate('/admin');
        }
      } else {
        // User login
        const response = await userService.login(formData.email, formData.password);
        
        if (response.success) {
          // Generate a simple token for user session (in production, backend should return JWT)
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
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError(error instanceof Error ? error.message : 'Login failed. Please try again.');
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
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.subtitle}>Sign in to your account to continue</p>
            </div>

            {/* Login Mode Toggle */}
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.modeBtn} ${loginMode === 'user' ? styles.active : ''}`}
                onClick={() => setLoginMode('user')}
              >
                <Mail size={16} />
                User Login
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${loginMode === 'admin' ? styles.active : ''}`}
                onClick={() => setLoginMode('admin')}
              >
                <Shield size={16} />
                Admin Login
              </button>
            </div>

            {apiError && (
              <div className={styles.errorAlert}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
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

              <div className={styles.passwordField}>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

              <div className={styles.options}>
                <label className={styles.remember}>
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight size={18} />}
              >
                {loginMode === 'admin' ? 'Sign In as Admin' : 'Sign In'}
              </Button>
            </form>

            {loginMode === 'user' && (
              <>
                <div className={styles.divider}>
                  <span>or continue with</span>
                </div>

                <div className={styles.socialButtons}>
                  <button className={styles.socialBtn}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>
                  <button className={styles.socialBtn}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                </div>

                <p className={styles.footer}>
                  Don't have an account?{' '}
                  <Link to="/register" className={styles.link}>
                    Sign up
                  </Link>
                </p>
              </>
            )}
          </Card>
        </motion.div>
      </div>

      <div className={styles.background}>
        <div className={styles.glow} />
      </div>
    </div>
  );
};
