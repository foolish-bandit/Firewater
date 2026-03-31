import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, CheckCircle, ChevronLeft, Share2, Edit2, Trash2, MapPin, Flame, Clock, DollarSign, GitCompareArrows } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Liquor } from '../data';
import { Review, User } from '../types';
import { getSimilarLiquors } from '../utils/liquorUtils';
import { getFlavorSummary, getSortedFlavorEntries } from '../utils/flavorStory';
import LiquorCard from './LiquorCard';
import StatBox from './StatBox';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';

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
}

function getTopFlavors(liquor: Liquor, count: number = 3): string[] {
  const entries = Object.entries(liquor.flavorProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, count).map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
}

export default function DetailView({ wantToTry, tried, toggleWantToTry, toggleTried, getReviewsForLiquor, onAddReview, onEditReview, onDeleteReview, user, liquors }: DetailViewProps) {
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

  if (!id || !liquor) return <div className="text-center py-20 text-[#EAE4D9]/40 font-serif italic text-xl">Liquor not found</div>;

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
    if (reviewMode === 'tasting') {
      onAddReview({ liquorId: id, rating, text: '', nose, palate, finish, tags: selectedTags.length > 0 ? selectedTags : undefined });
      setNose('');
      setPalate('');
      setFinish('');
    } else {
      onAddReview({ liquorId: id, rating, text: reviewText, tags: selectedTags.length > 0 ? selectedTags : undefined });
      setReviewText('');
    }
    setRating(0);
    setSelectedTags([]);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-[#EAE4D9]/60 hover:text-[#C89B3C] transition-colors group font-sans font-semibold tracking-widest uppercase text-xs"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
        <span>Back</span>
      </button>

      {/* Hero Header */}
      <div className="relative">
        {/* Proof watermark */}
        <div className="absolute -top-4 right-0 font-serif text-[80px] sm:text-[120px] md:text-[180px] leading-none text-[#EAE4D9] opacity-[0.03] select-none pointer-events-none overflow-hidden">
          {liquor.proof}
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              {liquor.source === 'community' && (
                <span className="self-start px-2 py-1 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] border border-[#C89B3C]/30 rounded-sm">
                  Community Submission
                </span>
              )}
              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#EAE4D9] leading-none">{liquor.name}</h1>
            </div>
            {avgRating && (
              <div className="flex items-center gap-2 bg-[#1A1816] vintage-border px-4 py-2 self-start shrink-0">
                <Star size={18} className="fill-[#C89B3C] text-[#C89B3C]" />
                <span className="font-serif text-xl italic text-[#EAE4D9]">{avgRating}</span>
                <span className="text-[#EAE4D9]/40 text-xs">({reviews.length})</span>
              </div>
            )}
          </div>
          <p className="micro-label text-[#C89B3C]">{liquor.distillery}</p>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg">
            <button
              onClick={() => toggleWantToTry(id)}
              className={`flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs ${isWanted ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
            >
              <Heart size={16} className={isWanted ? "fill-current" : ""} />
              <span className="hidden xs:inline">{isWanted ? 'Wanted' : 'Want'}</span>
            </button>
            <button
              onClick={() => toggleTried(id)}
              className={`flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs ${isTried ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
            >
              <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
              <span className="hidden xs:inline">{isTried ? 'Tried' : 'Tried?'}</span>
            </button>
            <button
              onClick={() => navigate(`/compare?add=${id}`)}
              className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30"
            >
              <GitCompareArrows size={16} />
              <span className="hidden xs:inline">Compare</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-[10px] sm:text-xs bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30"
            >
              <Share2 size={16} />
              <span className="hidden xs:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          {/* Photo upload */}
          <div className="mt-4">
            <PhotoUpload liquorId={id} user={user} />
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* Description */}
      <p className="text-[#EAE4D9]/70 text-lg leading-relaxed font-serif italic">{liquor.description}</p>

      {/* Community Photos */}
      <PhotoGallery liquorId={id} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Region" value={liquor.region} icon={MapPin} />
        <StatBox label="Proof" value={liquor.proof} icon={Flame} />
        <StatBox label="Age" value={liquor.age} icon={Clock} />
        <StatBox label="Price" value={`$${liquor.price}`} icon={DollarSign} />
      </div>

      {/* Two-column: Mash Bill + Flavor Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mash Bill */}
        <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
          <h3 className="micro-label text-[#C89B3C] mb-3">Mash Bill</h3>
          <p className="text-[#EAE4D9] font-serif text-xl italic">{liquor.mashBill}</p>
          {liquor.mashBillDetail && (
            <p className="text-[#EAE4D9]/50 text-sm mt-3 font-serif italic">{liquor.mashBillDetail}</p>
          )}
        </div>

        {/* Dominant Flavors */}
        <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
          <h3 className="micro-label text-[#C89B3C] mb-3">Dominant Notes</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {topFlavors.map(flavor => (
              <span key={flavor} className="px-3 py-1 text-xs font-sans font-medium tracking-wider uppercase text-[#C89B3C] border border-[#C89B3C]/30 bg-[#C89B3C]/5 rounded-full">
                {flavor}
              </span>
            ))}
          </div>
          <p className="text-[#EAE4D9]/50 text-sm font-serif italic">
            Primary character: {topFlavors.join(', ')}
          </p>
        </div>
      </div>

      {/* Flavor Profile Chart */}
      <div className="bg-[#1A1816] vintage-border p-5 sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <h3 className="micro-label text-[#C89B3C] mb-3">Flavor Profile</h3>
            <p className="font-serif text-xl italic text-[#EAE4D9]">{flavorSummary}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {flavorHighlights.map((flavor, index) => (
                <div key={flavor.key} className="bg-[#141210] border border-[#EAE4D9]/10 rounded-sm p-3">
                  <p className="text-[10px] font-sans font-semibold tracking-[0.25em] uppercase text-[#EAE4D9]/35">
                    Top {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-sans font-semibold tracking-wider uppercase text-[#C89B3C]">
                    {flavor.label}
                  </p>
                  <p className="mt-2 text-[#EAE4D9]/55 text-xs">{flavor.value.toFixed(1)}/10 intensity</p>
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {flavorHighlights.map((flavor) => (
              <div key={flavor.key} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-sans tracking-widest uppercase">
                  <span className="text-[#EAE4D9]/55">{flavor.label}</span>
                  <span className="text-[#C89B3C]">{flavor.value.toFixed(1)}/10</span>
                </div>
                <div className="h-2 rounded-full bg-[#141210] overflow-hidden">
                  <div className="h-full rounded-full bg-[#C89B3C]/80" style={{ width: `${(flavor.value / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-[#EAE4D9]/10 pt-6">
          <p className="micro-label text-[#EAE4D9]/35 mb-3">Radar chart for enthusiast depth</p>
          <div className="hidden md:block h-[350px] md:h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorData}>
                <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.5)', fontSize: 11, fontFamily: 'Montserrat', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <Radar name={liquor.name} dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="md:hidden h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={flavorData}>
                <PolarGrid stroke="rgba(234, 228, 217, 0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.35)', fontSize: 9, fontFamily: 'Montserrat' }} />
                <Radar name={liquor.name} dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* Similar Liquors */}
      <div className="space-y-8">
        <div className="text-center mb-10">
          <p className="micro-label text-[#C89B3C] mb-2">Explore</p>
          <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Similar Taste Profiles</h2>
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

      <div className="section-divider" />

      {/* Reviews Section */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="micro-label text-[#C89B3C] mb-2">Thoughts</p>
            <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Reviews</h2>
          </div>
          {avgRating && (
            <div className="text-right">
              <div className="flex gap-1 justify-end mb-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} className={star <= Math.round(parseFloat(avgRating)) ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210]'} />
                ))}
              </div>
              <p className="micro-label text-[#EAE4D9]/40">{avgRating} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Review form with gold wash */}
        <div className="bg-[#C89B3C]/5 vintage-border p-5 sm:p-8">
          <h3 className="font-serif text-2xl text-[#EAE4D9] mb-4 sm:mb-6">Leave a Review</h3>

          {/* Mode toggle tabs */}
          <div className="flex gap-1 bg-[#1A1816] vintage-border p-1 mb-4 sm:mb-6 self-start w-fit">
            <button
              type="button"
              onClick={() => setReviewMode('quick')}
              className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
                reviewMode === 'quick'
                  ? 'bg-[#C89B3C] text-[#141210]'
                  : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'
              }`}
            >
              Quick Review
            </button>
            <button
              type="button"
              onClick={() => setReviewMode('tasting')}
              className={`px-3 sm:px-6 py-2.5 text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase transition-all duration-300 ${
                reviewMode === 'tasting'
                  ? 'bg-[#C89B3C] text-[#141210]'
                  : 'text-[#EAE4D9]/60 hover:text-[#EAE4D9]'
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
                    className={`sm:w-8 sm:h-8 transition-colors ${star <= rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210] hover:text-[#C89B3C]/50'}`}
                  />
                </button>
              ))}
            </div>

            {/* Tag selector */}
            <div>
              <p className="micro-label text-[#C89B3C] mb-2">How'd you drink it?</p>
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
                          ? 'bg-[#C89B3C] text-[#141210]'
                          : 'border border-[#EAE4D9]/20 text-[#EAE4D9]/60 hover:border-[#EAE4D9]/40 hover:text-[#EAE4D9]/80'
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
                className="w-full bg-[#141210] vintage-border p-4 sm:p-5 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[100px] sm:min-h-[120px] font-serif italic text-base sm:text-lg resize-none"
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="micro-label text-[#C89B3C] mb-1.5 block">Nose</label>
                  <textarea
                    value={nose}
                    onChange={(e) => setNose(e.target.value)}
                    placeholder="Aroma — what do you smell?"
                    className="w-full bg-[#141210] vintage-border p-3 sm:p-4 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
                <div>
                  <label className="micro-label text-[#C89B3C] mb-1.5 block">Palate</label>
                  <textarea
                    value={palate}
                    onChange={(e) => setPalate(e.target.value)}
                    placeholder="Taste — what flavors come through?"
                    className="w-full bg-[#141210] vintage-border p-3 sm:p-4 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
                <div>
                  <label className="micro-label text-[#C89B3C] mb-1.5 block">Finish</label>
                  <textarea
                    value={finish}
                    onChange={(e) => setFinish(e.target.value)}
                    placeholder="Finish — how does it linger?"
                    className="w-full bg-[#141210] vintage-border p-3 sm:p-4 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[60px] sm:min-h-[80px] font-serif italic text-base sm:text-lg resize-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!reviewValid}
              className="px-8 py-3 bg-[#C89B3C] text-[#141210] font-sans font-semibold tracking-widest uppercase text-sm hover:bg-[#B08832] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              Post Review
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-[#EAE4D9]/40 italic font-serif text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review: Review) => (
              <div key={review.id} className="bg-[#1A1816] vintage-border p-4 sm:p-6 space-y-4">
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
                            className={`sm:w-8 sm:h-8 transition-colors ${star <= editRating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210] hover:text-[#C89B3C]/50'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#141210] vintage-border p-4 sm:p-5 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[100px] sm:min-h-[120px] font-serif italic text-base sm:text-lg resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={saveEdit}
                        disabled={editRating === 0}
                        className="px-6 py-2 bg-[#C89B3C] text-[#141210] font-sans font-semibold tracking-widest uppercase text-xs hover:bg-[#B08832] disabled:opacity-50 transition-all duration-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-6 py-2 text-[#EAE4D9]/60 hover:text-[#EAE4D9] font-sans font-semibold tracking-widest uppercase text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 border-b border-[#EAE4D9]/10 pb-4">
                      <div className="flex items-center gap-3">
                        {review.userId ? (
                          <button
                            onClick={() => navigate(`/profile/${review.userId}`)}
                            className="flex items-center gap-2 group"
                          >
                            {review.userPicture && (
                              <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full group-hover:ring-1 group-hover:ring-[#C89B3C] transition-all" referrerPolicy="no-referrer" />
                            )}
                            {review.userName && (
                              <span className="text-sm font-sans text-[#EAE4D9]/60 group-hover:text-[#C89B3C] transition-colors">{review.userName}</span>
                            )}
                          </button>
                        ) : (
                          <>
                            {review.userPicture && (
                              <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                            )}
                            {review.userName && (
                              <span className="text-sm font-sans text-[#EAE4D9]/60">{review.userName}</span>
                            )}
                          </>
                        )}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= review.rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210]'}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="micro-label text-[#EAE4D9]/40">{new Date(review.date).toLocaleDateString()}</span>
                        {isOwnReview(review) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(review)}
                              className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
                              title="Edit review"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingId(review.id)}
                              className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors"
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
                        <span className="text-sm font-serif italic text-[#EAE4D9]/60">Delete this note?</span>
                        <button
                          onClick={() => confirmDelete(review.id)}
                          className="px-4 py-1 text-xs font-semibold tracking-widest uppercase vintage-border text-[#C89B3C] hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-4 py-1 text-xs font-semibold tracking-widest uppercase text-[#EAE4D9]/60 hover:text-[#EAE4D9] transition-colors"
                        >
                          No
                        </button>
                      </div>
                    )}
                    {(review.nose || review.palate || review.finish) ? (
                      <div className="space-y-2">
                        {review.nose && (
                          <div>
                            <span className="micro-label text-[#C89B3C]">Nose</span>
                            <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed mt-0.5">{review.nose}</p>
                          </div>
                        )}
                        {review.palate && (
                          <div>
                            <span className="micro-label text-[#C89B3C]">Palate</span>
                            <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed mt-0.5">{review.palate}</p>
                          </div>
                        )}
                        {review.finish && (
                          <div>
                            <span className="micro-label text-[#C89B3C]">Finish</span>
                            <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed mt-0.5">{review.finish}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      review.text && <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed">{review.text}</p>
                    )}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {review.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-wider uppercase text-[#C89B3C]/70 border border-[#C89B3C]/20 rounded-full">
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
    </div>
  );
}
