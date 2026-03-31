import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Star, CheckCircle, Heart, Loader2 } from 'lucide-react';
import { Bourbon } from '../data';

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
  bourbons: Bourbon[];
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
          className={i <= rating ? 'text-[#C89B3C] fill-[#C89B3C]' : 'text-[#EAE4D9]/20'}
        />
      ))}
    </div>
  );
}

export default function FeedView({ user, bourbons }: FeedViewProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bourbonMap = useMemo(() => {
    const map = new Map<string, Bourbon>();
    for (const b of bourbons) {
      map.set(b.id, b);
    }
    return map;
  }, [bourbons]);

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
        <p className="text-[#EAE4D9]/60 font-serif italic text-lg">
          Sign in to see your activity feed.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="micro-label mb-1 text-[#C89B3C]">Activity</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#EAE4D9]">Feed</h1>
        </div>
        <button
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] px-4 py-2 rounded-full transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#C89B3C]" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#EAE4D9]/60 font-serif italic text-lg max-w-md mx-auto">
            Follow some bourbon enthusiasts to see their activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const bourbon = bourbonMap.get(activity.bourbon_id);
            const bourbonName = bourbon?.name || activity.bourbon_id;

            return (
              <div
                key={`${activity.type}-${activity.user_id}-${activity.bourbon_id}-${index}`}
                className="bg-[#1A1816] vintage-border p-4 sm:p-5"
              >
                <div className="flex gap-3 sm:gap-4">
                  {/* Avatar */}
                  <button
                    onClick={() => navigate(`/profile/${activity.user_id}`)}
                    className="flex-shrink-0"
                  >
                    {activity.user_picture ? (
                      <img
                        src={activity.user_picture}
                        alt={activity.user_name}
                        className="w-10 h-10 rounded-full vintage-border hover:border-[#C89B3C] transition-colors"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/20 text-[#C89B3C] text-sm font-bold hover:border-[#C89B3C] transition-colors">
                        {activity.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {activity.type === 'review' && (
                          <p className="text-sm text-[#EAE4D9]">
                            <button
                              onClick={() => navigate(`/profile/${activity.user_id}`)}
                              className="font-semibold hover:text-[#C89B3C] transition-colors"
                            >
                              {activity.user_name}
                            </button>
                            {' reviewed '}
                            <button
                              onClick={() => navigate(`/bourbon/${activity.bourbon_id}`)}
                              className="font-semibold text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors"
                            >
                              {bourbonName}
                            </button>
                          </p>
                        )}

                        {activity.type === 'tried' && (
                          <p className="text-sm text-[#EAE4D9] flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            <span>
                              <button
                                onClick={() => navigate(`/profile/${activity.user_id}`)}
                                className="font-semibold hover:text-[#C89B3C] transition-colors"
                              >
                                {activity.user_name}
                              </button>
                              {' tried '}
                              <button
                                onClick={() => navigate(`/bourbon/${activity.bourbon_id}`)}
                                className="font-semibold text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors"
                              >
                                {bourbonName}
                              </button>
                            </span>
                          </p>
                        )}

                        {activity.type === 'want' && (
                          <p className="text-sm text-[#EAE4D9] flex items-center gap-1.5">
                            <Heart size={14} className="text-red-400 flex-shrink-0" />
                            <span>
                              <button
                                onClick={() => navigate(`/profile/${activity.user_id}`)}
                                className="font-semibold hover:text-[#C89B3C] transition-colors"
                              >
                                {activity.user_name}
                              </button>
                              {' wants to try '}
                              <button
                                onClick={() => navigate(`/bourbon/${activity.bourbon_id}`)}
                                className="font-semibold text-[#C89B3C] hover:text-[#C89B3C]/80 transition-colors"
                              >
                                {bourbonName}
                              </button>
                            </span>
                          </p>
                        )}

                        {/* Rating for reviews */}
                        {activity.type === 'review' && activity.rating && (
                          <div className="mt-1.5">
                            <StarRating rating={activity.rating} />
                          </div>
                        )}

                        {/* Review text snippet */}
                        {activity.type === 'review' && activity.text && (
                          <p className="text-sm text-[#EAE4D9]/60 mt-1.5 line-clamp-2 font-serif italic">
                            "{activity.text}"
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] text-[#EAE4D9]/40 tracking-wider uppercase whitespace-nowrap flex-shrink-0 mt-0.5">
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
