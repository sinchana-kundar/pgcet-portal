import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FileUpload({
  label,
  accept = '.pdf',
  maxSizeMB = 25,
  file,
  onFileSelect,
  progress = 0,
  error: externalError,
  hint,
  required = false,
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const inputRef = useRef(null);

  const displayError = externalError || internalError;

  const validateAndSelect = (selectedFile) => {
    setInternalError(null);
    if (!selectedFile) return;

    // Check size limit (maxSizeMB in bytes)
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setInternalError(`File size exceeds ${maxSizeMB}MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    // Check file extension / accept
    if (accept) {
      const allowedExts = accept
        .split(',')
        .map((ext) => ext.trim().toLowerCase());
      const fileName = selectedFile.name.toLowerCase();
      const isAllowed = allowedExts.some((ext) => {
        if (ext.startsWith('.')) {
          return fileName.endsWith(ext);
        }
        return selectedFile.type.match(new RegExp(ext.replace('*', '.*')));
      });

      if (!isAllowed) {
        setInternalError(`Invalid file format. Allowed types: ${accept}`);
        return;
      }
    }

    onFileSelect(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setInternalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
          <span className="text-[11px] text-slate-400">Max {maxSizeMB}MB</span>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center ${
            disabled
              ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              : dragOver
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : displayError
              ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Drag & drop your file here, or{' '}
            <span className="text-indigo-600 hover:underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported formats: {accept.toUpperCase()}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {progress >= 100 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uploaded
                </span>
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {progress > 0 && progress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {hint && !displayError && (
        <p className="text-xs text-slate-500 leading-normal">{hint}</p>
      )}

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
