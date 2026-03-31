import { Flame, Leaf, Mountain, Star, Shield, Crown, Compass, Gem, Skull, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AvatarIcon {
  key: string;
  icon: LucideIcon;
  label: string;
}

export const AVATAR_ICONS: AvatarIcon[] = [
  { key: 'glass', icon: Wine, label: 'Glass' },
  { key: 'flame', icon: Flame, label: 'Flame' },
  { key: 'leaf', icon: Leaf, label: 'Leaf' },
  { key: 'mountain', icon: Mountain, label: 'Mountain' },
  { key: 'star', icon: Star, label: 'Star' },
  { key: 'shield', icon: Shield, label: 'Shield' },
  { key: 'crown', icon: Crown, label: 'Crown' },
  { key: 'compass', icon: Compass, label: 'Compass' },
  { key: 'gem', icon: Gem, label: 'Gem' },
  { key: 'skull', icon: Skull, label: 'Skull' },
];

export const AVATAR_ICON_KEYS = AVATAR_ICONS.map(a => a.key);

export function getAvatarIcon(key: string | undefined | null): AvatarIcon | undefined {
  if (!key) return undefined;
  return AVATAR_ICONS.find(a => a.key === key);
}
