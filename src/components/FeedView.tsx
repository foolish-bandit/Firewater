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
          className={i <= rating ? 'text-on-surface-accent fill-on-surface-accent' : 'text-on-surface/20'}
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
    badge: 'bg-[#C89B3C]/12 text-[#E2C27A] border border-border-accent',
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
        <p className="text-on-surface-muted font-serif italic text-lg">
          Sign in to see your activity feed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="micro-label mb-1 text-on-surface-accent">Activity</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-on-surface">Feed</h1>
        </div>
        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase vintage-border hover:bg-on-surface-accent hover:text-surface-base hover:border-on-surface-accent text-on-surface-accent px-4 py-2 rounded-full transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-on-surface-accent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-surface-raised vintage-border border-dashed p-8 sm:p-16 text-center relative overflow-hidden">
          <img src="/logo.svg" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.03] pointer-events-none" />
          <div className="relative z-10">
            <Users size={32} className="text-on-surface-accent/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-on-surface mb-2">Your feed is quiet</h3>
            <p className="text-on-surface-muted font-serif italic text-lg mb-6 max-w-md mx-auto">
              Follow some liquor enthusiasts to see their reviews, wishlists, and new pours here.
            </p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-transparent vintage-border hover:bg-on-surface-accent hover:text-surface-base hover:border-on-surface-accent text-on-surface-accent font-sans font-semibold tracking-widest uppercase px-6 py-3 text-xs transition-all duration-300"
            >
              Find People to Follow
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
                className={`group relative overflow-hidden rounded-[28px] border p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)] ${style.shell}`}
              >
                <div className={`absolute inset-y-0 left-0 w-1.5 ${style.rail}`} />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-on-surface/14 to-transparent" />

                <div className="flex gap-3 sm:gap-4 pl-2">
                  <button
                    onClick={() => navigate(`/profile/${activity.user_id}`)}
                    className="flex-shrink-0 self-start"
                  >
                    {activity.user_picture ? (
                      <img
                        src={activity.user_picture}
                        alt={activity.user_name}
                        className="w-11 h-11 rounded-full border border-border-subtle object-cover transition-colors group-hover:border-on-surface-accent/60"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full border border-border-subtle flex items-center justify-center bg-on-surface-accent/20 text-on-surface-accent text-sm font-bold transition-colors group-hover:border-on-surface-accent/60">
                        {activity.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.28em] uppercase ${style.badge}`}>
                            <Icon size={12} />
                            {style.label}
                          </span>
                          <span className="text-[10px] text-on-surface-muted tracking-[0.28em] uppercase">{relativeTime(activity.created_at)}</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm sm:text-[15px] text-on-surface/88 leading-relaxed">
                            <button
                              onClick={() => navigate(`/profile/${activity.user_id}`)}
                              className="font-semibold text-on-surface hover:text-on-surface-accent transition-colors"
                            >
                              {activity.user_name}
                            </button>
                            <span className="text-on-surface-muted"> {style.verb} </span>
                            <button
                              onClick={() => navigate(`/liquor/${activity.bourbon_id}`)}
                              className={`font-display text-lg leading-none transition-colors ${style.highlight}`}
                            >
                              {liquorName}
                            </button>
                          </p>

                          <div className={`rounded-[22px] px-4 py-3 ${style.panel}`}>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="inline-flex items-center gap-2 text-on-surface-secondary">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.iconWrap}`}>
                                  <Icon size={15} />
                                </div>
                                <div>
                                  <p className="text-[10px] tracking-[0.28em] uppercase text-on-surface-muted">Bottle story</p>
                                  <p className="font-serif text-base text-on-surface leading-tight">{liquor?.distillery || 'Community bottle'}</p>
                                </div>
                              </div>

                              {liquor && (
                                <div className="text-[11px] tracking-[0.22em] uppercase text-on-surface-muted">
                                  {liquor.type} · {liquor.proof} proof
                                </div>
                              )}

                              {activity.type === 'review' && activity.rating && (
                                <div className="flex items-center gap-2 sm:ml-auto">
                                  <span className="text-[10px] tracking-[0.28em] uppercase text-on-surface-muted">Score</span>
                                  <StarRating rating={activity.rating} />
                                </div>
                              )}
                            </div>

                            {activity.type === 'review' && activity.text && (
                              <p className="mt-3 text-sm sm:text-[15px] text-on-surface-secondary font-serif italic leading-relaxed line-clamp-3">
                                “{activity.text}”
                              </p>
                            )}

                            {activity.type === 'tried' && (
                              <p className="mt-3 flex items-center gap-2 text-sm text-emerald-100/85 font-serif italic">
                                <GlassWater size={14} className="text-emerald-300" />
                                Added to their tasted shelf.
                              </p>
                            )}

                            {activity.type === 'want' && (
                              <p className="mt-3 flex items-center gap-2 text-sm text-rose-100/85 font-serif italic">
                                <Sparkles size={14} className="text-rose-300" />
                                A future pour now on their radar.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
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
