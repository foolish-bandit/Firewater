import { useState, useRef } from 'react';
import { Camera, Loader2, X, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { usePhotos } from '../hooks/usePhotos';

interface PhotoUploadProps {
  liquorId: string;
  user: User | null;
}

export default function PhotoUpload({ liquorId, user }: PhotoUploadProps) {
  const { uploadPhoto, uploading, error } = usePhotos();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    const result = await uploadPhoto(liquorId, selectedFile, user);
    if (result) {
      setSuccess(true);
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-on-surface-muted text-xs">
        <Camera size={14} />
        <span className="font-sans tracking-wider">Sign in to upload photos</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!preview && !success && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-on-surface-muted hover:text-on-surface-accent text-xs font-sans font-semibold tracking-widest uppercase transition-colors"
        >
          <Camera size={16} />
          Upload Photo
        </button>
      )}

      {preview && (
        <div className="surface-raised p-4 space-y-3">
          <div className="flex items-start gap-4">
            <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded vintage-border" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-on-surface-muted font-serif italic">
                Photo will be reviewed by an admin before appearing publicly.
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-on-surface-accent text-on-surface-invert text-xs font-semibold tracking-widest uppercase hover:bg-[#B08832] disabled:opacity-50 transition-colors"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploading ? 'Uploading...' : 'Submit for Review'}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-on-surface-muted hover:text-on-surface transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-on-surface-accent text-sm">
          <CheckCircle size={16} />
          <span className="font-serif italic">Photo submitted for review!</span>
          <button
            onClick={() => { setSuccess(false); fileInputRef.current?.click(); }}
            className="text-xs text-on-surface-muted hover:text-on-surface-accent ml-2 font-sans tracking-wider uppercase"
          >
            Upload Another
          </button>
        </div>
      )}
    </div>
  );
}
