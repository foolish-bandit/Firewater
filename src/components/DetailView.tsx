import React, { useState, useMemo, useRef } from 'react';
import PageTransition from './PageTransition';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, CheckCircle, ChevronLeft, Share2, Edit2, Trash2, MapPin, Flame, Clock, DollarSign, XCircle, X } from 'lucide-react';
import { SignInButton } from '@clerk/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Liquor } from '../data';
import { Review, User } from '../types';
import { getSimilarLiquors } from '../utils/liquorUtils';
import { getFlavorSummary, getSortedFlavorEntries } from '../utils/flavorStory';
import LiquorCard from './LiquorCard';
import StatBox from './StatBox';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import { usePhotoUrl } from '../contexts/PhotoContext';
import { hapticTap, hapticImpact } from '../lib/capacitor';

const REVIEW_TAGS = [
  'Neat', 'On the Rocks', 'With Water', 'In a Cocktail',
  'Daily Sipper', 'Special Occasion', 'Gift-Worthy',
  'Great Value', 'Top Shelf', 'Barrel Proof Lover',
] as const;

interface DetailViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  getReviewsForLiquor: (id: string) => Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'userId' | 'userName' | 'userPicture'>) => void;
  onEditReview: (reviewId: string, updates: { rating?: number; text?: string }) => void;
  onDeleteReview: (reviewId: string) => void;
  user: User | null;
  liquors: Liquor[];
  deleteCustomLiquor?: (id: string) => void;
  showToast?: (msg: string) => void;
}

function getTopFlavors(liquor: Liquor, count: number = 3): string[] {
  const entries = Object.entries(liquor.flavorProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count).map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
}

export default function DetailView({ wantToTry, tried, toggleWantToTry, toggleTried, getReviewsForLiquor, onAddReview, onEditReview, onDeleteReview, user, liquors, deleteCustomLiquor, showToast }: DetailViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const liquor = liquors.find((b: Liquor) => b.id === id);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'quick' | 'tasting'>('quick');
  const [nose, setNose] = useState('');
  const [palate, setPalate] = useState('');
  const [finish, setFinish] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  const photoUrl = usePhotoUrl(id ?? '');

  if (!id || !liquor) return <div className="text-center py-20 text-on-surface-muted font-serif italic text-xl">Liquor not found</div>;

  const reviews = getReviewsForLiquor(id);
  const topFlavors = getTopFlavors(liquor);
  const flavorHighlights = useMemo(() => getSortedFlavorEntries(liquor.flavorProfile).slice(0, 3), [liquor]);
  const flavorSummary = useMemo(() => getFlavorSummary(liquor.flavorProfile), [liquor]);

  const handleShare = async () => {
    const shareData = {
      title: liquor.name,
      text: `Check out ${liquor.name} on FIREWATER`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startEditing = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditText(review.text);
  };

  const saveEdit = () => {
    if (!editingId || editRating === 0) return;
    onEditReview(editingId, { rating: editRating, text: editText });
    setEditingId(null);
  };

  const confirmDelete = (reviewId: string) => {
    onDeleteReview(reviewId);
    setDeletingId(null);
  };

  const isOwnReview = (review: Review) => {
    if (user) return review.userId === user.id;
    return !review.userId;
  };

  const similar = useMemo(() => getSimilarLiquors(liquor, liquors), [liquor, liquors]);
  const isWanted = wantToTry.includes(id);
  const isTried = tried.includes(id);
  const hasUserReview = user ? reviews.some(r => r.userId === user.id) : false;
  const showReviewNudge = isTried && !!user && !hasUserReview && !nudgeDismissed;

  const flavorData = Object.entries(liquor.flavorProfile).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 10,
  }));

  const reviewValid = rating > 0 && (
    reviewMode === 'quick'
      ? reviewText.trim().length > 0
      : (nose.trim().length > 0 || palate.trim().length > 0 || finish.trim().length > 0)
  );

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewValid) return;
    hapticTap();
    if (reviewMode === 'tasting') {
      onAddReview({ liquorId: id, rating, text: '', nose, palate, finish, tags: selectedTags.length > 0 ? selectedTags : undefined });
      setNose('');
      setPalate('');
      setFinish('');
    } else {
      onAddReview({ liquorId: id, rating, text: reviewText, tags: selectedTags.length > 0 ? selectedTags : undefined });
      setReviewText('');
    }
    hapticImpact();
    setRating(0);
    setSelectedTags([]);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <PageTransition><div className="flex flex-col">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-on-surface-muted hover:text-on-surface-accent transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      {photoUrl && (
        <div className="w-full max-h-64 overflow-hidden bg-surface-raised rounded-lg mt-4">
          <img
            src={photoUrl}
            alt={liquor.name}
            loading="lazy"
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {/* Hero Header */}
      <div className="relative mb-hero">
        {/* Proof watermark */}
        <div className="absolute -top-4 right-0 font-serif text-[80px] sm:text-[120px] md:text-[180px] leading-none text-on-surface opacity-[0.03] select-none pointer-events-none overflow-hidden">
          {liquor.proof}
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              {liquor.source === 'community' && (
                <span className="self-start px-2 py-1 bg-on-surface-accent/20 text-[10px] font-sans font-semibold tracking-widest uppercase text-on-surface-accent border border-border-accent rounded-sm">
                  Community Submission
                </span>
              )}
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-on-surface leading-none">{liquor.name}</h1>
            </div>
            {avgRating && (
              <div className="flex items-center gap-2 surface-raised px-4 py-2 self-start shrink-0">
                <Star size={18} className="fill-on-surface-accent text-on-surface-accent" />
                <span className="font-serif text-xl italic text-on-surface">{avgRating}</span>
                <span className="text-on-surface-muted text-xs">({reviews.length})</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-8 xl:gap-10 items-start">
            <PhotoGallery liquorId={id} liquor={liquor} />

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="micro-label text-on-surface-accent">{liquor.distillery}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 surface-raised text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-accent">
                    {liquor.type}
                  </span>
                  <span className="px-3 py-1 border border-border-subtle rounded-full text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-muted">
                    {liquor.region}
                  </span>
                  <span className="px-3 py-1 border border-border-subtle rounded-full text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-muted">
                    {liquor.age}
                  </span>
                </div>
              </div>

              <p className="text-on-surface-secondary text-lg leading-relaxed font-serif italic">{liquor.description}</p>

              <div>
                <p className="micro-label text-on-surface-accent mb-3">Primary tasting notes</p>
                <div className="flex flex-wrap gap-2">
                  {topFlavors.map(flavor => (
                    <span key={flavor} className="px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.22em] uppercase text-on-surface-secondary border border-border-subtle rounded-full bg-surface-raised/60">
                      {flavor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl">
                <button
                  onClick={() => { hapticTap(); toggleWantToTry(id); }}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs ${isWanted ? 'icon-toggle-active' : 'icon-toggle'}`}
                >
                  <Heart size={16} className={isWanted ? "fill-current" : ""} />
                  <span className="hidden xs:inline">{isWanted ? 'Wanted' : 'Want'}</span>
                </button>
                <button
                  onClick={() => { hapticTap(); toggleTried(id); }}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs ${isTried ? 'icon-toggle-active' : 'icon-toggle'}`}
                >
                  <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
                  <span className="hidden xs:inline">{isTried ? 'Tried' : 'Tried?'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs icon-toggle"
                >
                  <Share2 size={16} />
                  <span className="hidden xs:inline">{copied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              {liquor.source === 'community' && deleteCustomLiquor && (
                <button
                  onClick={() => {
                    deleteCustomLiquor(id);
                    showToast?.('Submission removed');
                    navigate('/catalog');
                  }}
                  className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs font-sans font-semibold tracking-widest uppercase flex items-center gap-2"
                >
                  <XCircle size={14} />
                  Remove this submission
                </button>
              )}

              <div className="mt-2">
                <PhotoUpload liquorId={id} user={user} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-divider mt-subsection" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-subsection">
        <StatBox label="Region" value={liquor.region} icon={MapPin} />
        <StatBox label="Proof" value={liquor.proof} icon={Flame} />
        <StatBox label="Age" value={liquor.age} icon={Clock} />
        <StatBox label="Price" value={`$${liquor.price}`} icon={DollarSign} />
      </div>

      {/* Two-column: Mash Bill + Dominant Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-subsection">
        {/* Mash Bill */}
        <div className="surface-raised p-5 sm:p-8">
          <h3 className="micro-label text-on-surface-accent mb-3">Mash Bill</h3>
          <p className="text-on-surface font-serif text-xl italic">{liquor.mashBill}</p>
          {liquor.mashBillDetail && (
            <p className="text-on-surface-muted text-sm mt-3 font-serif italic">{liquor.mashBillDetail}</p>
          )}
        </div>

        {/* Dominant Flavors */}
        <div className="surface-raised p-5 sm:p-8">
          <h3 className="micro-label text-on-surface-accent mb-3">Dominant Notes</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {topFlavors.map(flavor => (
              <span key={flavor} className="px-3 py-1 text-xs font-sans font-medium tracking-wider uppercase text-on-surface-accent border border-border-accent bg-on-surface-accent/5 rounded-full">
                {flavor}
              </span>
            ))}
          </div>
          <p className="text-on-surface-muted text-sm font-serif italic">
            Primary character: {topFlavors.join(', ')}
          </p>
        </div>
      </div>

      {/* Flavor Profile Chart */}
      <div className="surface-raised p-5 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <h3 className="micro-label text-on-surface-accent mb-3">Flavor Profile</h3>
            <p className="font-serif text-xl italic text-on-surface">{flavorSummary}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {flavorHighlights.map((flavor, index) => (
                <div key={flavor.key} className="bg-surface-base border border-border-subtle rounded-sm p-3">
                  <p className="text-[10px] font-sans font-semibold tracking-[0.25em] uppercase text-on-surface-muted">
                    Top {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-sans font-semibold tracking-wider uppercase text-on-surface-accent">
                    {flavor.label}
                  </p>
                  <p className="mt-2 text-on-surface-muted text-xs">{flavor.value.toFixed(1)}/10 intensity</p>
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {flavorHighlights.map((flavor) => (
              <div key={flavor.key} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-sans tracking-widest uppercase">
                  <span className="text-on-surface-muted">{flavor.label}</span>
                  <span className="text-on-surface-accent">{flavor.value.toFixed(1)}/10</span>
                </div>
                <div className="h-2 rounded-full bg-surface-base overflow-hidden">
                  <div className="h-full rounded-full bg-on-surface-accent/80" style={{ width: `${(flavor.value / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-border-subtle pt-6">
          <p className="micro-label text-on-surface-muted mb-3">Radar chart for enthusiast depth</p>
          <div className="hidden md:block h-[350px] md:h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorData}>
                <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.5)', fontSize: 11, fontFamily: 'Montserrat', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Radar name={liquor.name} dataKey="A" stroke="var(--text-accent)" fill="var(--text-accent)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:hidden h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={flavorData}>
                <PolarGrid stroke="rgba(234, 228, 217, 0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.35)', fontSize: 9, fontFamily: 'Montserrat' }} />
                <Radar name={liquor.name} dataKey="A" stroke="var(--text-accent)" fill="var(--text-accent)" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="section-divider mt-section" />

      {/* Similar Liquors */}
      <div className="space-y-8">
        <div className="text-center mb-10">
          <p className="micro-label text-on-surface-accent mb-2">Explore</p>
          <h2 className="font-serif text-4xl font-normal text-on-surface">Similar Taste Profiles</h2>
        </div>
        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {similar.map(b => (
            <LiquorCard
              key={b.id}
              liquor={b}
              onClick={() => { navigate(`/liquor/${b.id}`); }}
              isWanted={wantToTry.includes(b.id)}
              isTried={tried.includes(b.id)}
              onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
              onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
            />
          ))}
        </div>
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
          {similar.map(b => (
            <div key={b.id} className="min-w-[280px] snap-start">
              <LiquorCard
                liquor={b}
                onClick={() => { navigate(`/liquor/${b.id}`); }}
                isWanted={wantToTry.includes(b.id)}
                isTried={tried.includes(b.id)}
                onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
                onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="section-divider mt-section" />

      {/* Review nudge banner */}
      {showReviewNudge && (
        <div className="bg-on-surface-accent/10 vintage-border p-4 sm:p-5 mt-subsection flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <p className="font-serif text-on-surface text-base sm:text-lg italic">You've tasted this one — how was it?</p>
            <button
              onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="btn btn-primary btn-sm px-4 py-2 shrink-0"
            >
              Write a Review
            </button>
          </div>
          <button
            onClick={() => setNudgeDismissed(true)}
            className="text-on-surface-muted hover:text-on-surface-accent transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-10 mt-subsection">
        <div className="flex items-center justify-between">
          <div>
            <p className="micro-label text-on-surface-accent mb-2">Thoughts</p>
            <h2 className="font-serif text-4xl font-normal text-on-surface">Reviews</h2>
          </div>
          {avgRating && (
            <div className="text-right">
              <div className="flex gap-1 justify-end mb-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} className={star <= Math.round(parseFloat(avgRating)) ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface-invert'} />
                ))}
              </div>
              <p className="micro-label text-on-surface-muted">{avgRating} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Review form with gold wash */}
        <div ref={reviewFormRef} className="bg-on-surface-accent/5 vintage-border p-5 sm:p-8">
          <h3 className="font-serif text-2xl text-on-surface mb-4 sm:mb-6">Leave a Review</h3>

          {/* Mode toggle tabs */}
          <div className="flex gap-1 surface-raised p-1 mb-4 sm:mb-6 self-start w-fit">
            <button
              type="button"
              onClick={() => setReviewMode('quick')}
              className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
                reviewMode === 'quick'
                  ? 'seg-item seg-item-active'
                  : 'seg-item'
              }`}
            >
              Quick Review
            </button>
            <button
              type="button"
              onClick={() => setReviewMode('tasting')}
              className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
                reviewMode === 'tasting'
                  ? 'seg-item seg-item-active'
                  : 'seg-item'
              }`}
            >
              Tasting Notes
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4 sm:space-y-6">
            <div className="flex gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 p-1"
                  aria-label={`Rate ${star} out of 5`}
                >
                  <Star
                    size={28}
                    className={`sm:w-8 sm:h-8 transition-colors ${star <= rating ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface-invert hover:text-on-surface-accent/50'}`}
                  />
                </button>
              ))}
            </div>

            {/* Tag selector */}
            <div>
              <p className="micro-label text-on-surface-accent mb-2">How'd you drink it?</p>
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`px-3 py-1.5 text-[10px] font-sans font-semibold tracking-wider uppercase rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'badge badge-accent'
                          : 'badge badge-muted hover:border-border-default hover:text-on-surface-secondary'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {reviewMode === 'quick' ? (
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think of this pour?"
                className="w-full textarea-base p-4 sm:p-5 min-h-[100px] sm:min-h-[120px] font-serif italic text-base sm:text-lg resize-none"
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="micro-label text-on-surface-accent mb-1.5 block">Nose</label>
                  <textarea
                    value={nose}
                    onChange={(e) => setNose(e.target.value)}
                    placeholder="Aroma — what do you smell?"
                    className="w-full textarea-base p-3 sm:p-4 min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
                <div>
                  <label className="micro-label text-on-surface-accent mb-1.5 block">Palate</label>
                  <textarea
                    value={palate}
                    onChange={(e) => setPalate(e.target.value)}
                    placeholder="Taste — what flavors come through?"
                    className="w-full textarea-base p-3 sm:p-4 min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
                <div>
                  <label className="micro-label text-on-surface-accent mb-1.5 block">Finish</label>
                  <textarea
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    placeholder="Finish — how does it linger?"
                    className="w-full textarea-base p-3 sm:p-4 min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!reviewValid}
              className="btn btn-primary px-8 py-3 font-sans font-semibold tracking-widest uppercase text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              Post Review
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <Star size={40} className="text-on-surface-accent/30 mb-5" />
              <h3 className="font-serif text-xl text-on-surface mb-2">No reviews yet</h3>
              <p className="text-on-surface-muted text-sm mb-6 max-w-xs">Be the first to share your tasting notes on this bottle.</p>
              {user ? (
                <button
                  onClick={() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="btn btn-secondary"
                >
                  Write a Review
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="btn btn-secondary">Sign in to review</button>
                </SignInButton>
              )}
            </div>
          ) : (
            reviews.map((review: Review) => (
              <div key={review.id} className="surface-raised p-4 sm:p-6 space-y-4">
                {editingId === review.id ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110 p-1"
                        >
                          <Star
                            size={28}
                            className={`sm:w-8 sm:h-8 transition-colors ${star <= editRating ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface-invert hover:text-on-surface-accent/50'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full textarea-base p-4 sm:p-5 min-h-[100px] sm:min-h-[120px] font-serif italic text-base sm:text-lg resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={saveEdit}
                        disabled={editRating === 0}
                        className="btn btn-primary px-6 py-2 font-sans font-semibold tracking-widest uppercase text-xs disabled:opacity-50 transition-all duration-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-6 py-2 text-on-surface-muted hover:text-on-surface font-sans font-semibold tracking-widest uppercase text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-b border-border-subtle pb-4">
                      <div className="flex items-center gap-3">
                        {review.userId ? (
                          <button
                            onClick={() => navigate(`/profile/${review.userId}`)}
                            className="flex items-center gap-2 group"
                          >
                            {review.userPicture && (
                              <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full group-hover:ring-1 group-hover:ring-on-surface-accent transition-all" referrerPolicy="no-referrer" />
                            )}
                            {review.userName && (
                              <span className="text-sm font-sans text-on-surface-muted group-hover:text-on-surface-accent transition-colors">{review.userName}</span>
                            )}
                          </button>
                        ) : (
                          <>
                            {review.userPicture && (
                              <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                            )}
                            {review.userName && (
                              <span className="text-sm font-sans text-on-surface-muted">{review.userName}</span>
                            )}
                          </>
                        )}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= review.rating ? 'fill-on-surface-accent text-on-surface-accent' : 'text-on-surface-invert'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="micro-label text-on-surface-muted">{new Date(review.date).toLocaleDateString()}</span>
                        {isOwnReview(review) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(review)}
                              className="text-on-surface-muted hover:text-on-surface-accent transition-colors"
                              title="Edit review"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingId(review.id)}
                              className="text-on-surface-muted hover:text-on-surface-accent transition-colors"
                              title="Delete review"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {deletingId === review.id && (
                      <div className="flex items-center gap-4 py-2">
                        <span className="text-sm font-serif italic text-on-surface-muted">Delete this note?</span>
                        <button
                          onClick={() => confirmDelete(review.id)}
                          className="px-4 py-1 text-xs font-semibold tracking-widest uppercase btn btn-secondary transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-1 text-xs font-semibold tracking-widest uppercase text-on-surface-muted hover:text-on-surface transition-colors"
                        >
                          No
                        </button>
                      </div>
                    )}
                    {(review.nose || review.palate || review.finish) ? (
                      <div className="space-y-2">
                        {review.nose && (
                          <div>
                            <span className="micro-label text-on-surface-accent">Nose</span>
                            <p className="text-on-surface-secondary font-serif italic leading-relaxed mt-0.5">{review.nose}</p>
                          </div>
                        )}
                        {review.palate && (
                          <div>
                            <span className="micro-label text-on-surface-accent">Palate</span>
                            <p className="text-on-surface-secondary font-serif italic leading-relaxed mt-0.5">{review.palate}</p>
                          </div>
                        )}
                        {review.finish && (
                          <div>
                            <span className="micro-label text-on-surface-accent">Finish</span>
                            <p className="text-on-surface-secondary font-serif italic leading-relaxed mt-0.5">{review.finish}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      review.text && <p className="text-on-surface-secondary font-serif italic leading-relaxed">{review.text}</p>
                    )}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {review.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-wider uppercase text-on-surface-accent border border-border-accent rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div></PageTransition>
  );
}
