import { useState, useCallback } from 'react';
import { User } from '../types';
import { apiFetch } from '../api';

export interface Photo {
  id: string;
  bourbon_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  blob_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (liquorId: string) => {
    try {
      const res = await fetch(`/api/photos?action=bourbon&bourbonId=${encodeURIComponent(liquorId)}`);
      if (!res.ok) throw new Error('Failed to fetch photos');
      const data = await res.json();
      setPhotos(data);
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  }, []);

  const uploadPhoto = useCallback(async (liquorId: string, file: File, user: User) => {
    setUploading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/photos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'x-filename': file.name,
          'x-bourbon-id': liquorId,
        },
        body: file,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const photo = await res.json();
      return photo as Photo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const fetchPending = useCallback(async (adminEmail: string) => {
    try {
      const res = await apiFetch(`/api/photos?action=pending`);
      if (!res.ok) throw new Error('Failed to fetch pending photos');
      const data = await res.json();
      setPendingPhotos(data);
    } catch (err) {
      console.error('Error fetching pending photos:', err);
    }
  }, []);

  const approvePhoto = useCallback(async (photoId: string, adminEmail: string) => {
    try {
      const res = await apiFetch('/api/photos?action=approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) throw new Error('Failed to approve photo');
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      return true;
    } catch (err) {
      console.error('Error approving photo:', err);
      return false;
    }
  }, []);

  const rejectPhoto = useCallback(async (photoId: string, adminEmail: string) => {
    try {
      const res = await apiFetch('/api/photos?action=reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) throw new Error('Failed to reject photo');
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      return true;
    } catch (err) {
      console.error('Error rejecting photo:', err);
      return false;
    }
  }, []);

  return {
    photos,
    pendingPhotos,
    uploading,
    error,
    fetchPhotos,
    uploadPhoto,
    fetchPending,
    approvePhoto,
    rejectPhoto,
  };
}
