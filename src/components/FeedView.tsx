import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Star, CheckCircle2, Heart, Loader2, Users, Quote, GlassWater, Sparkles } from 'lucide-react';
import { Liquor } from '../data';

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
          className={i <= rating ? 'text-theme-accent fill-[var(--text-accent-strong)]' : 'text-theme-quiet'}
        />
      ))}
    </div>
  );
}

const activityStyles = {
  review: {
    label: 'Fresh Review',
    verb: 'reviewed',
    icon: Quote,
    shell: 'border-[#C89B3C]/25 bg-gradient-to-br from-[#1F1A12] via-[#1A1816] to-[#181512]',
    rail: 'bg-gradient-to-b from-[#E2C27A] via-[#C89B3C] to-[#8A6422]',
    iconWrap: 'bg-[#C89B3C]/14 text-[#E2C27A] border border-[#C89B3C]/25',
    badge: 'bg-[#C89B3C]/12 text-[#E2C27A] border border-[#C89B3C]/20',
    highlight: 'text-[#F3E5BE]',
    panel: 'bg-[#C89B3C]/8 border border-[#C89B3C]/15',
  },
  tried: {
    label: 'Bottle Conquered',
    verb: 'checked in',
    icon: CheckCircle2,
    shell: 'border-emerald-600/20 bg-gradient-to-br from-[#141B17] via-[#171816] to-[#101512]',
    rail: 'bg-gradient-to-b from-[#9CE7C2] via-[#4FB27D] to-[#23593B]',
    iconWrap: 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    highlight: 'text-emerald-200',
    panel: 'bg-emerald-500/8 border border-emerald-500/15',
  },
  want: {
    label: 'Wishlisted Pour',
    verb: 'set sights on',
    icon: Heart,
    shell: 'border-rose-500/20 bg-gradient-to-br from-[#1D1417] via-[#1A1816] to-[#181214]',
    rail: 'bg-gradient-to-b from-[#F3A6B9] via-[#D9678A] to-[#7A3245]',
    iconWrap: 'bg-rose-500/12 text-rose-300 border border-rose-500/20',
    badge: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
    highlight: 'text-rose-200',
    panel: 'bg-rose-500/8 border border-rose-500/15',
  },
} as const;

export default function FeedView({ user, liquors }: FeedViewProps) {
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

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-theme-muted font-serif italic text-lg">
          Sign in to see your activity feed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="micro-label mb-1 text-theme-accent">Activity</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-theme-primary">Feed</h1>
        </div>
        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="btn-base btn-outline btn-pill text-xs px-4 py-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-theme-accent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="surface-panel border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
          <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
          <div className="relative z-10">
            <Users size={32} className="text-theme-accent-faint mx-auto mb-4" />
            <h3 className="font-serif text-xl text-theme-primary mb-2">Your feed is quiet</h3>
            <p className="text-theme-faint font-serif italic text-lg mb-6 max-w-md mx-auto">
              Follow some liquor enthusiasts to see their reviews, wishlists, and new pours here.
            </p>
            <button
              onClick={() => navigate('/catalog')}
              className="btn-base btn-outline px-6 py-3 text-xs"
            >
              Discover Liquors
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const liquor = liquorMap.get(activity.bourbon_id);
            const liquorName = liquor?.name || activity.bourbon_id;
            const style = activityStyles[activity.type];
            const Icon = style.icon;

            return (
              <div
                key={`${activity.type}-${activity.user_id}-${activity.bourbon_id}-${index}`}
                className="surface-panel p-4 sm:p-5"
              >
                <div className={`absolute inset-y-0 left-0 w-1.5 ${style.rail}`} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#EAE4D9]/14 to-transparent" />

                <div className="flex gap-3 sm:gap-4 pl-2">
                  <button
                    onClick={() => navigate(`/profile/${activity.user_id}`)}
                    className="flex-shrink-0 self-start"
                  >
                    {activity.user_picture ? (
                      <img
                        src={activity.user_picture}
                        alt={activity.user_name}
                        className="w-10 h-10 rounded-full vintage-border hover:border-[var(--border-accent-soft)] transition-colors"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-theme-accent-strong text-theme-accent text-sm font-bold hover:border-[var(--border-accent-soft)] transition-colors">
                        {activity.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {activity.type === 'review' && (
                          <p className="text-sm text-theme-primary">
                            <button
                              onClick={() => navigate(`/profile/${activity.user_id}`)}
                              className="font-semibold hover:text-[var(--text-accent-strong)] transition-colors"
                            >
                              {activity.user_name}
                            </button>
                            <span className="text-[#EAE4D9]/55"> {style.verb} </span>
                            <button
                              onClick={() => navigate(`/liquor/${activity.bourbon_id}`)}
                              className="font-semibold text-theme-accent hover:text-[var(--text-accent-soft)] transition-colors"
                            >
                              {liquorName}
                            </button>
                          </p>

                        {activity.type === 'tried' && (
                          <p className="text-sm text-theme-primary flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            <span>
                              <button
                                onClick={() => navigate(`/profile/${activity.user_id}`)}
                                className="font-semibold hover:text-[var(--text-accent-strong)] transition-colors"
                              >
                                {activity.user_name}
                              </button>
                              {' tried '}
                              <button
                                onClick={() => navigate(`/liquor/${activity.bourbon_id}`)}
                                className="font-semibold text-theme-accent hover:text-[var(--text-accent-soft)] transition-colors"
                              >
                                {liquorName}
                              </button>
                            </span>
                          </p>
                        )}

                        {activity.type === 'want' && (
                          <p className="text-sm text-theme-primary flex items-center gap-1.5">
                            <Heart size={14} className="text-red-400 flex-shrink-0" />
                            <span>
                              <button
                                onClick={() => navigate(`/profile/${activity.user_id}`)}
                                className="font-semibold hover:text-[var(--text-accent-strong)] transition-colors"
                              >
                                {activity.user_name}
                              </button>
                              {' wants to try '}
                              <button
                                onClick={() => navigate(`/liquor/${activity.bourbon_id}`)}
                                className="font-semibold text-theme-accent hover:text-[var(--text-accent-soft)] transition-colors"
                              >
                                {liquorName}
                              </button>
                            </span>
                          </p>
                        )}

                              {activity.type === 'review' && activity.rating && (
                                <div className="flex items-center gap-2 sm:ml-auto">
                                  <span className="text-[10px] tracking-[0.28em] uppercase text-[#EAE4D9]/35">Score</span>
                                  <StarRating rating={activity.rating} />
                                </div>
                              )}
                            </div>

                        {/* Review text snippet */}
                        {activity.type === 'review' && activity.text && (
                          <p className="text-sm text-theme-muted mt-1.5 line-clamp-2 font-serif italic">
                            "{activity.text}"
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] text-theme-faint tracking-wider uppercase whitespace-nowrap flex-shrink-0 mt-0.5">
                        {relativeTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
