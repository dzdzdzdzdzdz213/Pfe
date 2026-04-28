import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const FileUpload = ({
  bucket = 'documents',
  folder = '',
  onUploadComplete,
  multiple = false,
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    setError(null);
    setUploading(true);
    const uploadedFiles = [];

    for (const file of acceptedFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedFiles.push({
          name: file.name,
          path: data.path,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          status: 'success',
        });
      } catch (err) {
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          error: err.message,
        });
      }
    }

    setFiles(prev => [...prev, ...uploadedFiles]);
    setUploading(false);

    if (onUploadComplete) {
      onUploadComplete(uploadedFiles.filter(f => f.status === 'success'));
    }
  }, [bucket, folder, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    onDropRejected: (fileRejections) => {
      const msg = fileRejections[0]?.errors[0]?.message || 'Fichier non valide';
      setError(msg);
    }
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-blue-50/50 scale-[1.01]' 
            : 'border-slate-200 bg-slate-50/30 hover:border-primary/50 hover:bg-slate-50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UploadCloud className="h-7 w-7" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-700">
              {isDragActive ? 'Déposez les fichiers ici...' : 'Glissez-déposez vos fichiers ici'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              ou <span className="text-primary underline">parcourir</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl"
            >
              <File className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {file.status === 'success' ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              ) : file.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : null}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
