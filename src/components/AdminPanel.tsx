import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Shield, ImageIcon } from 'lucide-react';
import { User } from '../types';
import { Liquor } from '../data';
import { usePhotos } from '../hooks/usePhotos';

interface AdminPanelProps {
  user: User | null;
  isAdmin: boolean;
  liquors: Liquor[];
}

export default function AdminPanel({ user, isAdmin, liquors }: AdminPanelProps) {
  const navigate = useNavigate();
  const { pendingPhotos, fetchPending, approvePhoto, rejectPhoto } = usePhotos();

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch pending photos
  useEffect(() => {
    if (isAdmin && user?.email) {
      fetchPending(user.email);
    }
  }, [isAdmin, user?.email, fetchPending]);

  if (!isAdmin || !user) return null;

  const getLiquorName = (liquorId: string) => {
    const liquor = liquors.find(b => b.id === liquorId);
    return liquor?.name || 'Unknown Liquor';
  };

  const handleApprove = async (photoId: string) => {
    await approvePhoto(photoId, user.email);
  };

  const handleReject = async (photoId: string) => {
    await rejectPhoto(photoId, user.email);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield size={24} className="text-on-surface-accent" />
          <h1 className="font-display text-4xl md:text-5xl font-normal text-on-surface">Admin Panel</h1>
        </div>
        <p className="text-on-surface-muted font-serif italic text-lg">Review and approve community-submitted liquor photos.</p>
      </div>

      {/* Pending count */}
      <div className="flex items-center justify-center gap-3">
        <ImageIcon size={16} className="text-on-surface-accent" />
        <span className="micro-label text-on-surface-accent">
          {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? 's' : ''} pending review
        </span>
      </div>

      {/* Pending Photos Grid */}
      {pendingPhotos.length === 0 ? (
        <div className="surface-raised border-dashed p-16 text-center">
          <CheckCircle size={32} className="text-on-surface-accent/30 mx-auto mb-4" />
          <p className="text-on-surface-muted font-serif italic text-lg">All caught up! No photos pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingPhotos.map(photo => (
            <div key={photo.id} className="surface-raised overflow-hidden group">
              {/* Photo */}
              <div className="aspect-square bg-surface-base overflow-hidden">
                <img
                  src={photo.blob_url}
                  alt="Pending liquor photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <button
                    onClick={() => navigate(`/liquor/${photo.bourbon_id}`)}
                    className="font-display text-lg text-on-surface hover:text-on-surface-accent transition-colors text-left"
                  >
                    {getLiquorName(photo.bourbon_id)}
                  </button>
                  <p className="micro-label text-on-surface-muted mt-1">
                    by {photo.user_name || photo.user_email} · {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(photo.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-on-surface-accent text-on-surface-invert text-xs font-semibold tracking-widest uppercase hover:bg-[#B08832] transition-colors"
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(photo.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 vintage-border text-on-surface-muted text-xs font-semibold tracking-widest uppercase hover:text-red-400 hover:border-red-400/50 transition-colors"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
