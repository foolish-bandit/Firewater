import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Star, CheckCircle2, Heart, Users, Quote, Rss } from 'lucide-react';
import { SignInButton } from '@clerk/react';
import { Liquor } from '../data';
import PageTransition from './PageTransition';
import { FeedSkeleton } from './SkeletonCard';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface Activity {
  type: 'review' | 'tried' | 'want';
  user_id: string;
  user_name: string;
  user_picture: string;
  bourbon_id: string;
  rating: number | null;
  text: string | null;
  created_at: string;
}

interface FeedViewProps {
  user: User | null;
  liquors: Liquor[];
  onOpenUserSearch?: () => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-on-surface-accent fill-on-surface-accent' : 'text-on-surface/20'}
        />
      ))}
    </div>
  );
}

const activityStyles = {
  review: {
    label: 'FRESH REVIEW',
    verb: 'reviewed',
    icon: Quote,
  },
  tried: {
    label: 'BOTTLE CONQUERED',
    verb: 'checked in',
    icon: CheckCircle2,
  },
  want: {
    label: 'WISHLISTED',
    verb: 'set sights on',
    icon: Heart,
  },
} as const;

export default function FeedView({ user, liquors, onOpenUserSearch }: FeedViewProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const liquorMap = useMemo(() => {
    const map = new Map<string, Liquor>();
    for (const b of liquors) {
      map.set(b.id, b);
    }
    return map;
  }, [liquors]);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/social?scope=feed', {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  usePullToRefresh(useCallback(() => fetchFeed(true), [fetchFeed]));

  if (!user) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full vintage-border flex items-center justify-center mb-5">
            <Rss size={24} className="text-on-surface-accent" />
          </div>
          <h2 className="font-serif text-2xl text-on-surface mb-2">Your Feed</h2>
          <p className="text-on-surface-secondary text-sm max-w-xs mb-6">
            Sign in to see reviews, lists, and activity from people you follow.
          </p>
          <SignInButton mode="modal">
            <button className="btn btn-secondary btn-md">Sign In</button>
          </SignInButton>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition><div>
      <div className="flex items-center justify-between mb-8 pb-5 border-b border-border-subtle">
        <div className="space-y-2">
          <p className="micro-label text-on-surface-accent">
            <span className="text-on-surface-accent">◆</span> The Dispatch
          </p>
          <h1 className="heading-xl text-3xl sm:text-4xl italic font-normal text-on-surface">Feed</h1>
        </div>
        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 border border-border-subtle hover:border-border-accent-strong text-[10px] tracking-[0.22em] uppercase text-on-surface-secondary px-4 py-2 transition-colors disabled:opacity-50"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <FeedSkeleton count={4} />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-border-subtle">
          <Users size={40} className="text-on-surface-accent/30 mb-5" />
          <h3 className="heading-md text-xl italic text-on-surface mb-2">Your feed is empty</h3>
          <p className="text-on-surface-muted font-serif italic text-sm mb-6 max-w-xs">Follow other collectors to see their activity here.</p>
          {onOpenUserSearch ? (
            <button onClick={onOpenUserSearch} className="btn btn-primary">
              Find People to Follow
            </button>
          ) : (
            <button onClick={() => navigate('/catalog')} className="btn btn-primary">
              Explore the Catalog
            </button>
          )}
        </div>
      ) : (
        <div className="border border-border-subtle">
          {activities.map((activity, index) => {
            const liquor = liquorMap.get(activity.bourbon_id);
            const liquorName = liquor?.name || activity.bourbon_id;
            const style = activityStyles[activity.type];
            const Icon = style.icon;

            return (
              <div
                key={`${activity.type}-${activity.user_id}-${activity.bourbon_id}-${index}`}
                className={`group relative p-5 sm:p-6 bg-surface-raised transition-colors duration-200 hover:bg-surface-alt ${index < activities.length - 1 ? 'border-b border-border-subtle' : ''}`}
              >
                <div className="flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] tracking-[0.22em] text-on-surface-accent"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => navigate(`/profile/${activity.user_id}`)}
                      className="shrink-0"
                    >
                      {activity.user_picture ? (
                        <img
                          src={activity.user_picture}
                          alt={activity.user_name}
                          className="w-10 h-10 border border-border-subtle object-cover transition-colors group-hover:border-border-accent-strong"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 border border-border-subtle flex items-center justify-center bg-on-surface-accent/10 text-on-surface-accent font-serif text-base transition-colors group-hover:border-border-accent-strong">
                          {activity.user_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p
                        className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-on-surface-accent"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <span className="text-on-surface-accent">◆</span>
                        <Icon size={11} />
                        {style.label}
                      </p>
                      <span
                        className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {relativeTime(activity.created_at)}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-on-surface-secondary leading-relaxed font-serif">
                      <button
                        onClick={() => navigate(`/profile/${activity.user_id}`)}
                        className="text-on-surface hover:text-on-surface-accent transition-colors not-italic"
                      >
                        {activity.user_name}
                      </button>
                      <span className="text-on-surface-muted italic"> {style.verb} </span>
                      <button
                        onClick={() => navigate(`/liquor/${activity.bourbon_id}`)}
                        className="heading-md italic text-on-surface hover:text-on-surface-accent transition-colors text-lg"
                      >
                        {liquorName}
                      </button>
                    </p>

                    {liquor && (
                      <p
                        className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {liquor.distillery} &middot; {liquor.type} &middot; {liquor.proof} PR
                      </p>
                    )}

                    {activity.type === 'review' && activity.rating && (
                      <div className="flex items-center gap-2 pt-1">
                        <StarRating rating={activity.rating} />
                      </div>
                    )}

                    {activity.type === 'review' && activity.text && (
                      <p className="mt-2 text-sm sm:text-base text-on-surface-secondary font-serif italic leading-relaxed line-clamp-3 border-l-2 border-border-accent pl-3">
                        “{activity.text}”
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div></PageTransition>
  );
}
