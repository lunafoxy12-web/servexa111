import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadVerificationDocument } from '../../lib/firebase';

interface DirectImageUploadProps {
  label?: string;
  helperText?: string;
  value?: string;
  onChange: (fileUrl: string) => void;
  accept?: string;
  maxSizeMB?: number;
  aspectRatioClass?: string;
  id?: string;
  userId?: string;
}

export const DirectImageUpload: React.FC<DirectImageUploadProps> = ({
  label = 'Upload Image',
  helperText = 'PNG, JPG, WEBP, or PDF up to 8MB',
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 8,
  aspectRatioClass = 'aspect-video',
  id = 'direct-upload',
  userId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setUploading(true);
    try {
      if (userId) {
        // Direct upload to Firebase Storage
        const downloadUrl = await uploadVerificationDocument(userId, file);
        onChange(downloadUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
        };
        reader.onerror = () => {
          setError('Failed to read image file. Please try another image.');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload to Firebase Storage. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-1.5" id={id}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">{label}</label>
          {value && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              File Loaded
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs">
          {value.startsWith('data:application/pdf') ? (
            <div className={`w-full ${aspectRatioClass} bg-slate-100 flex flex-col items-center justify-center p-4 text-center`}>
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl mb-2">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">PDF Document Attached</span>
              <span className="text-[10px] text-slate-500">Government Verified Document</span>
            </div>
          ) : (
            <img
              src={value}
              alt="Uploaded Preview"
              className={`w-full ${aspectRatioClass} object-cover group-hover:scale-102 transition-transform duration-300`}
            />
          )}

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-md hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Replace File</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`w-full ${aspectRatioClass} rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 cursor-pointer text-center ${
            uploading
              ? 'border-indigo-400 bg-indigo-50/40 cursor-wait'
              : dragOver
              ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          {uploading ? (
            <>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-2 shadow-2xs">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Uploading to Firebase Storage...
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Encrypting and uploading file directly</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-2 shadow-2xs">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Click to upload or drag & drop
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
