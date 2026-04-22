import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, BookOpen, Edit2, Eye, EyeOff, Calendar, Flame, Sparkles, Trophy, Orbit, Users2, FileText, Shield, ScrollText, LogOut, ChevronRight } from 'lucide-react';
import { SignOutButton } from '@clerk/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { User, Review } from '../types';
import { Liquor, FlavorProfile } from '../liquorTypes';
import { useProfile } from '../hooks/useProfile';
import { getFlavorSummary, getSortedFlavorEntries } from '../utils/flavorStory';
import { getAvatarIcon } from '../avatarIcons';
import ProfileEdit from './ProfileEdit';
import { ProfileSkeleton } from './SkeletonCard';
import PageTransition from './PageTransition';
import FollowButton from './FollowButton';
import FollowList from './FollowList';
import { SectionRule, CompassMark } from './ornaments';

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

  useEffect(() => {
    if (!userId) return;
    const headers: Record<string, string> = {};
    if (user) headers['x-user-id'] = user.id;

    fetch(`/api/social?scope=reviews&userId=${userId}`, { headers })
      .then(r => r.json())
      .then(data => setReviews(data.reviews || []))
      .catch(() => {});
  }, [userId, user]);

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

  const proofBadge = useMemo(() => {
    const triedLiquors = triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[];
    if (triedLiquors.length === 0) return null;
    const avgProof = triedLiquors.reduce((sum, b) => sum + b.proof, 0) / triedLiquors.length;
    return { ...getProofBadge(avgProof), avgProof: Math.round(avgProof) };
  }, [triedIds, liquors]);

  const topShelfLiquors = useMemo(() => {
    if (!profile?.top_shelf) return [];
    return profile.top_shelf
      .map(id => liquors.find(b => b.id === id))
      .filter(Boolean) as Liquor[];
  }, [profile?.top_shelf, liquors]);

  const recentReviews = useMemo(() => {
    return reviews.slice(0, 20).map(r => ({
      ...r,
      liquor: liquors.find(b => b.id === r.liquorId),
    }));
  }, [reviews, liquors]);

  const favoriteSpiritLabel = profile?.favorite_spirit || 'Signature spirit still forming';
  const leadingNotes = useMemo(() => {
    if (!flavorDNA) return [];
    return [...flavorDNA].sort((a, b) => b.A - a.A).slice(0, 3);
  }, [flavorDNA]);

  const personaPillars = [
    {
      title: 'Favorite spirit',
      value: favoriteSpiritLabel,
      note: profile?.favorite_spirit ? 'The bottle lane they identify with most.' : 'No spirit pinned yet.',
      icon: Sparkles,
    },
    {
      title: 'Proof persona',
      value: proofBadge?.label || 'Building tolerance',
      note: proofBadge?.description || 'Taste more pours to reveal the heat profile.',
      icon: Flame,
    },
    {
      title: 'Flavor DNA',
      value: leadingNotes.length > 0 ? leadingNotes.map(note => note.subject).join(' • ') : 'Palate signature pending',
      note: leadingNotes.length > 0 ? 'Dominant notes emerging from tasted bottles.' : 'Try a few more bottles to map the palate.',
      icon: Orbit,
    },
  ];

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-on-surface-muted font-serif italic text-xl">Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface-accent text-sm font-semibold tracking-widest uppercase hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isPrivate = !profile.is_public && !profile.is_own;

  return (
    <PageTransition><div className="space-y-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-on-surface-muted hover:text-on-surface-accent transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      <div className="relative overflow-hidden border border-border-subtle bg-surface-raised px-5 py-6 sm:px-8 sm:py-10">
        <CompassMark size={48} opacity={0.35} className="absolute top-6 right-6 text-on-surface-accent pointer-events-none" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative shrink-0 mx-auto md:mx-0">
                {(() => {
                  const avatarDef = getAvatarIcon(profile.avatar_icon);
                  const displayName = profile.display_name || profile.name;
                  if (avatarDef) {
                    const AvatarComp = avatarDef.icon;
                    return (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 border border-border-accent flex items-center justify-center bg-on-surface-accent/10 text-on-surface-accent">
                        <AvatarComp size={36} className="sm:hidden" />
                        <AvatarComp size={44} className="hidden sm:block" />
                      </div>
                    );
                  }
                  if (profile.picture) {
                    return (
                      <img
                        src={profile.picture}
                        alt={displayName}
                        className="w-20 h-20 sm:w-24 sm:h-24 border border-border-subtle object-cover"
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                  return (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 border border-border-subtle flex items-center justify-center bg-on-surface-accent/10 text-on-surface-accent text-3xl sm:text-4xl font-serif">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3 min-w-0">
                    <div className="space-y-2">
                      <p className="micro-label text-on-surface-accent">
                        <span className="text-on-surface-accent">◆</span> Member Persona
                      </p>
                      <h1 className="heading-xl text-3xl sm:text-5xl font-normal italic text-on-surface break-words leading-[1.05]">{profile.display_name || profile.name}</h1>
                    </div>

                    {profile.bio ? (
                      <p className="text-on-surface-secondary font-serif italic text-base max-w-2xl">{profile.bio}</p>
                    ) : (
                      <p className="text-on-surface-muted font-serif italic text-base max-w-2xl">A collector shaping their voice one bottle at a time.</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                      <span
                        className="inline-flex items-center gap-2 border border-border-accent bg-on-surface-accent/10 px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-on-surface-accent"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <Sparkles size={11} /> {favoriteSpiritLabel}
                      </span>
                      <span
                        className="inline-flex items-center gap-2 border border-border-subtle px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <Calendar size={11} /> Since {formatJoinDate(profile.created_at)}
                      </span>
                      {profile.is_own && (
                        <span
                          className="inline-flex items-center gap-2 border border-border-subtle px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {profile.is_public ? <Eye size={11} /> : <EyeOff size={11} />}
                          {profile.is_public ? 'Public' : 'Private'}
                        </span>
                      )}
                      {proofBadge && (
                        <span
                          className="inline-flex items-center gap-2 border border-border-subtle px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          <Flame size={11} /> {proofBadge.avgProof}° avg
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3">
                    {profile.is_own ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="btn btn-secondary inline-flex items-center gap-2 font-sans font-semibold tracking-widest uppercase text-xs px-4 py-2 transition-all duration-300"
                      >
                        <Edit2 size={12} /> Edit Profile
                      </button>
                    ) : user ? (
                      <FollowButton isFollowing={profile.is_following} onToggle={toggleFollow} />
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-6 space-y-0 border-b">
                  {personaPillars.map((pillar, idx) => (
                    <div
                      key={pillar.title}
                      className="flex items-start gap-4 py-4 border-b last:border-b-0 border-border-subtle"
                    >
                      <span
                        className="text-[10px] tracking-[0.22em] text-on-surface-accent pt-1 shrink-0"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="micro-label text-on-surface-muted">{pillar.title}</p>
                        <p className="heading-md text-xl italic text-on-surface break-words leading-tight">{pillar.value}</p>
                        <p className="text-sm font-serif italic text-on-surface-muted leading-relaxed">{pillar.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-border-strong bg-surface-base/80 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border-subtle">
              <div>
                <p className="micro-label text-on-surface-accent">
                  <span className="text-on-surface-accent">◆</span> Identity Layer
                </p>
                <h2 className="heading-md text-xl italic text-on-surface mt-1">Collector Signal</h2>
              </div>
              <Trophy size={16} className="text-on-surface-accent" />
            </div>

            <div className="grid grid-cols-2 gap-0 border border-border-subtle">
              <div className="p-4 border-r border-b border-border-subtle">
                <p className="micro-label text-on-surface-muted">Tasted</p>
                <p className="heading-md text-3xl italic text-on-surface-accent mt-1 leading-none">{profile.tried_count}</p>
              </div>
              <div className="p-4 border-b border-border-subtle">
                <p className="micro-label text-on-surface-muted">Wishlist</p>
                <p className="heading-md text-3xl italic text-on-surface-accent mt-1 leading-none">{profile.want_count}</p>
              </div>
              <div className="p-4 border-r border-border-subtle">
                <p className="micro-label text-on-surface-muted">Reviews</p>
                <p className="heading-md text-3xl italic text-on-surface-accent mt-1 leading-none">{profile.review_count}</p>
              </div>
              <div className="p-4">
                <p className="micro-label text-on-surface-muted">Avg Rating</p>
                <p className="heading-md text-3xl italic text-on-surface-accent mt-1 leading-none">
                  {profile.avg_rating ?? '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 border border-t-0 border-border-subtle">
              <button
                onClick={() => setShowFollows('followers')}
                className="p-4 text-left border-r border-border-subtle hover:bg-on-surface-accent/5 transition-colors"
              >
                <p className="micro-label text-on-surface-muted">Followers</p>
                <p className="heading-md text-2xl italic text-on-surface mt-1 leading-none">{profile.follower_count}</p>
              </button>
              <button
                onClick={() => setShowFollows('following')}
                className="p-4 text-left hover:bg-on-surface-accent/5 transition-colors"
              >
                <p className="micro-label text-on-surface-muted">Following</p>
                <p className="heading-md text-2xl italic text-on-surface mt-1 leading-none">{profile.following_count}</p>
              </button>
            </div>

            {profile.avg_rating && (
              <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.round(Number(profile.avg_rating)) ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface/20'}
                    />
                  ))}
                </div>
                <Users2 size={14} className="text-on-surface-muted" />
              </div>
            )}
          </div>
        </div>
      </div>

      {isPrivate ? (
        <div className="surface-raised border-dashed p-8 sm:p-16 text-center">
          <EyeOff size={32} className="text-on-surface-accent/30 mx-auto mb-4" />
          <p className="text-on-surface-muted font-serif italic text-lg">This profile is private</p>
          <p className="text-on-surface-muted text-sm mt-2">Follow them to see more when they accept</p>
        </div>
      ) : (
        <>
          {topShelfLiquors.length > 0 && (
            <div className="space-y-6 mt-section">
              <SectionRule title="TOP SHELF" trailing={
                <span className="hidden md:inline font-serif italic normal-case tracking-normal text-on-surface-muted">
                  Signature bottles
                </span>
              } />
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {topShelfLiquors.map((liquor, i) => {
                  const isLead = i === 0;
                  return (
                    <button
                      key={liquor.id}
                      onClick={() => navigate(`/liquor/${liquor.id}`)}
                      className={`group relative overflow-hidden border text-left transition-colors duration-200 hover:border-border-accent-strong ${isLead ? 'md:col-span-6 p-6 bg-surface-raised border-border-accent min-h-[240px]' : 'md:col-span-3 p-5 bg-surface-raised border-border-subtle min-h-[200px]'}`}
                    >
                      <div className="absolute right-4 top-4 text-[40px] leading-none text-on-surface-accent opacity-20" style={{ fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(2, '0')}</div>
                      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                        <div className="space-y-3">
                          <p className="micro-label text-on-surface-accent">
                            <span className="text-on-surface-accent">◆</span> {isLead ? 'Crown bottle' : 'Signature pick'}
                          </p>
                          <div>
                            <h3 className={`heading-md italic leading-tight text-on-surface group-hover:text-on-surface-accent transition-colors ${isLead ? 'text-3xl' : 'text-xl'}`}>
                              {liquor.name}
                            </h3>
                            <p className="mt-2 micro-label text-on-surface-muted">
                              {liquor.distillery}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border-subtle">
                          <div className="flex items-baseline justify-between gap-3">
                            <div
                              className="text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              {liquor.proof} PR &middot; {liquor.type} &middot; {liquor.region}
                            </div>
                            <span className="font-serif text-xl italic text-on-surface-accent">${liquor.price}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {flavorDNA && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] gap-6">
              <div className="border border-border-subtle bg-surface-raised p-5 sm:p-8">
                <div className="flex items-end justify-between gap-4 mb-5 pb-4 border-b border-border-subtle">
                  <div>
                    <p className="micro-label text-on-surface-accent">
                      <span className="text-on-surface-accent">◆</span> Flavor DNA
                    </p>
                    <p className="heading-md text-xl italic text-on-surface mt-2">A mapped palate signature</p>
                  </div>
                  <p
                    className="text-right text-[10px] tracking-[0.22em] uppercase text-on-surface-muted max-w-[180px]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {triedIds.length} tasted
                  </p>
                </div>
                <div className="h-[240px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorDNA}>
                      <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.4)', fontSize: 10, fontFamily: 'Montserrat' }} />
                      <Radar name="Flavor DNA" dataKey="A" stroke="var(--text-accent)" fill="var(--text-accent)" fillOpacity={0.22} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                {proofBadge && (
                  <div className="border border-border-accent bg-surface-raised p-5 sm:p-7">
                    <p className="micro-label text-on-surface-accent mb-4">
                      <span className="text-on-surface-accent">◆</span> Proof Tolerance
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border border-border-accent flex items-center justify-center bg-on-surface-accent/10 shrink-0">
                        <Flame size={22} className="text-on-surface-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="heading-md text-xl italic text-on-surface leading-tight">{proofBadge.label}</p>
                        <p className="text-on-surface-muted text-sm font-serif italic mt-1">{proofBadge.description}</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div
                        className="flex justify-between text-[9px] tracking-[0.18em] uppercase text-on-surface-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        <span>80</span>
                        <span>100</span>
                        <span>120</span>
                        <span>140+</span>
                      </div>
                      <div className="h-[2px] bg-surface-base overflow-hidden">
                        <div
                          className="h-full bg-on-surface-accent transition-all duration-700"
                          style={{ width: `${Math.min(((proofBadge.avgProof - 80) / 60) * 100, 100)}%` }}
                        />
                      </div>
                      <p
                        className="text-[10px] tracking-[0.22em] uppercase text-on-surface-accent text-right"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {proofBadge.avgProof}° avg
                      </p>
                    </div>
                  </div>
                )}

                <div className="border border-border-subtle bg-surface-raised p-5 sm:p-7">
                  <p className="micro-label text-on-surface-accent mb-4">
                    <span className="text-on-surface-accent">◆</span> Flavor Hallmarks
                  </p>
                  <div className="space-y-0">
                    {leadingNotes.length > 0 ? leadingNotes.map((note, index) => (
                      <div key={note.subject} className="flex items-baseline justify-between gap-4 py-3 border-b last:border-b-0 border-border-subtle">
                        <div className="flex items-baseline gap-3 min-w-0">
                          <span
                            className="text-[10px] tracking-[0.22em] text-on-surface-accent shrink-0"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <p className="heading-md text-lg italic text-on-surface leading-tight truncate">{note.subject}</p>
                        </div>
                        <span className="font-serif text-2xl italic text-on-surface-accent shrink-0">{note.A}</span>
                      </div>
                    )) : (
                      <p className="text-on-surface-muted font-serif italic">Taste a few more bottles to surface distinct palate hallmarks.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="section-divider" />

          <div className="space-y-6">
            <SectionRule title="THE LOG" trailing={
              <span className="hidden md:inline font-serif italic normal-case tracking-normal text-on-surface-muted">
                Recent tasting opinions
              </span>
            } />

            {recentReviews.length === 0 ? (
              <div className="border border-dashed border-border-subtle bg-surface-raised p-12 text-center">
                <BookOpen size={28} className="text-on-surface-accent/30 mx-auto mb-3" />
                <p className="text-on-surface-muted font-serif italic">No tasting notes yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border-subtle">
                {recentReviews.map((review, index) => {
                  const isFeatured = index === 0;
                  return (
                    <div
                      key={review.id}
                      className={`group relative p-5 sm:p-6 bg-surface-raised border-b lg:border-b border-border-subtle transition-colors duration-200 hover:bg-surface-alt ${isFeatured ? 'lg:col-span-2 lg:border-b' : ''} ${index % 2 === 1 ? '' : 'lg:border-r'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-baseline gap-3 flex-1 min-w-0">
                          <span
                            className="text-[10px] tracking-[0.22em] text-on-surface-accent pt-1 shrink-0"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0 space-y-1">
                            {review.liquor && (
                              <>
                                <p className="micro-label text-on-surface-muted">
                                  {review.liquor.distillery} &middot; {review.liquor.proof} PR &middot; {review.liquor.type}
                                </p>
                                <button
                                  onClick={() => navigate(`/liquor/${review.liquor!.id}`)}
                                  className={`heading-md italic text-left leading-tight text-on-surface group-hover:text-on-surface-accent transition-colors ${isFeatured ? 'text-2xl' : 'text-xl'}`}
                                >
                                  {review.liquor.name}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= review.rating ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface/20'}
                            />
                          ))}
                        </div>
                      </div>
                      {review.text && (
                        <p className={`text-on-surface-secondary font-serif italic leading-relaxed mt-3 ${isFeatured ? 'text-base' : 'text-sm'}`}>{review.text}</p>
                      )}
                      <p
                        className="mt-4 text-[10px] tracking-[0.22em] uppercase text-on-surface-muted"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {new Date(review.date || review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {isFeatured && <span className="text-on-surface-accent"> &middot; Featured</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

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

      {profile.is_own && (
        <div className="md:hidden surface-raised p-5 space-y-1">
          <p className="micro-label text-on-surface-accent mb-3">Settings & Legal</p>
          {[
            { to: '/terms', label: 'Terms & Conditions', icon: FileText },
            { to: '/privacy', label: 'Privacy Policy', icon: Shield },
            { to: '/eula', label: 'End-User License Agreement', icon: ScrollText },
            { to: '/acceptable-use', label: 'Acceptable Use Policy', icon: Shield },
          ].map(link => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="w-full flex items-center justify-between py-3 border-b border-border-subtle last:border-0 text-left group"
            >
              <span className="flex items-center gap-3 text-sm text-on-surface-secondary group-hover:text-on-surface transition-colors">
                <link.icon size={16} className="text-on-surface-muted" />
                {link.label}
              </span>
              <ChevronRight size={14} className="text-on-surface-muted" />
            </button>
          ))}
          <p className="text-[10px] text-on-surface-muted text-center pt-3 tracking-wider">FIREWATER v1.0.0</p>
          {user && (
            <SignOutButton>
              <button className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors pt-3 mt-2 border-t border-border-subtle">
                <LogOut size={16} /> Sign Out
              </button>
            </SignOutButton>
          )}
        </div>
      )}

      {showFollows && userId && (
        <FollowList
          userId={userId}
          type={showFollows}
          onClose={() => setShowFollows(null)}
          onNavigate={(id) => { setShowFollows(null); navigate(`/profile/${id}`); }}
        />
      )}
    </div></PageTransition>
  );
}
