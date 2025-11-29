import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  Hotel,
  Car,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  TrendingDown,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useSearchStore } from '../stores/searchStore';
import styles from './Home.module.css';

export const Home = () => {
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useSearchStore();
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');

  const tabs = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'cars', label: 'Cars', icon: Car },
  ] as const;

  const popularDestinations = [
    {
      city: 'New York',
      country: 'United States',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
      price: 299,
    },
    {
      city: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      price: 449,
    },
    {
      city: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      price: 599,
    },
    {
      city: 'London',
      country: 'United Kingdom',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
      price: 399,
    },
  ];

  const deals = [
    {
      type: 'flight',
      title: 'SFO → LAX',
      subtitle: 'Economy, Direct',
      originalPrice: 189,
      dealPrice: 129,
      discount: 32,
      tags: ['Limited seats', 'Price drop'],
    },
    {
      type: 'hotel',
      title: 'Grand Hyatt NYC',
      subtitle: '4-star, Manhattan',
      originalPrice: 299,
      dealPrice: 219,
      discount: 27,
      tags: ['Free cancellation', 'Breakfast included'],
    },
    {
      type: 'car',
      title: 'Tesla Model 3',
      subtitle: 'Los Angeles, 3 days',
      originalPrice: 180,
      dealPrice: 135,
      discount: 25,
      tags: ['Electric', 'Free charging'],
    },
  ];

  const features = [
    {
      icon: TrendingDown,
      title: 'Best Price Guarantee',
      description: 'We compare prices from 100s of sites to find you the best deals.',
    },
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Your payment and personal information is always protected.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Search',
      description: 'Our AI concierge finds personalized recommendations for you.',
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Search flights, hotels, and cars from providers worldwide.',
    },
  ];

  const handleSearch = () => {
    navigate(`/${activeTab}`);
  };

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGlow} />
          <div className={styles.heroPattern} />
        </div>

        <div className={styles.heroContent}>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Search hundreds of travel sites
            <span className={styles.highlight}> at once.</span>
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Compare prices from 100s of travel sites. Find the perfect flight, hotel, or rental car.
          </motion.p>

          {/* Search Box */}
          <motion.div
            className={styles.searchBox}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Tabs */}
            <div className={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Search Form */}
            <div className={styles.searchForm}>
              {activeTab === 'flights' && (
                <>
                  <div className={styles.tripTypes}>
                    <button
                      className={`${styles.tripType} ${tripType === 'roundtrip' ? styles.activeTripType : ''}`}
                      onClick={() => setTripType('roundtrip')}
                    >
                      Round-trip
                    </button>
                    <button
                      className={`${styles.tripType} ${tripType === 'oneway' ? styles.activeTripType : ''}`}
                      onClick={() => setTripType('oneway')}
                    >
                      One-way
                    </button>
                  </div>

                  <div className={styles.searchFields}>
                    <div className={styles.searchField}>
                      <MapPin size={18} className={styles.fieldIcon} />
                      <input type="text" placeholder="From where?" />
                    </div>
                    <div className={styles.searchField}>
                      <MapPin size={18} className={styles.fieldIcon} />
                      <input type="text" placeholder="To where?" />
                    </div>
                    <div className={styles.searchField}>
                      <Calendar size={18} className={styles.fieldIcon} />
                      <input type="text" placeholder="Departure" />
                    </div>
                    {tripType === 'roundtrip' && (
                      <div className={styles.searchField}>
                        <Calendar size={18} className={styles.fieldIcon} />
                        <input type="text" placeholder="Return" />
                      </div>
                    )}
                    <div className={styles.searchField}>
                      <Users size={18} className={styles.fieldIcon} />
                      <input type="text" placeholder="1 Adult" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'hotels' && (
                <div className={styles.searchFields}>
                  <div className={styles.searchField}>
                    <MapPin size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Where are you going?" />
                  </div>
                  <div className={styles.searchField}>
                    <Calendar size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Check-in" />
                  </div>
                  <div className={styles.searchField}>
                    <Calendar size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Check-out" />
                  </div>
                  <div className={styles.searchField}>
                    <Users size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="2 Guests, 1 Room" />
                  </div>
                </div>
              )}

              {activeTab === 'cars' && (
                <div className={styles.searchFields}>
                  <div className={styles.searchField}>
                    <MapPin size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Pick-up location" />
                  </div>
                  <div className={styles.searchField}>
                    <Calendar size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Pick-up date" />
                  </div>
                  <div className={styles.searchField}>
                    <Calendar size={18} className={styles.fieldIcon} />
                    <input type="text" placeholder="Drop-off date" />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={20} />}
                onClick={handleSearch}
                className={styles.searchButton}
              >
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Deals Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <TrendingDown className={styles.sectionIcon} />
              Today's Top Deals
            </h2>
            <p className={styles.sectionSubtitle}>
              Exclusive discounts found by our AI. Limited availability!
            </p>
          </div>

          <div className={styles.dealsGrid}>
            {deals.map((deal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="bordered" hover className={styles.dealCard}>
                  <div className={styles.dealBadge}>-{deal.discount}%</div>
                  <div className={styles.dealIcon}>
                    {deal.type === 'flight' && <Plane size={24} />}
                    {deal.type === 'hotel' && <Hotel size={24} />}
                    {deal.type === 'car' && <Car size={24} />}
                  </div>
                  <h3 className={styles.dealTitle}>{deal.title}</h3>
                  <p className={styles.dealSubtitle}>{deal.subtitle}</p>
                  <div className={styles.dealTags}>
                    {deal.tags.map((tag) => (
                      <span key={tag} className={styles.dealTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className={styles.dealPricing}>
                    <span className={styles.originalPrice}>${deal.originalPrice}</span>
                    <span className={styles.dealPrice}>${deal.dealPrice}</span>
                  </div>
                  <Button variant="outline" size="sm" fullWidth>
                    View Deal
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Popular Destinations</h2>
            <p className={styles.sectionSubtitle}>
              Explore trending destinations loved by travelers
            </p>
          </div>

          <div className={styles.destinationsGrid}>
            {popularDestinations.map((dest, index) => (
              <motion.div
                key={dest.city}
                className={styles.destinationCard}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <div
                  className={styles.destinationImage}
                  style={{ backgroundImage: `url(${dest.image})` }}
                >
                  <div className={styles.destinationOverlay} />
                </div>
                <div className={styles.destinationContent}>
                  <h3 className={styles.destinationCity}>{dest.city}</h3>
                  <p className={styles.destinationCountry}>{dest.country}</p>
                  <p className={styles.destinationPrice}>
                    From <strong>${dest.price}</strong>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why Choose Kayak?</h2>
            <p className={styles.sectionSubtitle}>
              The smarter way to search for travel
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Ready to plan your next adventure?
            </h2>
            <p className={styles.ctaSubtitle}>
              Let our AI Concierge help you find the perfect trip tailored to your preferences.
            </p>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={20} />}
              onClick={() => navigate('/concierge')}
            >
              Talk to AI Concierge
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

