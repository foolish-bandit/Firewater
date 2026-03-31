import { useState, useEffect, useMemo, useCallback } from 'react';
import { BOURBONS, Bourbon, FlavorProfile } from '../data';
import { normalizeBourbonName } from '../utils/stringUtils';

export function useCustomBourbons() {
  const [customBourbons, setCustomBourbons] = useState<Bourbon[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('bs_customBourbons');
    if (savedCustom) setCustomBourbons(JSON.parse(savedCustom));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bs_customBourbons', JSON.stringify(customBourbons));
  }, [customBourbons]);

  const allBourbons = useMemo(() => {
    return [...BOURBONS, ...customBourbons];
  }, [customBourbons]);

  const handleAddBourbon = useCallback((newBourbon: Bourbon): string => {
    let resultId = newBourbon.id;

    setCustomBourbons(prev => {
      const normalizedNewName = normalizeBourbonName(newBourbon.name);
      const existingIndex = prev.findIndex(b => normalizeBourbonName(b.name) === normalizedNewName);

      if (existingIndex >= 0) {
        // Merge with existing community submission
        const existing = prev[existingIndex];
        const count = (existing.submissionCount || 1);
        const newCount = count + 1;

        // Average flavor profile
        const newFlavorProfile = { ...existing.flavorProfile };
        (Object.keys(newFlavorProfile) as Array<keyof FlavorProfile>).forEach(key => {
          newFlavorProfile[key] = Math.round(
            ((existing.flavorProfile[key] * count) + newBourbon.flavorProfile[key]) / newCount
          );
        });

        const updatedBourbon: Bourbon = {
          ...existing,
          flavorProfile: newFlavorProfile,
          submissionCount: newCount,
          source: newCount >= 3 ? 'curated' : 'community'
        };

        const newCustom = [...prev];
        newCustom[existingIndex] = updatedBourbon;

        resultId = existing.id;
        return newCustom;
      } else {
        // Add new
        return [...prev, newBourbon];
      }
    });

    return resultId;
  }, []);

  return { allBourbons, customBourbons, handleAddBourbon };
}
