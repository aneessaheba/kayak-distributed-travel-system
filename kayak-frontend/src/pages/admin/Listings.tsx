import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Plane,
  Hotel,
  Car,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';
import styles from './Listings.module.css';

interface Listing {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  name: string;
  description: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  rating: number;
  bookings: number;
  createdAt: string;
}

const mockListings: Listing[] = [
  {
    id: '1',
    type: 'flight',
    name: 'SFO → JFK (United Airlines)',
    description: 'Daily flights, Economy & Business class',
    price: 349,
    status: 'active',
    rating: 4.5,
    bookings: 1250,
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    type: 'hotel',
    name: 'The Plaza Hotel',
    description: '5-star luxury hotel in Manhattan',
    price: 599,
    status: 'active',
    rating: 4.8,
    bookings: 856,
    createdAt: '2025-01-10',
  },
  {
    id: '3',
    type: 'car',
    name: 'Tesla Model 3',
    description: 'Electric sedan, Hertz rental',
    price: 89,
    status: 'active',
    rating: 4.7,
    bookings: 432,
    createdAt: '2025-01-12',
  },
  {
    id: '4',
    type: 'flight',
    name: 'LAX → MIA (Delta)',
    description: 'Multiple daily flights',
    price: 289,
    status: 'pending',
    rating: 4.3,
    bookings: 678,
    createdAt: '2025-01-18',
  },
  {
    id: '5',
    type: 'hotel',
    name: 'Marriott Downtown',
    description: '4-star hotel, business district',
    price: 199,
    status: 'inactive',
    rating: 4.2,
    bookings: 234,
    createdAt: '2025-01-05',
  },
];

export const AdminListings = () => {
  const [listings] = useState<Listing[]>(mockListings);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'flight' | 'hotel' | 'car'>('all');
  const [selectedListings, setSelectedListings] = useState<string[]>([]);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || listing.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleSelect = (id: string) => {
    setSelectedListings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedListings.length === filteredListings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(filteredListings.map((l) => l.id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane size={18} />;
      case 'hotel':
        return <Hotel size={18} />;
      case 'car':
        return <Car size={18} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="error">Inactive</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div>
            <h1 className={styles.title}>Manage Listings</h1>
            <p className={styles.subtitle}>Add, edit, and manage your travel listings</p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={18} />}>
            Add Listing
          </Button>
        </motion.div>

        {/* Filters */}
        <Card variant="bordered" className={styles.filtersCard}>
          <div className={styles.filtersRow}>
            <div className={styles.searchWrapper}>
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            <div className={styles.typeFilters}>
              {(['all', 'flight', 'hotel', 'car'] as const).map((type) => (
                <button
                  key={type}
                  className={`${styles.typeFilter} ${filterType === type ? styles.active : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                </button>
              ))}
            </div>

            <Button variant="secondary" leftIcon={<Filter size={18} />}>
              More Filters
            </Button>
          </div>

          {selectedListings.length > 0 && (
            <div className={styles.bulkActions}>
              <span>{selectedListings.length} selected</span>
              <Button variant="ghost" size="sm">
                Activate
              </Button>
              <Button variant="ghost" size="sm">
                Deactivate
              </Button>
              <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>
                Delete
              </Button>
            </div>
          )}
        </Card>

        {/* Listings Table */}
        <Card variant="bordered" className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedListings.length === filteredListings.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Listing</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedListings.includes(listing.id)}
                        onChange={() => toggleSelect(listing.id)}
                      />
                    </td>
                    <td>
                      <div className={styles.listingCell}>
                        <div className={styles.listingIcon}>{getTypeIcon(listing.type)}</div>
                        <div>
                          <span className={styles.listingName}>{listing.name}</span>
                          <span className={styles.listingDesc}>{listing.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.typeLabel}>
                        {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.price}>${listing.price}</span>
                    </td>
                    <td>{getStatusBadge(listing.status)}</td>
                    <td>
                      <span className={styles.rating}>⭐ {listing.rating}</span>
                    </td>
                    <td>
                      <span className={styles.bookings}>{listing.bookings.toLocaleString()}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.actionBtn} title="View">
                          <Eye size={16} />
                        </button>
                        <button className={styles.actionBtn} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className={styles.actionBtn} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Showing 1-{filteredListings.length} of {listings.length} listings
            </span>
            <div className={styles.paginationControls}>
              <button className={styles.pageBtn} disabled>
                <ChevronLeft size={18} />
              </button>
              <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>3</button>
              <button className={styles.pageBtn}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

