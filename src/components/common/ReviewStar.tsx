import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReviewStarProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (newRating: number) => void;
  showValue?: boolean;
  count?: number;
  className?: string;
}

export const ReviewStar: React.FC<ReviewStarProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  count,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const currentVal = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = currentVal >= starValue;
          const isHalf = !isFilled && currentVal >= starValue - 0.5;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-110 active:scale-95 focus:outline-none' : 'cursor-default'
              }`}
              title={interactive ? `Rate ${starValue} star${starValue > 1 ? 's' : ''}` : undefined}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-300/50 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600 fill-slate-100 dark:fill-slate-800'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-bold text-xs text-slate-700 dark:text-slate-200 ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          ({count})
        </span>
      )}
    </div>
  );
};

interface LeaveFeedbackModalProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LeaveFeedbackModal: React.FC<LeaveFeedbackModalProps> = ({
  bookingId,
  providerId,
  providerName,
  serviceName,
  onClose,
  onSuccess
}) => {
  const { currentUser, triggerGlobalRefresh } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          providerId,
          customerId: currentUser.id,
          customerName: currentUser.name || 'Verified Customer',
          customerAvatar: currentUser.avatar,
          rating,
          comment: comment.trim() || `Excellent ${serviceName} work delivered on time.`
        })
      });

      if (!res.ok) {
        throw new Error('Failed to post review. Please try again.');
      }

      setSubmitted(true);
      triggerGlobalRefresh();
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Review Submitted!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thank you! Your rating has been aggregated to {providerName}'s public verified profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Verified Job Feedback
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-0.5">
                Rate {providerName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order #{bookingId.slice(-6)} • {serviceName}
              </p>
            </div>

            <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Overall Quality & Professionalism
              </p>
              <div className="flex justify-center">
                <ReviewStar
                  rating={rating}
                  interactive={true}
                  size="lg"
                  onRatingChange={setRating}
                />
              </div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
                {rating === 5 ? '5.0 - Outstanding ★★★★★' : `${rating}.0 / 5.0`}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (punctuality, craft quality, communication)..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
