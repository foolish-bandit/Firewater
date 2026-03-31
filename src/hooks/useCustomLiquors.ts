import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ALL_LIQUORS, Liquor, FlavorProfile } from '../data';
import { normalizeLiquorName } from '../utils/stringUtils';

export function useCustomLiquors() {
  const [customLiquors, setCustomLiquors] = useState<Liquor[]>([]);
  const loaded = useRef(false);

  // Load from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('bs_customBourbons');
    if (savedCustom) setCustomLiquors(JSON.parse(savedCustom));
    loaded.current = true;
  }, []);

  // Save to localStorage (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      localStorage.setItem('bs_customBourbons', JSON.stringify(customLiquors));
    }, 500);
    return () => clearTimeout(timer);
  }, [customLiquors]);

  const allLiquors = useMemo(() => {
    return [...ALL_LIQUORS, ...customLiquors];
  }, [customLiquors]);

  const handleAddLiquor = useCallback((newLiquor: Liquor): string => {
    let resultId = newLiquor.id;

    setCustomLiquors(prev => {
      const normalizedNewName = normalizeLiquorName(newLiquor.name);
      const existingIndex = prev.findIndex(b => normalizeLiquorName(b.name) === normalizedNewName);

      if (existingIndex >= 0) {
        // Merge with existing community submission
        const existing = prev[existingIndex];
        const count = (existing.submissionCount || 1);
        const newCount = count + 1;

        // Average flavor profile
        const newFlavorProfile = { ...existing.flavorProfile };
        (Object.keys(newFlavorProfile) as Array<keyof FlavorProfile>).forEach(key => {
          newFlavorProfile[key] = Math.round(
            ((existing.flavorProfile[key] * count) + newLiquor.flavorProfile[key]) / newCount
          );
        });

        const updatedLiquor: Liquor = {
          ...existing,
          flavorProfile: newFlavorProfile,
          submissionCount: newCount,
          source: newCount >= 3 ? 'curated' : 'community'
        };

        const newCustom = [...prev];
        newCustom[existingIndex] = updatedLiquor;

        resultId = existing.id;
        return newCustom;
      } else {
        // Add new
        return [...prev, newLiquor];
      }
    });

    return resultId;
  }, []);

  return { allLiquors, customLiquors, handleAddLiquor };
}
