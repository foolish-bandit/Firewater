import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Users, Wine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserSearch } from '../hooks/useUserSearch';
import { getAvatarIcon } from '../avatarIcons';
import { Liquor } from '../liquorTypes';

interface UnifiedSearchProps {
  onClose: () => void;
  liquors: Liquor[];
}

function getTopFlavor(liquor: Liquor): string {
  const entries = Object.entries(liquor.flavorProfile);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ? entries[0][0].charAt(0).toUpperCase() + entries[0][0].slice(1) : '';
}

export default function UnifiedSearch({ onClose, liquors }: UnifiedSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { results: userResults, searching: userSearching, searchUsers, clearResults } = useUserSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setDebouncedQuery('');
      clearResults();
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      searchUsers(value);
    }, 200);
  };

  const liquorResults = useMemo(() => {
    if (debouncedQuery.trim().length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    return liquors
      .filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.distillery.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [debouncedQuery, liquors]);

  const handleSelectLiquor = (id: string) => {
    onClose();
    navigate(`/liquor/${id}`);
  };

  const handleSelectUser = (userId: string) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const hasQuery = query.trim().length >= 2;
  const noLiquorResults = hasQuery && debouncedQuery.trim().length >= 2 && liquorResults.length === 0;
  const noUserResults = hasQuery && !userSearching && debouncedQuery.trim().length >= 2 && userResults.length === 0;

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
            placeholder="Search bottles, distilleries, or people..."
            className="flex-1 bg-transparent text-lg text-on-surface placeholder-on-surface-muted focus:outline-none font-serif italic"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-sans text-on-surface-muted border border-border-subtle rounded">
            <span>&#8984;</span>K
          </kbd>
          <button onClick={onClose} className="text-on-surface-muted hover:text-on-surface-accent transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          {/* Bottles Section */}
          {hasQuery && (
            <div>
              <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                <Wine size={14} className="text-on-surface-accent" />
                <span className="micro-label text-on-surface-accent">Bottles</span>
              </div>

              {noLiquorResults && (
                <div className="text-center py-6 px-6">
                  <p className="text-on-surface-muted font-serif italic text-sm">No bottles matching "{query}"</p>
                </div>
              )}

              {liquorResults.map(liquor => (
                <button
                  key={liquor.id}
                  onClick={() => handleSelectLiquor(liquor.id)}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-on-surface-accent/5 transition-colors text-left border-b border-[var(--color-vintage-border)] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif font-medium text-on-surface truncate">{liquor.name}</p>
                    <p className="text-xs text-on-surface-muted truncate font-sans">{liquor.distillery}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-0.5 text-[9px] font-sans font-semibold tracking-wider uppercase text-on-surface-accent border border-border-accent rounded-full">
                      {getTopFlavor(liquor)}
                    </span>
                    <span className="text-xs text-on-surface-muted font-sans">${liquor.price}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* People Section */}
          {hasQuery && (
            <div>
              <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                <Users size={14} className="text-on-surface-accent" />
                <span className="micro-label text-on-surface-accent">People</span>
              </div>

              {userSearching && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-border-accent-strong border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {noUserResults && (
                <div className="text-center py-6 px-6">
                  <p className="text-on-surface-muted font-serif italic text-sm">No people matching "{query}"</p>
                </div>
              )}

              {userResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-on-surface-accent/5 transition-colors text-left border-b border-[var(--color-vintage-border)] last:border-0"
                >
                  {(() => {
                    const avatarDef = getAvatarIcon(user.avatar_icon);
                    const displayName = user.display_name || user.name;
                    if (avatarDef) {
                      const AvatarComp = avatarDef.icon;
                      return (
                        <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-on-surface-accent/15 text-on-surface-accent">
                          <AvatarComp size={18} />
                        </div>
                      );
                    }
                    if (user.picture) {
                      return <img src={user.picture} alt={displayName} className="w-10 h-10 rounded-full vintage-border" referrerPolicy="no-referrer" />;
                    }
                    return (
                      <div className="w-10 h-10 rounded-full vintage-border flex items-center justify-center bg-on-surface-accent/20 text-on-surface-accent text-sm font-display">
                        {displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-semibold text-on-surface truncate">{user.display_name || user.name}</p>
                    {user.bio && <p className="text-xs text-on-surface-muted truncate font-serif italic">{user.bio}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-sans tracking-widest uppercase text-on-surface-muted shrink-0">
                    {user.tried_count > 0 && <span>{user.tried_count} tasted</span>}
                    {user.review_count > 0 && <span>{user.review_count} reviews</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!hasQuery && (
          <div className="text-center py-8 px-6">
            <Search size={24} className="text-on-surface-accent/20 mx-auto mb-2" />
            <p className="text-on-surface-muted text-sm font-serif italic">Search the full catalog or find other enthusiasts</p>
          </div>
        )}
      </div>
    </div>
  );
}
