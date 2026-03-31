import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, CheckCircle, ChevronLeft, Users, BookOpen, Edit2, Eye, EyeOff, Calendar, Flame } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { User, Review } from '../types';
import { Liquor, FlavorProfile } from '../liquorTypes';
import { useProfile } from '../hooks/useProfile';
import { getFlavorSummary, getSortedFlavorEntries } from '../utils/flavorStory';
import ProfileEdit from './ProfileEdit';
import FollowButton from './FollowButton';
import FollowList from './FollowList';

interface ProfileViewProps {
  user: User | null;
  liquors: Liquor[];
}

function getProofBadge(avgProof: number): { label: string; description: string } {
  if (avgProof >= 120) return { label: 'Barrel Strength', description: 'Prefers cask-strength pours' };
  if (avgProof >= 110) return { label: 'Heavy Pour', description: 'Doesn\'t shy from heat' };
  if (avgProof >= 100) return { label: 'Full Bodied', description: 'Appreciates a solid proof' };
  if (avgProof >= 90) return { label: 'Balanced Drinker', description: 'Right down the middle' };
  return { label: 'Smooth Sipper', description: 'Favors approachable pours' };
}

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileView({ user, liquors }: ProfileViewProps) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile, loading, updateProfile, toggleFollow } = useProfile(userId, user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [triedIds, setTriedIds] = useState<string[]>([]);
  const [wantIds, setWantIds] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [showFollows, setShowFollows] = useState<'followers' | 'following' | null>(null);

  // Fetch user's reviews
  useEffect(() => {
    if (!userId) return;
    const headers: Record<string, string> = {};
    if (user) headers['x-user-id'] = user.id;

    fetch(`/api/social?scope=reviews&userId=${userId}`, { headers })
      .then(r => r.json())
      .then(data => setReviews(data.reviews || []))
      .catch(() => {});
  }, [userId, user]);

  // Fetch user's lists
  useEffect(() => {
    if (!userId) return;
    const headers: Record<string, string> = {};
    if (user) headers['x-user-id'] = user.id;

    fetch(`/api/social?scope=lists&userId=${userId}`, { headers })
      .then(r => r.json())
      .then(data => {
        setTriedIds(data.tried || []);
        setWantIds(data.want || []);
      })
      .catch(() => {});
  }, [userId, user]);

  // Compute Flavor DNA - aggregate flavor profile across tried liquors
  const flavorDNA = useMemo(() => {
    const triedLiquors = triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[];
    if (triedLiquors.length === 0) return null;

    const keys = Object.keys(triedLiquors[0].flavorProfile) as (keyof FlavorProfile)[];
    const aggregated: Record<string, number> = {};

    keys.forEach(key => {
      const avg = triedLiquors.reduce((sum, b) => sum + b.flavorProfile[key], 0) / triedLiquors.length;
      aggregated[key] = Math.round(avg * 10) / 10;
    });

    return keys.map(key => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: aggregated[key],
      fullMark: 10,
    }));
  }, [triedIds, liquors]);

  // Compute proof badge from tried liquors
  const proofBadge = useMemo(() => {
    const triedLiquors = triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[];
    if (triedLiquors.length === 0) return null;
    const avgProof = triedLiquors.reduce((sum, b) => sum + b.proof, 0) / triedLiquors.length;
    return { ...getProofBadge(avgProof), avgProof: Math.round(avgProof) };
  }, [triedIds, liquors]);

  const flavorDNASummary = useMemo(() => {
    if (!flavorDNA) return null;

    const triedLiquors = triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[];
    if (triedLiquors.length === 0) return null;

    const keys = Object.keys(triedLiquors[0].flavorProfile) as (keyof FlavorProfile)[];
    const aggregated = keys.reduce((acc, key, index) => {
      acc[key] = flavorDNA[index]?.A ?? 0;
      return acc;
    }, {} as FlavorProfile);

    return {
      summary: getFlavorSummary(aggregated),
      highlights: getSortedFlavorEntries(aggregated).slice(0, 3),
    };
  }, [flavorDNA, triedIds, liquors]);

  // Top shelf liquors
  const topShelfLiquors = useMemo(() => {
    if (!profile?.top_shelf) return [];
    return profile.top_shelf
      .map(id => liquors.find(b => b.id === id))
      .filter(Boolean) as Liquor[];
  }, [profile?.top_shelf, liquors]);

  // Recent reviews with liquor data
  const recentReviews = useMemo(() => {
    return reviews.slice(0, 20).map(r => ({
      ...r,
      liquor: liquors.find(b => b.id === r.liquorId),
    }));
  }, [reviews, liquors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[#C89B3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-[#EAE4D9]/40 font-serif italic text-xl">Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-[#C89B3C] text-sm font-semibold tracking-widest uppercase hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPrivate = !profile.is_public && !profile.is_own;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            {profile.picture ? (
              <img
                src={profile.picture}
                alt={profile.name}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full vintage-border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/20 text-[#C89B3C] text-3xl sm:text-4xl font-serif">
                {profile.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            {proofBadge && (
              <div className="absolute -bottom-2 -right-2 bg-[#1A1816] vintage-border px-2 py-1 rounded-full" title={proofBadge.description}>
                <span className="text-[9px] font-sans font-bold tracking-widest uppercase text-[#C89B3C]">
                  {proofBadge.avgProof}°
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#EAE4D9] truncate">{profile.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {profile.is_own ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-xs px-4 py-2 transition-all duration-300"
                  >
                    <Edit2 size={12} /> Edit Profile
                  </button>
                ) : user ? (
                  <FollowButton isFollowing={profile.is_following} onToggle={toggleFollow} />
                ) : null}
                {profile.is_own && (
                  <span className="inline-flex items-center gap-1 text-[#EAE4D9]/40 text-xs">
                    {profile.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                    {profile.is_public ? 'Public' : 'Private'}
                  </span>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-[#EAE4D9]/70 font-serif italic text-lg max-w-2xl">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-sm">
              {profile.favorite_spirit && (
                <span className="px-3 py-1 bg-[#C89B3C]/10 text-[#C89B3C] text-xs font-semibold tracking-widest uppercase border border-[#C89B3C]/20 rounded-full">
                  {profile.favorite_spirit}
                </span>
              )}
              {proofBadge && (
                <span className="px-3 py-1 bg-[#C89B3C]/5 text-[#C89B3C]/80 text-xs font-semibold tracking-widest uppercase border border-[#C89B3C]/15 rounded-full flex items-center gap-1.5" title={proofBadge.description}>
                  <Flame size={10} /> {proofBadge.label}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[#EAE4D9]/40 text-xs">
                <Calendar size={12} /> Member since {formatJoinDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-[#1A1816] vintage-border p-3 sm:p-4 text-center">
          <span className="block font-serif text-xl sm:text-2xl text-[#EAE4D9]">{profile.tried_count}</span>
          <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Tasted</span>
        </div>
        <div className="bg-[#1A1816] vintage-border p-3 sm:p-4 text-center">
          <span className="block font-serif text-xl sm:text-2xl text-[#EAE4D9]">{profile.want_count}</span>
          <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Wishlist</span>
        </div>
        <div className="bg-[#1A1816] vintage-border p-3 sm:p-4 text-center">
          <span className="block font-serif text-xl sm:text-2xl text-[#EAE4D9]">{profile.review_count}</span>
          <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Reviews</span>
        </div>
        <button
          onClick={() => setShowFollows('followers')}
          className="bg-[#1A1816] vintage-border p-3 sm:p-4 text-center hover:border-[#C89B3C]/30 transition-colors"
        >
          <span className="block font-serif text-xl sm:text-2xl text-[#EAE4D9]">{profile.follower_count}</span>
          <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Followers</span>
        </button>
        <button
          onClick={() => setShowFollows('following')}
          className="bg-[#1A1816] vintage-border p-3 sm:p-4 text-center hover:border-[#C89B3C]/30 transition-colors"
        >
          <span className="block font-serif text-xl sm:text-2xl text-[#EAE4D9]">{profile.following_count}</span>
          <span className="micro-label text-[#C89B3C] mt-1 text-[8px] sm:text-[0.65rem]">Following</span>
        </button>
      </div>

      {isPrivate ? (
        <div className="bg-[#1A1816] vintage-border border-dashed p-8 sm:p-16 text-center">
          <EyeOff size={32} className="text-[#C89B3C]/30 mx-auto mb-4" />
          <p className="text-[#EAE4D9]/40 font-serif italic text-lg">This profile is private</p>
          <p className="text-[#EAE4D9]/25 text-sm mt-2">Follow them to see more when they accept</p>
        </div>
      ) : (
        <>
          {/* Top Shelf */}
          {topShelfLiquors.length > 0 && (
            <div className="space-y-6">
              <div>
                <p className="micro-label text-[#C89B3C] mb-2">Favorites</p>
                <h2 className="font-serif text-3xl font-normal text-[#EAE4D9]">Top Shelf</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {topShelfLiquors.map((liquor, i) => (
                  <button
                    key={liquor.id}
                    onClick={() => navigate(`/liquor/${liquor.id}`)}
                    className="bg-[#1A1816] vintage-border p-3 sm:p-5 text-left hover:border-[#C89B3C] card-glow-hover transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute top-3 right-3 font-serif text-[40px] leading-none text-[#C89B3C] opacity-10">
                      {i + 1}
                    </div>
                    <div className="relative z-10">
                      <h3 className="font-serif text-lg text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors leading-tight mb-2 line-clamp-2">
                        {liquor.name}
                      </h3>
                      <p className="text-[10px] font-sans font-semibold tracking-widest uppercase text-[#EAE4D9]/40">
                        {liquor.distillery}
                      </p>
                      <p className="text-[10px] font-sans tracking-wider text-[#C89B3C]/60 mt-1">
                        {liquor.proof} proof · ${liquor.price}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="section-divider" />

          {/* Flavor DNA + Proof Badge */}
          {flavorDNA && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
                <h3 className="micro-label text-[#C89B3C] mb-4">Flavor DNA</h3>
                <p className="text-[#EAE4D9]/40 text-xs mb-3 font-serif italic">Aggregate palate based on {triedIds.length} tasted liquor{triedIds.length !== 1 ? 's' : ''}</p>
                {flavorDNASummary && (
                  <>
                    <p className="font-serif text-lg italic text-[#EAE4D9]">{flavorDNASummary.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      {flavorDNASummary.highlights.map((flavor, index) => (
                        <div key={flavor.key} className="bg-[#141210] border border-[#EAE4D9]/10 rounded-sm p-3">
                          <p className="text-[10px] font-sans font-semibold tracking-[0.25em] uppercase text-[#EAE4D9]/35">
                            Trend {index + 1}
                          </p>
                          <p className="mt-1 text-sm font-sans font-semibold tracking-wider uppercase text-[#C89B3C]">
                            {flavor.label}
                          </p>
                          <p className="mt-2 text-xs text-[#EAE4D9]/55">{flavor.value.toFixed(1)}/10 average</p>
                        </div>
                      ))}
                    </div>
                    <div className="md:hidden space-y-3 mt-5">
                      {flavorDNASummary.highlights.map((flavor) => (
                        <div key={flavor.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-sans tracking-widest uppercase">
                            <span className="text-[#EAE4D9]/55">{flavor.label}</span>
                            <span className="text-[#C89B3C]">{flavor.value.toFixed(1)}/10</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#0F0D0C] overflow-hidden">
                            <div className="h-full rounded-full bg-[#C89B3C]/80" style={{ width: `${(flavor.value / 10) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-5 border-t border-[#EAE4D9]/10 pt-5">
                  <p className="micro-label text-[#EAE4D9]/35 mb-3">Radar chart for the full palate map</p>
                  <div className="hidden md:block h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorDNA}>
                        <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.4)', fontSize: 10, fontFamily: 'Montserrat' }} />
                        <Radar name="Flavor DNA" dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="md:hidden h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={flavorDNA}>
                        <PolarGrid stroke="rgba(234, 228, 217, 0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.32)', fontSize: 9, fontFamily: 'Montserrat' }} />
                        <Radar name="Flavor DNA" dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.18} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Proof Badge */}
                {proofBadge && (
                  <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
                    <h3 className="micro-label text-[#C89B3C] mb-4">Proof Tolerance</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/10">
                        <Flame size={28} className="text-[#C89B3C]" />
                      </div>
                      <div>
                        <p className="font-serif text-2xl text-[#EAE4D9]">{proofBadge.label}</p>
                        <p className="text-[#EAE4D9]/40 text-sm font-serif italic">{proofBadge.description}</p>
                        <p className="text-[#C89B3C]/60 text-xs mt-1">{proofBadge.avgProof} avg proof</p>
                      </div>
                    </div>
                    {/* Proof meter */}
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-[9px] font-sans tracking-widest uppercase text-[#EAE4D9]/40">
                        <span>80</span>
                        <span>100</span>
                        <span>120</span>
                        <span>140+</span>
                      </div>
                      <div className="h-2 bg-[#141210] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C89B3C]/40 to-[#C89B3C] rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(((proofBadge.avgProof - 80) / 60) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                {profile.avg_rating && (
                  <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
                    <h3 className="micro-label text-[#C89B3C] mb-4">Average Rating</h3>
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-4xl text-[#EAE4D9]">{profile.avg_rating}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={20}
                            className={star <= Math.round(Number(profile.avg_rating)) ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210]'}
                          />
                        ))}
                      </div>
                      <span className="text-[#EAE4D9]/40 text-sm">across {profile.review_count} reviews</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="section-divider" />

          {/* Tasting Journal */}
          <div className="space-y-8">
            <div>
              <p className="micro-label text-[#C89B3C] mb-2">Tasting Notes</p>
              <h2 className="font-serif text-3xl font-normal text-[#EAE4D9]">Journal</h2>
            </div>

            {recentReviews.length === 0 ? (
              <div className="bg-[#1A1816] vintage-border border-dashed p-12 text-center">
                <BookOpen size={28} className="text-[#C89B3C]/30 mx-auto mb-3" />
                <p className="text-[#EAE4D9]/40 font-serif italic">No tasting notes yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#1A1816] vintage-border p-4 sm:p-6 hover:border-[#EAE4D9]/25 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {review.liquor && (
                          <button
                            onClick={() => navigate(`/liquor/${review.liquor!.id}`)}
                            className="font-serif text-xl text-[#EAE4D9] group-hover:text-[#C89B3C] transition-colors text-left leading-tight"
                          >
                            {review.liquor.name}
                          </button>
                        )}
                        {review.liquor && (
                          <p className="text-[10px] font-sans tracking-widest uppercase text-[#EAE4D9]/40 mt-1">
                            {review.liquor.distillery} · {review.liquor.proof} proof
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= review.rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210]'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.text && (
                      <p className="text-[#EAE4D9]/60 font-serif italic leading-relaxed mt-3">{review.text}</p>
                    )}
                    <p className="micro-label text-[#EAE4D9]/20 mt-3">
                      {new Date(review.date || review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Profile Modal */}
      {editing && profile.is_own && (
        <ProfileEdit
          profile={profile}
          liquors={liquors}
          triedIds={triedIds}
          onSave={async (updates) => {
            await updateProfile(updates);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Follow List Modal */}
      {showFollows && userId && (
        <FollowList
          userId={userId}
          type={showFollows}
          onClose={() => setShowFollows(null)}
          onNavigate={(id) => { setShowFollows(null); navigate(`/profile/${id}`); }}
        />
      )}
    </div>
  );
}
