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
          ? 'bg-[#C89B3C]/10 border border-[#C89B3C]/50 text-[#C89B3C] hover:bg-transparent hover:border-[#EAE4D9]/15 hover:text-[#EAE4D9]/60'
          : 'bg-[#C89B3C] text-[#141210] hover:bg-[#B08832]'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
