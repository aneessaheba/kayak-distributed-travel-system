import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card } from '../ui';
import { useAuthStore } from '../../stores/authStore';
import { reviewsService, type ReviewData, type ReviewStats } from '../../services/api';
import styles from './ReviewSection.module.css';

interface ReviewSectionProps {
  entityType: 'hotel' | 'flight' | 'car';
  entityId: string;
  entityName: string;
}

export const ReviewSection = ({ entityType, entityId, entityName }: ReviewSectionProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch reviews and stats
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch reviews first (required)
        const reviewsRes = await reviewsService.getReviewsByEntity(entityType, entityId, { limit: 50, sort: 'recent' });
        
        if (reviewsRes.success) {
          setReviews(reviewsRes.data);
          
          // Calculate stats from reviews if stats endpoint fails
          const reviewData = reviewsRes.data;
          const calculatedStats: ReviewStats = {
            total_reviews: reviewData.length,
            average_rating: reviewData.length > 0 
              ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length 
              : 0,
            rating_distribution: {
              1: reviewData.filter(r => r.rating === 1).length,
              2: reviewData.filter(r => r.rating === 2).length,
              3: reviewData.filter(r => r.rating === 3).length,
              4: reviewData.filter(r => r.rating === 4).length,
              5: reviewData.filter(r => r.rating === 5).length,
            }
          };
          
          // Try to get stats from API, fallback to calculated
          try {
            const statsRes = await reviewsService.getReviewStats(entityType, entityId);
            if (statsRes.success) {
              setStats(statsRes.data);
            } else {
              setStats(calculatedStats);
            }
          } catch {
            setStats(calculatedStats);
          }
        }

        // Check if current user has already reviewed
        if (user?.id) {
          try {
            const checkRes = await reviewsService.checkUserReview(user.id, entityType, entityId);
            if (checkRes.success && checkRes.has_reviewed) {
              setUserHasReviewed(true);
              setExistingReviewId(checkRes.review?.review_id || null);
            }
          } catch {
            // Ignore - user just hasn't reviewed yet
          }
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        // Don't show error - just show empty reviews
        setReviews([]);
        setStats({
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [entityType, entityId, user?.id]);

  const handleSubmitReview = async () => {
    if (!user || !reviewText.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await reviewsService.createReview(entityType, entityId, {
        entity_name: entityName,
        user_id: user.id,
        user_name: `${user.firstName} ${user.lastName}`,
        rating,
        review_text: reviewText,
      });

      if (response.success) {
        // Add new review to list
        setReviews([response.data, ...reviews]);
        setUserHasReviewed(true);
        setShowReviewForm(false);
        setReviewText('');
        setRating(5);

        // Update stats
        if (stats) {
          setStats({
            ...stats,
            total_reviews: stats.total_reviews + 1,
            average_rating: ((stats.average_rating * stats.total_reviews) + rating) / (stats.total_reviews + 1),
          });
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await reviewsService.markHelpful(reviewId);
      if (response.success) {
        setReviews(reviews.map(r => 
          r._id === reviewId 
            ? { ...r, helpful_count: response.helpful_count }
            : r
        ));
      }
    } catch (err) {
      console.error('Error marking helpful:', err);
    }
  };

  const renderStars = (rating: number, interactive = false, size = 18) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.starBtn} ${!interactive ? styles.readOnly : ''}`}
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Star
              size={size}
              fill={star <= rating ? '#ff690f' : 'none'}
              color={star <= rating ? '#ff690f' : '#6b7280'}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertCircle size={32} />
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Reviews</h2>
        {stats && stats.average_rating !== undefined && (
          <div className={styles.statsOverview}>
            <div className={styles.avgRating}>
              <span className={styles.avgNumber}>{(stats.average_rating || 0).toFixed(1)}</span>
              {renderStars(Math.round(stats.average_rating || 0), false, 20)}
            </div>
            <span className={styles.totalReviews}>{stats.total_reviews || 0} reviews</span>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      {stats && stats.total_reviews && stats.total_reviews > 0 && stats.rating_distribution && (
        <div className={styles.distribution}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.rating_distribution?.[star as keyof typeof stats.rating_distribution] || 0;
            const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
            return (
              <div key={star} className={styles.distributionRow}>
                <span className={styles.distributionLabel}>{star} stars</span>
                <div className={styles.distributionBar}>
                  <div 
                    className={styles.distributionFill} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={styles.distributionCount}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !userHasReviewed && !showReviewForm && (
        <Button 
          variant="primary" 
          onClick={() => setShowReviewForm(true)}
          className={styles.writeReviewBtn}
        >
          Write a Review
        </Button>
      )}

      {userHasReviewed && (
        <div className={styles.alreadyReviewed}>
          <Star size={18} fill="#ff690f" color="#ff690f" />
          <span>You've already reviewed this {entityType}</span>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card variant="bordered" className={styles.reviewForm}>
          <h3 className={styles.formTitle}>Write Your Review</h3>
          
          <div className={styles.formField}>
            <label>Your Rating</label>
            {renderStars(rating, true, 28)}
          </div>

          <div className={styles.formField}>
            <label>Your Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className={styles.textarea}
            />
          </div>

          {submitError && (
            <div className={styles.submitError}>{submitError}</div>
          )}

          <div className={styles.formActions}>
            <Button 
              variant="outline" 
              onClick={() => setShowReviewForm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleSubmitReview}
              isLoading={isSubmitting}
              disabled={!reviewText.trim()}
            >
              Submit Review
            </Button>
          </div>
        </Card>
      )}

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.emptyState}>
            <Star size={48} className={styles.emptyIcon} />
            <h3>No reviews yet</h3>
            <p>Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewerInfo}>
                  <div className={styles.reviewerAvatar}>
                    <User size={20} />
                  </div>
                  <div>
                    <span className={styles.reviewerName}>{review.user_name}</span>
                    <span className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              
              <p className={styles.reviewText}>{review.review_text}</p>
              
              <div className={styles.reviewFooter}>
                <button 
                  className={styles.helpfulBtn}
                  onClick={() => handleMarkHelpful(review._id)}
                >
                  <ThumbsUp size={14} />
                  <span>Helpful ({review.helpful_count || 0})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

