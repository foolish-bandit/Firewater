import { useState } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { Liquor } from '../liquorTypes';
import { AVATAR_ICONS, getAvatarIcon } from '../avatarIcons';

interface ProfileEditProps {
  profile: UserProfile;
  liquors: Liquor[];
  triedIds: string[];
  onSave: (updates: { display_name?: string; avatar_icon?: string; bio?: string; favorite_spirit?: string; is_public?: boolean; top_shelf?: string[] }) => Promise<void>;
  onClose: () => void;
}

export default function ProfileEdit({ profile, liquors, triedIds, onSave, onClose }: ProfileEditProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || profile.name || '');
  const [avatarIcon, setAvatarIcon] = useState(profile.avatar_icon || '');
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
    await onSave({ display_name: displayName, avatar_icon: avatarIcon, bio, favorite_spirit: favoriteSpirit, is_public: isPublic, top_shelf: topShelf });
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
      <div className="surface-raised w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-vintage-border)]">
          <h3 className="font-display text-2xl text-on-surface">Edit Profile</h3>
          <button onClick={onClose} className="text-on-surface-muted hover:text-on-surface-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="micro-label text-on-surface-accent mb-2 block">Display Name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="What should people call you?"
              className="w-full bg-surface-base vintage-border px-4 py-3 text-on-surface placeholder-on-surface-muted focus:outline-none focus:border-border-accent-strong text-sm"
            />
            <p className="text-on-surface-muted text-xs mt-1">This is how you appear to others. Use anything you like.</p>
          </div>

          {/* Avatar Icon */}
          <div>
            <label className="micro-label text-on-surface-accent mb-2 block">Avatar</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_ICONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAvatarIcon(avatarIcon === key ? '' : key)}
                  title={label}
                  className={`flex flex-col items-center gap-1.5 p-3 transition-all duration-200 ${
                    avatarIcon === key
                      ? 'bg-on-surface-accent/15 border border-border-accent text-on-surface-accent'
                      : 'vintage-border text-on-surface-muted hover:text-on-surface-accent hover:border-border-accent'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[9px] font-semibold tracking-wider uppercase">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="micro-label text-on-surface-accent mb-2 block">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
              placeholder="A few words about your whiskey journey..."
              className="w-full bg-surface-base vintage-border p-4 text-on-surface placeholder-on-surface-muted focus:outline-none focus:border-border-accent-strong min-h-[80px] font-serif italic resize-none"
            />
            <p className="text-on-surface-muted text-xs text-right mt-1">{bio.length}/200</p>
          </div>

          {/* Favorite Spirit */}
          <div>
            <label className="micro-label text-on-surface-accent mb-2 block">Favorite Spirit</label>
            <div className="flex flex-wrap gap-2">
              {spiritOptions.map(spirit => (
                <button
                  key={spirit}
                  onClick={() => setFavoriteSpirit(favoriteSpirit === spirit ? '' : spirit)}
                  className={`px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                    favoriteSpirit === spirit
                      ? 'bg-on-surface-accent text-on-surface-invert'
                      : 'vintage-border text-on-surface-muted hover:text-on-surface-accent hover:border-border-accent'
                  }`}
                >
                  {spirit}
                </button>
              ))}
            </div>
          </div>

          {/* Top Shelf */}
          <div>
            <label className="micro-label text-on-surface-accent mb-2 block">Top Shelf (up to 4 favorites)</label>
            {topShelf.length > 0 && (
              <div className="space-y-2 mb-3">
                {topShelf.map((id, i) => {
                  const b = liquors.find(x => x.id === id);
                  if (!b) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 bg-surface-base vintage-border p-3">
                      <span className="font-display text-lg text-on-surface-accent/50">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-on-surface truncate">{b.name}</p>
                        <p className="text-[10px] text-on-surface-muted tracking-wider uppercase">{b.distillery}</p>
                      </div>
                      <button onClick={() => removeFromShelf(id)} className="text-on-surface-muted hover:text-on-surface-accent transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {topShelf.length < 4 && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-surface-base vintage-border px-3 focus-within:border-border-accent-strong transition-colors">
                  <Search size={14} className="text-on-surface-muted" />
                  <input
                    value={shelfSearch}
                    onChange={e => setShelfSearch(e.target.value)}
                    placeholder="Search your tried liquors..."
                    className="flex-1 bg-transparent py-3 text-sm text-on-surface placeholder-on-surface-muted focus:outline-none"
                  />
                </div>
                {shelfSearch && (
                  <div className="absolute top-full left-0 right-0 surface-raised mt-1 max-h-48 overflow-y-auto z-10">
                    {availableForShelf.length === 0 ? (
                      <p className="p-3 text-on-surface-muted text-sm font-serif italic">No matches found</p>
                    ) : (
                      availableForShelf.slice(0, 8).map(b => (
                        <button
                          key={b.id}
                          onClick={() => addToShelf(b.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-on-surface-accent/5 transition-colors text-left"
                        >
                          <Plus size={14} className="text-on-surface-accent shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-on-surface truncate">{b.name}</p>
                            <p className="text-[10px] text-on-surface-muted tracking-wider uppercase">{b.distillery}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {triedLiquors.length === 0 && (
              <p className="text-on-surface-muted text-xs font-serif italic mt-2">Mark some liquors as tried first to add them to your Top Shelf</p>
            )}
          </div>

          {/* Privacy */}
          <div>
            <label className="micro-label text-on-surface-accent mb-3 block">Profile Visibility</label>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 p-4 text-center transition-all duration-200 ${
                  isPublic ? 'bg-on-surface-accent/10 border border-border-accent text-on-surface-accent' : 'vintage-border text-on-surface-muted hover:border-border-subtle'
                }`}
              >
                <p className="text-xs font-semibold tracking-widest uppercase">Public</p>
                <p className="text-[10px] text-on-surface-muted mt-1">Anyone can see your reviews and lists</p>
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 p-4 text-center transition-all duration-200 ${
                  !isPublic ? 'bg-on-surface-accent/10 border border-border-accent text-on-surface-accent' : 'vintage-border text-on-surface-muted hover:border-border-subtle'
                }`}
              >
                <p className="text-xs font-semibold tracking-widest uppercase">Private</p>
                <p className="text-[10px] text-on-surface-muted mt-1">Only you can see your activity</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-[var(--color-vintage-border)]">
          <button onClick={onClose} className="text-on-surface-muted hover:text-on-surface font-sans font-semibold tracking-widest uppercase text-xs px-6 py-2 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
