import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Shield, ImageIcon, Database, Users, Trash2 } from 'lucide-react';
import { User } from '../types';
import { Liquor } from '../data';
import { usePhotos } from '../hooks/usePhotos';
import { apiFetch } from '../api';

interface AdminPanelProps {
  user: User | null;
  isAdmin: boolean;
  liquors: Liquor[];
  deleteCustomLiquor: (id: string) => void;
}

export default function AdminPanel({ user, isAdmin, liquors, deleteCustomLiquor }: AdminPanelProps) {
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

  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);

  const runMigrations = async () => {
    setMigrationLoading(true);
    setMigrationStatus(null);
    try {
      const res = await apiFetch('/api/migrate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMigrationStatus(`Error: ${data.error || 'Migration failed'}`);
      } else if (data.message) {
        setMigrationStatus(data.message);
      } else if (data.results) {
        const summary = data.results.map((r: any) => `${r.id}: ${r.status}`).join('\n');
        setMigrationStatus(summary);
      }
    } catch {
      setMigrationStatus('Network error — could not run migrations.');
    } finally {
      setMigrationLoading(false);
    }
  };

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

      {/* Community Submissions */}
      {(() => {
        const communityLiquors = liquors.filter(l => l.source === 'community');
        return (
          <div className="surface-raised p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-on-surface-accent" />
              <h2 className="font-display text-xl text-on-surface">Community Submissions</h2>
            </div>
            <p className="micro-label text-on-surface-muted">
              {communityLiquors.length} community submission{communityLiquors.length !== 1 ? 's' : ''}
            </p>
            {communityLiquors.length === 0 ? (
              <div className="vintage-border border-dashed p-8 text-center">
                <p className="text-on-surface-muted font-serif italic">No community submissions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communityLiquors.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-4 bg-surface-base vintage-border">
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/liquor/${l.id}`)}
                        className="font-serif text-on-surface hover:text-on-surface-accent transition-colors text-left text-lg"
                      >
                        {l.name}
                      </button>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="micro-label text-on-surface-muted">{l.distillery || 'Unknown'}</span>
                        <span className="micro-label text-on-surface-muted">{l.submissionCount || 1} submission{(l.submissionCount || 1) !== 1 ? 's' : ''}</span>
                        <span className="micro-label text-on-surface-accent">community</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCustomLiquor(l.id)}
                      className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs font-sans font-semibold tracking-widest uppercase flex items-center gap-2 ml-4 shrink-0"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Database Migrations */}
      <div className="surface-raised p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Database size={18} className="text-on-surface-accent" />
          <h2 className="font-display text-xl text-on-surface">Database Migrations</h2>
        </div>
        <p className="text-on-surface-muted text-sm font-serif italic">Run pending database migrations. Safe to run multiple times.</p>
        <button
          onClick={runMigrations}
          disabled={migrationLoading}
          className="flex items-center gap-2 py-2.5 px-6 bg-on-surface-accent text-on-surface-invert text-xs font-semibold tracking-widest uppercase hover:bg-[#B08832] disabled:opacity-50 transition-colors"
        >
          {migrationLoading ? 'Running...' : 'Run Migrations'}
        </button>
        {migrationStatus && (
          <pre className="text-sm text-on-surface-muted bg-surface-base vintage-border p-4 whitespace-pre-wrap">{migrationStatus}</pre>
        )}
      </div>
    </div>
  );
}
