import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle, ChevronLeft, BookOpen, Edit2, Eye, EyeOff, Calendar, Flame, Sparkles, Trophy, Orbit, Users2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { User, Review } from '../types';
import { Liquor, FlavorProfile } from '../liquorTypes';
import { useProfile } from '../hooks/useProfile';
import { getFlavorSummary, getSortedFlavorEntries } from '../utils/flavorStory';
import { getAvatarIcon } from '../avatarIcons';
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
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-border-accent-strong border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
    <div className="space-y-12 animate-in fade-in duration-500">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-on-surface-muted hover:text-on-surface-accent transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      <div className="relative overflow-hidden rounded-[32px] border border-border-accent bg-[radial-gradient(circle_at_top_left,rgba(200,155,60,0.22),transparent_38%),linear-gradient(135deg,#1C1814_0%,#151311_55%,#101010_100%)] px-5 py-6 sm:px-8 sm:py-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-on-surface/16 to-transparent" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative shrink-0 mx-auto md:mx-0">
                {(() => {
                  const avatarDef = getAvatarIcon(profile.avatar_icon);
                  const displayName = profile.display_name || profile.name;
                  if (avatarDef) {
                    const AvatarComp = avatarDef.icon;
                    return (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-border-accent flex items-center justify-center bg-on-surface-accent/15 text-on-surface-accent shadow-[0_0_0_8px_rgba(200,155,60,0.08)]">
                        <AvatarComp size={44} className="sm:hidden" />
                        <AvatarComp size={56} className="hidden sm:block" />
                      </div>
                    );
                  }
                  if (profile.picture) {
                    return (
                      <img
                        src={profile.picture}
                        alt={displayName}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-border-subtle object-cover shadow-[0_0_0_8px_rgba(200,155,60,0.08)]"
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                  return (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-border-subtle flex items-center justify-center bg-on-surface-accent/20 text-on-surface-accent text-4xl sm:text-5xl font-serif shadow-[0_0_0_8px_rgba(200,155,60,0.08)]">
                      {displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  );
                })()}
                {proofBadge && (
                  <div className="absolute -bottom-2 -right-2 bg-surface-base border border-border-accent px-3 py-1.5 rounded-full shadow-lg" title={proofBadge.description}>
                    <span className="text-[10px] font-sans font-bold tracking-[0.28em] uppercase text-on-surface-accent">
                      {proofBadge.avgProof}° avg
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3 min-w-0">
                    <div className="space-y-2">
                      <p className="micro-label text-on-surface-accent">Member Persona</p>
                      <h1 className="font-serif text-3xl sm:text-5xl font-normal text-on-surface break-words">{profile.display_name || profile.name}</h1>
                    </div>

                    {profile.bio ? (
                      <p className="text-on-surface-secondary font-serif italic text-lg max-w-2xl">{profile.bio}</p>
                    ) : (
                      <p className="text-on-surface-muted font-serif italic text-lg max-w-2xl">A collector shaping their voice one bottle at a time.</p>
                    )}

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-on-surface-accent/10 px-4 py-2 text-[11px] font-semibold tracking-[0.26em] uppercase text-on-surface-accent">
                        <Sparkles size={12} /> {favoriteSpiritLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-on-surface/[0.03] px-4 py-2 text-[11px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">
                        <Calendar size={12} /> Member since {formatJoinDate(profile.created_at)}
                      </span>
                      {profile.is_own && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-on-surface/[0.03] px-4 py-2 text-[11px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">
                          {profile.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                          {profile.is_public ? 'Public cellar' : 'Private cellar'}
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

                <div className="grid gap-3 sm:grid-cols-3">
                  {personaPillars.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <div key={pillar.title} className="rounded-[24px] border border-border-subtle bg-on-surface/[0.03] p-4 text-left">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-border-accent bg-on-surface-accent/10 text-on-surface-accent">
                            <Icon size={17} />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">{pillar.title}</p>
                            <p className="font-serif text-lg leading-tight text-on-surface break-words">{pillar.value}</p>
                            <p className="text-sm text-on-surface-muted leading-relaxed">{pillar.note}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border-accent bg-surface-base/85 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="micro-label text-on-surface-accent mb-1">Identity Layer</p>
                <h2 className="font-serif text-2xl text-on-surface">Collector Signal</h2>
              </div>
              <Trophy size={18} className="text-on-surface-accent" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-full border border-border-subtle bg-on-surface/[0.03] px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Tasted bottles</p>
                  <p className="font-serif text-xl text-on-surface">{profile.tried_count}</p>
                </div>
                <CheckCircle size={18} className="text-on-surface-accent" />
              </div>
              <div className="flex items-center justify-between rounded-full border border-border-subtle bg-on-surface/[0.03] px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Wishlist energy</p>
                  <p className="font-serif text-xl text-on-surface">{profile.want_count}</p>
                </div>
                <Sparkles size={18} className="text-on-surface-accent" />
              </div>
              <div className="flex items-center justify-between rounded-full border border-border-subtle bg-on-surface/[0.03] px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Reviews penned</p>
                  <p className="font-serif text-xl text-on-surface">{profile.review_count}</p>
                </div>
                <BookOpen size={18} className="text-on-surface-accent" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowFollows('followers')}
                  className="rounded-[22px] border border-border-subtle bg-on-surface/[0.03] p-4 text-left hover:border-border-accent transition-colors"
                >
                  <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Followers</p>
                  <p className="mt-2 font-serif text-2xl text-on-surface">{profile.follower_count}</p>
                </button>
                <button
                  onClick={() => setShowFollows('following')}
                  className="rounded-[22px] border border-border-subtle bg-on-surface/[0.03] p-4 text-left hover:border-border-accent transition-colors"
                >
                  <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Following</p>
                  <p className="mt-2 font-serif text-2xl text-on-surface">{profile.following_count}</p>
                </button>
              </div>
              {profile.avg_rating && (
                <div className="rounded-[24px] border border-border-accent bg-on-surface-accent/8 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">Avg tasting score</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="font-serif text-4xl text-on-surface">{profile.avg_rating}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={18}
                              className={star <= Math.round(Number(profile.avg_rating)) ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface/20'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Users2 size={20} className="text-on-surface-accent" />
                  </div>
                </div>
              )}
            </div>
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
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="micro-label text-on-surface-accent mb-2">Signature Bottles</p>
                  <h2 className="font-serif text-3xl font-normal text-on-surface">Top Shelf</h2>
                </div>
                <p className="hidden md:block text-sm text-on-surface-muted font-serif italic">The bottles most associated with this collector.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {topShelfLiquors.map((liquor, i) => {
                  const isLead = i === 0;
                  return (
                    <button
                      key={liquor.id}
                      onClick={() => navigate(`/liquor/${liquor.id}`)}
                      className={`group relative overflow-hidden rounded-[28px] border text-left transition-all duration-300 hover:-translate-y-1 hover:border-border-accent ${isLead ? 'md:col-span-6 p-6 bg-[radial-gradient(circle_at_top_left,rgba(200,155,60,0.16),transparent_40%),linear-gradient(145deg,#1B1713_0%,#141210_100%)] border-border-accent min-h-[260px]' : 'md:col-span-3 p-5 bg-surface-raised border-border-subtle min-h-[220px]'}`}
                    >
                      <div className="absolute right-4 top-4 text-[56px] leading-none font-serif text-on-surface-accent opacity-10">{String(i + 1).padStart(2, '0')}</div>
                      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                        <div className="space-y-3">
                          <span className="inline-flex rounded-full border border-border-accent bg-on-surface-accent/10 px-3 py-1 text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-accent">
                            {isLead ? 'Crown bottle' : 'Signature pick'}
                          </span>
                          <div>
                            <h3 className={`font-serif leading-tight text-on-surface group-hover:text-[#F3E5BE] transition-colors ${isLead ? 'text-3xl' : 'text-xl'}`}>
                              {liquor.name}
                            </h3>
                            <p className="mt-2 text-[11px] font-semibold tracking-[0.24em] uppercase text-on-surface-muted">
                              {liquor.distillery}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-[18px] border border-border-subtle bg-on-surface/[0.03] px-3 py-3">
                              <p className="text-[10px] tracking-[0.24em] uppercase text-on-surface-muted">Proof</p>
                              <p className="mt-1 font-serif text-lg text-on-surface">{liquor.proof}</p>
                            </div>
                            <div className="rounded-[18px] border border-border-subtle bg-on-surface/[0.03] px-3 py-3">
                              <p className="text-[10px] tracking-[0.24em] uppercase text-on-surface-muted">Price</p>
                              <p className="mt-1 font-serif text-lg text-on-surface">${liquor.price}</p>
                            </div>
                          </div>
                          <p className="text-sm text-on-surface-muted leading-relaxed line-clamp-2">
                            {liquor.type} · {liquor.region}
                          </p>
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
              <div className="rounded-[28px] border border-border-subtle bg-surface-raised p-5 sm:p-8">
                <div className="flex items-end justify-between gap-4 mb-5">
                  <div>
                    <h3 className="micro-label text-on-surface-accent mb-2">Flavor DNA</h3>
                    <p className="font-serif text-2xl text-on-surface">A mapped palate signature</p>
                  </div>
                  <p className="text-right text-xs text-on-surface-muted max-w-[180px]">Built from {triedIds.length} tasted bottle{triedIds.length !== 1 ? 's' : ''}.</p>
                </div>
                <div className="h-[240px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorDNA}>
                      <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.4)', fontSize: 10, fontFamily: 'Montserrat' }} />
                      <Radar name="Flavor DNA" dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.22} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                {proofBadge && (
                  <div className="rounded-[28px] border border-border-accent bg-surface-raised p-5 sm:p-7">
                    <h3 className="micro-label text-on-surface-accent mb-4">Proof Tolerance</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-border-accent flex items-center justify-center bg-on-surface-accent/10">
                        <Flame size={28} className="text-on-surface-accent" />
                      </div>
                      <div>
                        <p className="font-serif text-2xl text-on-surface">{proofBadge.label}</p>
                        <p className="text-on-surface-muted text-sm font-serif italic">{proofBadge.description}</p>
                        <p className="text-on-surface-accent/50 text-xs mt-1">{proofBadge.avgProof} avg proof</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-[9px] font-sans tracking-widest uppercase text-on-surface-muted">
                        <span>80</span>
                        <span>100</span>
                        <span>120</span>
                        <span>140+</span>
                      </div>
                      <div className="h-2 bg-surface-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-on-surface-accent/40 to-on-surface-accent rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(((proofBadge.avgProof - 80) / 60) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[28px] border border-border-subtle bg-surface-raised p-5 sm:p-7">
                  <h3 className="micro-label text-on-surface-accent mb-4">Flavor Hallmarks</h3>
                  <div className="space-y-3">
                    {leadingNotes.length > 0 ? leadingNotes.map((note, index) => (
                      <div key={note.subject} className="flex items-center justify-between rounded-[20px] border border-border-subtle bg-on-surface/[0.03] px-4 py-3">
                        <div>
                          <p className="text-[10px] tracking-[0.24em] uppercase text-on-surface-muted">#{index + 1} palate note</p>
                          <p className="font-serif text-xl text-on-surface">{note.subject}</p>
                        </div>
                        <span className="font-serif text-2xl text-on-surface-accent">{note.A}</span>
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

          <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="micro-label text-on-surface-accent mb-2">Recent Tasting Opinions</p>
                <h2 className="font-serif text-3xl font-normal text-on-surface">Journal</h2>
              </div>
              <p className="hidden md:block text-sm text-on-surface-muted font-serif italic">A more personal view into what they praise, revisit, and remember.</p>
            </div>

            {recentReviews.length === 0 ? (
              <div className="surface-raised border-dashed p-12 text-center">
                <BookOpen size={28} className="text-on-surface-accent/30 mx-auto mb-3" />
                <p className="text-on-surface-muted font-serif italic">No tasting notes yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {recentReviews.map((review, index) => (
                  <div
                    key={review.id}
                    className={`group relative overflow-hidden rounded-[28px] border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${index === 0 ? 'border-border-accent bg-[radial-gradient(circle_at_top_left,rgba(200,155,60,0.14),transparent_38%),linear-gradient(145deg,#1B1713_0%,#141210_100%)] lg:col-span-2' : 'border-border-subtle bg-surface-raised'}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-on-surface/15 to-transparent" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {review.liquor && (
                          <button
                            onClick={() => navigate(`/liquor/${review.liquor!.id}`)}
                            className={`font-serif text-left leading-tight transition-colors group-hover:text-[#F3E5BE] ${index === 0 ? 'text-3xl text-on-surface' : 'text-2xl text-on-surface'}`}
                          >
                            {review.liquor.name}
                          </button>
                        )}
                        {review.liquor && (
                          <p className="text-[10px] font-sans tracking-[0.26em] uppercase text-on-surface-muted mt-2">
                            {review.liquor.distillery} · {review.liquor.proof} proof · {review.liquor.type}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 rounded-full border border-border-accent bg-on-surface-accent/10 px-3 py-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= review.rating ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface/20'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.text && (
                      <p className={`text-on-surface-secondary font-serif italic leading-relaxed mt-4 ${index === 0 ? 'text-lg' : ''}`}>{review.text}</p>
                    )}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-muted">
                        {new Date(review.date || review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {index === 0 && (
                        <span className="inline-flex rounded-full border border-border-accent bg-on-surface-accent/10 px-3 py-1 text-[10px] font-semibold tracking-[0.26em] uppercase text-on-surface-accent">
                          Featured opinion
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
