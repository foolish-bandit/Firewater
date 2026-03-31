import { useState, useRef, useEffect } from 'react';
import { Search, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserSearch } from '../hooks/useUserSearch';

interface UserSearchProps {
  onClose: () => void;
}

export default function UserSearch({ onClose }: UserSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { results, searching, searchUsers, clearResults } = useUserSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      clearResults();
      return;
    }
    debounceRef.current = setTimeout(() => searchUsers(value), 300);
  };

  const handleSelect = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="surface-raised w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-vintage-border)]">
          <Search size={18} className="text-on-surface-accent shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search for people..."
            className="flex-1 bg-transparent text-lg text-on-surface placeholder-on-surface-muted focus:outline-none font-serif italic"
          />
          <button onClick={onClose} className="text-on-surface-muted hover:text-on-surface-accent transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-border-accent-strong border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <Users size={24} className="text-on-surface-muted/20 mx-auto mb-2" />
              <p className="text-on-surface-muted font-serif italic text-sm">No one found matching "{query}"</p>
            </div>
          )}

          {results.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-on-surface-accent/5 transition-colors text-left border-b border-[var(--color-vintage-border)] last:border-0"
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full vintage-border" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-on-surface-accent/20 text-on-surface-accent text-sm font-display">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-semibold text-on-surface truncate">{user.name}</p>
                {user.bio && <p className="text-xs text-on-surface-muted truncate font-serif italic">{user.bio}</p>}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-sans tracking-widest uppercase text-on-surface-muted shrink-0">
                {user.tried_count > 0 && <span>{user.tried_count} tasted</span>}
                {user.review_count > 0 && <span>{user.review_count} reviews</span>}
              </div>
            </button>
          ))}
        </div>

        {!query && (
          <div className="text-center py-8 px-6">
            <Users size={24} className="text-on-surface-accent/20 mx-auto mb-2" />
            <p className="text-on-surface-muted text-sm font-serif italic">Find other liquor enthusiasts</p>
          </div>
        )}
      </div>
    </div>
  );
}
