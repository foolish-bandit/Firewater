import { useState } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { Liquor } from '../liquorTypes';

interface ProfileEditProps {
  profile: UserProfile;
  liquors: Liquor[];
  triedIds: string[];
  onSave: (updates: { bio?: string; favorite_spirit?: string; is_public?: boolean; top_shelf?: string[] }) => Promise<void>;
  onClose: () => void;
}

export default function ProfileEdit({ profile, liquors, triedIds, onSave, onClose }: ProfileEditProps) {
  const [bio, setBio] = useState(profile.bio || '');
  const [favoriteSpirit, setFavoriteSpirit] = useState(profile.favorite_spirit || '');
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [topShelf, setTopShelf] = useState<string[]>(profile.top_shelf || []);
  const [saving, setSaving] = useState(false);
  const [shelfSearch, setShelfSearch] = useState('');

  const triedLiquors = triedIds.map(id => liquors.find(b => b.id === id)).filter(Boolean) as Liquor[];
  const availableForShelf = triedLiquors
    .filter(b => !topShelf.includes(b.id))
    .filter(b => !shelfSearch || b.name.toLowerCase().includes(shelfSearch.toLowerCase()));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ bio, favorite_spirit: favoriteSpirit, is_public: isPublic, top_shelf: topShelf });
    setSaving(false);
  };

  const addToShelf = (id: string) => {
    if (topShelf.length >= 4) return;
    setTopShelf(prev => [...prev, id]);
    setShelfSearch('');
  };

  const removeFromShelf = (id: string) => {
    setTopShelf(prev => prev.filter(x => x !== id));
  };

  const spiritOptions = ['Liquor', 'Rye', 'Single Malt', 'Scotch', 'Irish Whiskey', 'Japanese Whisky', 'Mezcal', 'Rum', 'Cognac'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-vintage-bg)]/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#1A1816] vintage-border w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-vintage-border)]">
          <h3 className="font-display text-2xl text-[#EAE4D9]">Edit Profile</h3>
          <button onClick={onClose} className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Bio */}
          <div>
            <label className="micro-label text-[#C89B3C] mb-2 block">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
              placeholder="A few words about your whiskey journey..."
              className="w-full bg-[#141210] vintage-border p-4 text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none focus:border-[#C89B3C] min-h-[80px] font-serif italic resize-none"
            />
            <p className="text-[#EAE4D9]/20 text-xs text-right mt-1">{bio.length}/200</p>
          </div>

          {/* Favorite Spirit */}
          <div>
            <label className="micro-label text-[#C89B3C] mb-2 block">Favorite Spirit</label>
            <div className="flex flex-wrap gap-2">
              {spiritOptions.map(spirit => (
                <button
                  key={spirit}
                  onClick={() => setFavoriteSpirit(favoriteSpirit === spirit ? '' : spirit)}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                    favoriteSpirit === spirit
                      ? 'bg-[#C89B3C] text-[#141210]'
                      : 'vintage-border text-[#EAE4D9]/50 hover:text-[#C89B3C] hover:border-[#C89B3C]/30'
                  }`}
                >
                  {spirit}
                </button>
              ))}
            </div>
          </div>

          {/* Top Shelf */}
          <div>
            <label className="micro-label text-[#C89B3C] mb-2 block">Top Shelf (up to 4 favorites)</label>
            {topShelf.length > 0 && (
              <div className="space-y-2 mb-3">
                {topShelf.map((id, i) => {
                  const b = liquors.find(x => x.id === id);
                  if (!b) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 bg-[#141210] vintage-border p-3">
                      <span className="font-display text-lg text-[#C89B3C]/50">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-[#EAE4D9] truncate">{b.name}</p>
                        <p className="text-[10px] text-[#EAE4D9]/40 tracking-wider uppercase">{b.distillery}</p>
                      </div>
                      <button onClick={() => removeFromShelf(id)} className="text-[#EAE4D9]/40 hover:text-[#C89B3C] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {topShelf.length < 4 && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#141210] vintage-border px-3 focus-within:border-[#C89B3C] transition-colors">
                  <Search size={14} className="text-[#EAE4D9]/40" />
                  <input
                    value={shelfSearch}
                    onChange={e => setShelfSearch(e.target.value)}
                    placeholder="Search your tried liquors..."
                    className="flex-1 bg-transparent py-3 text-sm text-[#EAE4D9] placeholder-[#EAE4D9]/40 focus:outline-none"
                  />
                </div>
                {shelfSearch && (
                  <div className="absolute top-full left-0 right-0 bg-[#1A1816] vintage-border mt-1 max-h-48 overflow-y-auto z-10">
                    {availableForShelf.length === 0 ? (
                      <p className="p-3 text-[#EAE4D9]/40 text-sm font-serif italic">No matches found</p>
                    ) : (
                      availableForShelf.slice(0, 8).map(b => (
                        <button
                          key={b.id}
                          onClick={() => addToShelf(b.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#C89B3C]/5 transition-colors text-left"
                        >
                          <Plus size={14} className="text-[#C89B3C] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-[#EAE4D9] truncate">{b.name}</p>
                            <p className="text-[10px] text-[#EAE4D9]/40 tracking-wider uppercase">{b.distillery}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {triedLiquors.length === 0 && (
              <p className="text-[#EAE4D9]/40 text-xs font-serif italic mt-2">Mark some liquors as tried first to add them to your Top Shelf</p>
            )}
          </div>

          {/* Privacy */}
          <div>
            <label className="micro-label text-[#C89B3C] mb-3 block">Profile Visibility</label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 p-4 text-center transition-all duration-200 ${
                  isPublic ? 'bg-[#C89B3C]/10 border border-[#C89B3C]/50 text-[#C89B3C]' : 'vintage-border text-[#EAE4D9]/50 hover:border-[#EAE4D9]/25'
                }`}
              >
                <p className="text-xs font-semibold tracking-widest uppercase">Public</p>
                <p className="text-[10px] text-[#EAE4D9]/40 mt-1">Anyone can see your reviews and lists</p>
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 p-4 text-center transition-all duration-200 ${
                  !isPublic ? 'bg-[#C89B3C]/10 border border-[#C89B3C]/50 text-[#C89B3C]' : 'vintage-border text-[#EAE4D9]/50 hover:border-[#EAE4D9]/25'
                }`}
              >
                <p className="text-xs font-semibold tracking-widest uppercase">Private</p>
                <p className="text-[10px] text-[#EAE4D9]/40 mt-1">Only you can see your activity</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-[var(--color-vintage-border)]">
          <button onClick={onClose} className="text-[#EAE4D9]/60 hover:text-[#EAE4D9] font-sans font-semibold tracking-widest uppercase text-xs px-6 py-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#C89B3C] text-[#141210] font-sans font-semibold tracking-widest uppercase text-xs px-8 py-3 hover:bg-[#B08832] disabled:opacity-50 transition-all duration-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
