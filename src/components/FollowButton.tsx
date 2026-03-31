import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => Promise<void>;
}

export default function FollowButton({ isFollowing, onToggle }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onToggle();
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 font-sans font-semibold tracking-widest uppercase text-xs px-5 py-2 transition-all duration-300 ${
        isFollowing
          ? 'bg-on-surface-accent/10 border border-border-accent text-on-surface-accent hover:bg-transparent hover:border-border-subtle hover:text-on-surface-muted'
          : 'bg-on-surface-accent text-on-surface-invert hover:brightness-110'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
