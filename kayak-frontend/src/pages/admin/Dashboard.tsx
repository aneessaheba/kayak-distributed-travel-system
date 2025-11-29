import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plane,
  Hotel,
  Car,
  DollarSign,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { adminService, userService, type AnalyticsOverview, type TopProperty, type CityRevenue } from '../../services/api';
import styles from './Dashboard.module.css';

const COLORS = {
  flight: '#ff690f',
  hotel: '#00c6c6',
  car: '#10b981',
};

export const AdminDashboard = () => {
  const { admin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);
  const [cityRevenue, setCityRevenue] = useState<CityRevenue[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<'all' | 'flight' | 'hotel' | 'car'>('all');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    // Try to fetch user stats first (this should work)
    try {
      const userStatsRes = await userService.getUserStats();
      if (userStatsRes.success) {
        setTotalUsers(userStatsRes.data.totalUsers);
      }
    } catch (e) {
      console.log('User stats not available:', e);
    }

    // Try to fetch analytics (may fail if MySQL not configured)
    try {
      const overviewRes = await adminService.getDashboardOverview();
      if (overviewRes.success) {
        setOverview(overviewRes.data);
      }
    } catch (e) {
      console.log('Dashboard overview not available:', e);
    }

    try {
      const topPropsRes = await adminService.getTopProperties(selectedYear, selectedType);
      if (topPropsRes.success) {
        setTopProperties(topPropsRes.data);
      }
    } catch (e) {
      console.log('Top properties not available:', e);
    }

    try {
      const cityRevRes = await adminService.getCityRevenue(selectedYear, selectedType);
      if (cityRevRes.success) {
        setCityRevenue(cityRevRes.data);
      }
    } catch (e) {
      console.log('City revenue not available:', e);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedType]);

  const stats = [
    {
      label: 'Total Revenue',
      value: overview ? `$${parseFloat(overview.summary.totalRevenue).toLocaleString()}` : '$0',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: '#ff690f',
    },
    {
      label: 'Total Bookings',
      value: overview ? overview.summary.totalBookings.toLocaleString() : '0',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Calendar,
      color: '#00c6c6',
    },
    {
      label: 'Active Users',
      value: totalUsers.toLocaleString(),
      change: '+15.3%',
      trend: 'up' as const,
      icon: Users,
      color: '#10b981',
    },
    {
      label: 'Cancellation Rate',
      value: '3.2%',
      change: '-0.8%',
      trend: 'down' as const,
      icon: TrendingDown,
      color: '#f59e0b',
    },
  ];

  // Prepare data for pie chart
  const bookingsByType = topProperties.reduce((acc, prop) => {
    const type = prop.property_type as 'flight' | 'hotel' | 'car';
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += prop.total_bookings;
    } else {
      acc.push({
        name: type,
        value: prop.total_bookings,
        color: COLORS[type] || '#6b7280',
      });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  // Calculate percentages for pie chart
  const totalBookings = bookingsByType.reduce((sum, item) => sum + item.value, 0);
  const bookingsByTypeWithPercent = bookingsByType.map(item => ({
    ...item,
    percent: totalBookings > 0 ? Math.round((item.value / totalBookings) * 100) : 0,
  }));

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={40} />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show error state for analytics failures - just show empty data

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              Welcome back, {admin?.firstName || 'Admin'}! Here's what's happening.
            </p>
          </div>
          <div className={styles.filters}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={styles.filterSelect}
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
              className={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="flight">Flights</option>
              <option value="hotel">Hotels</option>
              <option value="car">Cars</option>
            </select>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="bordered" className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: `${stat.color}15` }}>
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span
                    className={`${styles.statChange} ${stat.trend === 'up' ? styles.positive : styles.negative}`}
                  >
                    {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {stat.change}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* City Revenue Chart */}
          <Card variant="bordered" className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>City-wise Revenue ({selectedYear})</h3>
              <div className={styles.chartLegend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: '#ff690f' }} />
                  Revenue
                </span>
              </div>
            </div>
            <div className={styles.chartContainer}>
              {cityRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cityRevenue.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="city" 
                      stroke="#6b7280" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12} 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2235',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f9fafb' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Bar 
                      dataKey="total_revenue" 
                      fill="#ff690f"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No revenue data available</div>
              )}
            </div>
          </Card>

          {/* Bookings by Type */}
          <Card variant="bordered" className={styles.chartCardSmall}>
            <div className={styles.chartHeader}>
              <h3>Bookings by Type</h3>
            </div>
            <div className={styles.pieContainer}>
              {bookingsByTypeWithPercent.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={bookingsByTypeWithPercent}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {bookingsByTypeWithPercent.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1a2235',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.pieLegend}>
                    {bookingsByTypeWithPercent.map((item) => (
                      <div key={item.name} className={styles.pieLegendItem}>
                        <span className={styles.legendDot} style={{ background: item.color }} />
                        <span style={{ textTransform: 'capitalize' }}>{item.name}s</span>
                        <span className={styles.legendValue}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.noData}>No booking data available</div>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className={styles.bottomRow}>
          {/* Top Properties */}
          <Card variant="bordered" className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <h3>Top Properties by Revenue</h3>
              <button className={styles.viewAll}>View All</button>
            </div>
            <div className={styles.tableContainer}>
              {topProperties.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Type</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProperties.slice(0, 5).map((prop, index) => (
                      <tr key={prop.property_id}>
                        <td>
                          <div className={styles.cityCell}>
                            <span className={styles.rank}>#{index + 1}</span>
                            {prop.property_name}
                          </div>
                        </td>
                        <td>
                          <span className={styles.typeBadge} data-type={prop.property_type}>
                            {prop.property_type === 'flight' && <Plane size={14} />}
                            {prop.property_type === 'hotel' && <Hotel size={14} />}
                            {prop.property_type === 'car' && <Car size={14} />}
                            {prop.property_type}
                          </span>
                        </td>
                        <td>{prop.total_bookings.toLocaleString()}</td>
                        <td>${parseFloat(prop.total_revenue).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.noData}>No property data available</div>
              )}
            </div>
          </Card>

          {/* Top Providers (if admin is kayak_admin) */}
          <Card variant="bordered" className={styles.tableCard}>
            <div className={styles.chartHeader}>
              <h3>Top Cities by Revenue</h3>
              <button className={styles.viewAll}>View All</button>
            </div>
            <div className={styles.tableContainer}>
              {cityRevenue.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityRevenue.slice(0, 5).map((city, index) => (
                      <tr key={city.city}>
                        <td>
                          <div className={styles.cityCell}>
                            <span className={styles.rank}>#{index + 1}</span>
                            {city.city}
                          </div>
                        </td>
                        <td>{city.total_bookings.toLocaleString()}</td>
                        <td>${parseFloat(city.total_revenue).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.noData}>No city data available</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
