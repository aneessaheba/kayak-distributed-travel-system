import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { userService, type UserData } from '../../services/api';
import styles from './Users.module.css';

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getAllUsers(pagination.limit, pagination.offset);
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.offset]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      setUsers(users.filter(u => u.user_id !== userId));
      if (selectedUser?.user_id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.user_id?.includes(search)
    );
  });

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinner} size={40} />
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <AlertCircle size={48} />
            <h3>Failed to load users</h3>
            <p>{error}</p>
            <Button variant="primary" onClick={fetchUsers}>
              Retry
            </Button>
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
          <div>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>
              Manage registered users ({pagination.total} total)
            </p>
          </div>
        </motion.div>

        <div className={styles.content}>
          {/* Users List */}
          <Card variant="bordered" className={styles.listCard}>
            <div className={styles.listHeader}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.user_id}
                      className={selectedUser?.user_id === user.user_id ? styles.selected : ''}
                    >
                      <td>
                        <code className={styles.userId}>{user.user_id}</code>
                      </td>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <span>{user.first_name} {user.last_name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.city}, {user.state}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setSelectedUser(user)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => handleDeleteUser(user.user_id)}
                            title="Delete User"
                          >
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
              <span className={styles.pageInfo}>
                Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className={styles.pageButtons}>
                <button
                  className={styles.pageBtn}
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </Card>

          {/* User Details Panel */}
          {selectedUser && (
            <Card variant="bordered" className={styles.detailsCard}>
              <div className={styles.detailsHeader}>
                <h3>User Details</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedUser(null)}
                >
                  ×
                </button>
              </div>

              <div className={styles.detailsAvatar}>
                {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
              </div>

              <h4 className={styles.detailsName}>
                {selectedUser.first_name} {selectedUser.last_name}
              </h4>

              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <Users size={16} />
                  <span>ID: {selectedUser.user_id}</span>
                </div>
                <div className={styles.detailItem}>
                  <Mail size={16} />
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phone_number && (
                  <div className={styles.detailItem}>
                    <Phone size={16} />
                    <span>{selectedUser.phone_number}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <MapPin size={16} />
                  <span>
                    {selectedUser.address && `${selectedUser.address}, `}
                    {selectedUser.city}, {selectedUser.state} {selectedUser.zip_code}
                  </span>
                </div>
              </div>

              <div className={styles.detailsActions}>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => handleDeleteUser(selectedUser.user_id)}
                >
                  Delete User
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

