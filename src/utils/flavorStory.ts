import { FlavorProfile } from '../data';

export const FLAVOR_KEYS: (keyof FlavorProfile)[] = [
  'sweetness', 'spice', 'oak', 'caramel', 'vanilla',
  'fruit', 'nutty', 'floral', 'smoky', 'leather', 'heat', 'complexity',
];

const FLAVOR_LABELS: Record<keyof FlavorProfile, string> = {
  sweetness: 'sweetness',
  spice: 'spice',
  oak: 'oak',
  caramel: 'caramel',
  vanilla: 'vanilla',
  fruit: 'fruit',
  nutty: 'nutty notes',
  floral: 'floral notes',
  smoky: 'smoke',
  leather: 'leather',
  heat: 'heat',
  complexity: 'complexity',
};

export function formatFlavorLabel(key: keyof FlavorProfile): string {
  return FLAVOR_LABELS[key];
}

export function getSortedFlavorEntries(profile: FlavorProfile) {
  return FLAVOR_KEYS
    .map((key) => ({ key, label: formatFlavorLabel(key), value: profile[key] }))
    .sort((a, b) => b.value - a.value);
}

export function getTopFlavorKeys(profile: FlavorProfile, count: number = 3) {
  return getSortedFlavorEntries(profile).slice(0, count).map(({ key }) => key);
}

export function getTopFlavorLabels(profile: FlavorProfile, count: number = 3) {
  return getSortedFlavorEntries(profile).slice(0, count).map(({ label }) => label);
}

export function getFlavorSummary(profile: FlavorProfile): string {
  const [first, second, third] = getSortedFlavorEntries(profile);
  const softer = profile.heat <= 4;
  const hotter = profile.heat >= 7;
  const richer = profile.oak >= 7 || profile.complexity >= 7;

  const lead = `Leans ${first.label}, ${second.label}, and ${third.label}`;

  if (softer) {
    return `${lead} with a softer finish.`;
  }

  if (hotter && richer) {
    return `${lead} with bigger oak and a warmer finish.`;
  }

  if (hotter) {
    return `${lead} with an extra kick of heat.`;
  }

  if (richer) {
    return `${lead} with a richer, more layered feel.`;
  }

  return `${lead} with a balanced overall profile.`;
}
