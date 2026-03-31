import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FollowUser {
  id: string;
  name: string;
  picture: string;
  bio: string;
}

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
  onNavigate: (userId: string) => void;
}

export default function FollowList({ userId, type, onClose, onNavigate }: FollowListProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/social?scope=follows&action=list&userId=${userId}&type=${type}`)
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#1A1816] vintage-border w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-vintage-border)]">
          <h3 className="font-display text-xl text-[#EAE4D9] capitalize">{type}</h3>
          <button onClick={onClose} className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C89B3C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-[#EAE4D9]/40 font-serif italic text-center py-12">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => onNavigate(u.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[#C89B3C]/5 transition-colors rounded text-left"
              >
                {u.picture ? (
                  <img src={u.picture} alt={u.name} className="w-10 h-10 rounded-full vintage-border" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-[#C89B3C]/20 text-[#C89B3C] text-sm font-display">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-sans font-semibold text-[#EAE4D9] truncate">{u.name}</p>
                  {u.bio && <p className="text-xs text-[#EAE4D9]/40 truncate font-serif italic">{u.bio}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
