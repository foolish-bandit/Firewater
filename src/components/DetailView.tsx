import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Heart, CheckCircle, ChevronLeft } from 'lucide-react';
import { Star, Heart, CheckCircle, ChevronLeft, Share2, Edit2, Trash2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Bourbon } from '../data';
import { Review, User } from '../types';
import { getSimilarBourbons } from '../utils/bourbonUtils';
import BourbonCard from './BourbonCard';
import StatBox from './StatBox';

interface DetailViewProps {
  wantToTry: string[];
  tried: string[];
  toggleWantToTry: (id: string) => void;
  toggleTried: (id: string) => void;
  getReviewsForBourbon: (id: string) => Review[];
  onAddReview: (review: Omit<Review, 'id' | 'date' | 'userId' | 'userName' | 'userPicture'>) => void;
  onEditReview: (reviewId: string, updates: { rating?: number; text?: string }) => void;
  onDeleteReview: (reviewId: string) => void;
  user: User | null;
  bourbons: Bourbon[];
}

export default function DetailView({ wantToTry, tried, toggleWantToTry, toggleTried, getReviewsForBourbon, onAddReview, bourbons }: DetailViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
export default function DetailView({ id, onBack, onSelectSimilar, wantToTry, tried, toggleWantToTry, toggleTried, reviews, onAddReview, onEditReview, onDeleteReview, user, bourbons }: DetailViewProps) {
  const bourbon = bourbons.find((b: Bourbon) => b.id === id);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!id || !bourbon) return <div>Not found</div>;

  const reviews = getReviewsForBourbon(id);

  const handleShare = async () => {
    const shareData = {
      title: bourbon.name,
      text: `Check out ${bourbon.name} on Barrel Book`,
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

  const similar = useMemo(() => getSimilarBourbons(bourbon, bourbons), [bourbon, bourbons]);
  const isWanted = wantToTry.includes(id);
  const isTried = tried.includes(id);

  const flavorData = Object.entries(bourbon.flavorProfile).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 10,
  }));

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onAddReview({ bourbonId: id, rating, text: reviewText });
    setRating(0);
    setReviewText('');
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
        <span>Back to Catalog</span>
      </button>

      <div className="space-y-10">
          <div>
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex flex-col gap-2">
                {bourbon.source === 'community' && (
                  <span className="self-start px-2 py-1 bg-[#C89B3C]/20 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#C89B3C] border border-[#C89B3C]/30 rounded-sm">
                    Community Submission
                  </span>
                )}
                <h1 className="font-serif text-5xl md:text-6xl font-normal text-[#EAE4D9] leading-none">{bourbon.name}</h1>
              </div>
              <div className="flex items-center gap-4">
                {avgRating && (
                  <div className="flex items-center gap-2 bg-[#1A1816] vintage-border px-4 py-2">
                    <Star size={18} className="fill-[#C89B3C] text-[#C89B3C]" />
                    <span className="font-serif text-xl italic text-[#EAE4D9]">{avgRating}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="micro-label text-[#C89B3C] mb-6">{bourbon.distillery}</p>
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <button
                onClick={() => toggleWantToTry(id)}
                className={`flex items-center justify-center gap-3 py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-xs ${isWanted ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
              >
                <Heart size={16} className={isWanted ? "fill-current" : ""} />
                {isWanted ? 'Wanted' : 'Want to Try'}
              </button>
              <button
                onClick={() => toggleTried(id)}
                className={`flex items-center justify-center gap-3 py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-xs ${isTried ? 'bg-[#C89B3C]/10 border-[#C89B3C]/50 text-[#C89B3C]' : 'bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'}`}
              >
                <CheckCircle size={16} className={isTried ? "fill-current" : ""} />
                {isTried ? 'Tried It' : 'Mark Tried'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-3 py-4 vintage-border transition-all duration-300 font-sans font-semibold tracking-widest uppercase text-xs bg-transparent text-[#EAE4D9]/60 hover:text-[#C89B3C] hover:border-[#C89B3C]/30"
              >
                <Share2 size={16} />
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          <div className="w-16 h-px bg-[#C89B3C]/50"></div>

          <p className="text-[#EAE4D9]/70 text-lg leading-relaxed font-serif italic">{bourbon.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBox label="Region" value={bourbon.region} />
            <StatBox label="Proof" value={bourbon.proof} />
            <StatBox label="Age" value={bourbon.age} />
            <StatBox label="Price" value={`$${bourbon.price}`} />
          </div>

          <div className="bg-[#1A1816] vintage-border p-8 relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
            <h3 className="micro-label text-[#C89B3C] mb-3 relative z-10">Mash Bill</h3>
            <p className="text-[#EAE4D9] font-serif text-xl italic relative z-10">{bourbon.mashBill}</p>
          </div>

          {/* Flavor Profile Chart */}
          <div className="bg-[#1A1816] vintage-border p-8 relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
            <h3 className="micro-label text-[#C89B3C] mb-8 relative z-10">Flavor Profile</h3>
            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={flavorData}>
                  <PolarGrid stroke="rgba(234, 228, 217, 0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(234, 228, 217, 0.5)', fontSize: 11, fontFamily: 'Montserrat', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Radar name={bourbon.name} dataKey="A" stroke="#C89B3C" fill="#C89B3C" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C89B3C]/30 to-transparent my-16"></div>

      {/* Similar Bourbons */}
      <div className="space-y-8">
        <div className="text-center mb-10">
          <p className="micro-label text-[#C89B3C] mb-2">Explore</p>
          <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Similar Taste Profiles</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {similar.map(b => (
            <BourbonCard
              key={b.id}
              bourbon={b}
              onClick={() => { navigate(`/bourbon/${b.id}`); }}
              isWanted={wantToTry.includes(b.id)}
              isTried={tried.includes(b.id)}
              onToggleWant={(e: React.MouseEvent) => { e.stopPropagation(); toggleWantToTry(b.id); }}
              onToggleTried={(e: React.MouseEvent) => { e.stopPropagation(); toggleTried(b.id); }}
            />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C89B3C]/30 to-transparent my-16"></div>

      {/* Reviews Section */}
      <div className="space-y-10">
        <div className="text-center mb-10">
          <p className="micro-label text-[#C89B3C] mb-2">Thoughts</p>
          <h2 className="font-serif text-4xl font-normal text-[#EAE4D9]">Community Reviews</h2>
        </div>

        <div className="bg-[#1A1816] vintage-border p-8 relative">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
          <h3 className="font-serif text-2xl text-[#EAE4D9] mb-6 relative z-10">Leave a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-6 relative z-10">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${star <= rating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210] hover:text-[#C89B3C]/50'}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think of this pour?"
              className="w-full bg-[#141210] vintage-border p-5 text-[#EAE4D9] placeholder-[#EAE4D9]/30 focus:outline-none focus:border-[#C89B3C] min-h-[120px] font-serif italic text-lg resize-none"
            />
            <button
              type="submit"
              disabled={rating === 0}
              className="px-8 py-3 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#C89B3C] disabled:hover:border-[rgba(234,228,217,0.15)] text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-sm transition-all duration-300"
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
              <div key={review.id} className="bg-[#1A1816] vintage-border p-6 space-y-4">
                {editingId === review.id ? (
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${star <= editRating ? 'fill-[#C89B3C] text-[#C89B3C]' : 'text-[#141210] hover:text-[#C89B3C]/50'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-[#141210] vintage-border p-5 text-[#EAE4D9] placeholder-[#EAE4D9]/30 focus:outline-none focus:border-[#C89B3C] min-h-[120px] font-serif italic text-lg resize-none"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={saveEdit}
                        disabled={editRating === 0}
                        className="px-6 py-2 bg-transparent vintage-border hover:bg-[#C89B3C] hover:text-[#141210] hover:border-[#C89B3C] disabled:opacity-50 text-[#C89B3C] font-sans font-semibold tracking-widest uppercase text-xs transition-all duration-300"
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
                    <div className="flex items-center justify-between border-b border-[#EAE4D9]/10 pb-4">
                      <div className="flex items-center gap-3">
                        {review.userPicture && (
                          <img src={review.userPicture} alt={review.userName || ''} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                        )}
                        {review.userName && (
                          <span className="text-sm font-sans text-[#EAE4D9]/60">{review.userName}</span>
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
                              className="text-[#EAE4D9]/30 hover:text-[#C89B3C] transition-colors"
                              title="Edit review"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingId(review.id)}
                              className="text-[#EAE4D9]/30 hover:text-[#C89B3C] transition-colors"
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
                    {review.text && <p className="text-[#EAE4D9]/80 font-serif italic leading-relaxed">{review.text}</p>}
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
