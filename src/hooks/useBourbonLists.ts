import { useState, useEffect } from 'react';

export function useBourbonLists() {
  const [wantToTry, setWantToTry] = useState<string[]>([]);
  const [tried, setTried] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedWant = localStorage.getItem('bs_wantToTry');
    const savedTried = localStorage.getItem('bs_tried');
    if (savedWant) setWantToTry(JSON.parse(savedWant));
    if (savedTried) setTried(JSON.parse(savedTried));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bs_wantToTry', JSON.stringify(wantToTry));
  }, [wantToTry]);

  useEffect(() => {
    localStorage.setItem('bs_tried', JSON.stringify(tried));
  }, [tried]);

  const toggleWantToTry = (id: string) => {
    if (wantToTry.includes(id)) {
      setWantToTry(prev => prev.filter(x => x !== id));
    } else {
      setWantToTry(prev => [...prev, id]);
      setTried(prev => prev.filter(x => x !== id)); // Remove from tried if adding to want
    }
  };

  const toggleTried = (id: string) => {
    if (tried.includes(id)) {
      setTried(prev => prev.filter(x => x !== id));
    } else {
      setTried(prev => [...prev, id]);
      setWantToTry(prev => prev.filter(x => x !== id)); // Remove from want if adding to tried
    }
  };

  return { wantToTry, tried, toggleWantToTry, toggleTried };
}
