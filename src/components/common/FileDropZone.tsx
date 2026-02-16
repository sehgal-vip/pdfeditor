import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Lock, X } from 'lucide-react';
import { useFileStore } from '@/stores/fileStore';
import type { UploadedFile } from '@/types';
import { ERRORS } from '@/lib/error-messages';
import { formatFileSize } from '@/lib/download-utils';

interface FileDropZoneProps {
  onFilesLoaded: (files: UploadedFile[]) => void;
  multiple?: boolean;
}

export function FileDropZone({ onFilesLoaded, multiple = false }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<UploadedFile[]>([]);
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingBytes, setPendingBytes] = useState<Uint8Array | null>(null);
  const [pendingName, setPendingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recentFiles = useFileStore((s) => s.recentFiles);
  const addToCache = useFileStore((s) => s.addToCache);

  const processFile = useCallback(async (file: File, pwd?: string) => {
    setLoading(true);
    setError(null);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());

      // Validate PDF magic bytes
      const header = new TextDecoder().decode(bytes.slice(0, 5));
      if (header !== '%PDF-') {
        setError(ERRORS.INVALID_PDF);
        setLoading(false);
        return;
      }

      // Check file size warning
      if (bytes.length > 50 * 1024 * 1024) {
        // Show warning but continue
        console.warn('Large file detected:', formatFileSize(bytes.length));
      }

      // Try to get page count with pdf-lib
      let pageCount = 0;
      let isEncrypted = false;
      try {
        const { PDFDocument } = await import('pdf-lib-with-encrypt');
        const doc = await PDFDocument.load(bytes, { password: pwd, ignoreEncryption: !pwd });
        pageCount = doc.getPageCount();
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('password') || msg.includes('encrypted') || msg.includes('decrypt')) {
          isEncrypted = true;
          if (!pwd) {
            setPasswordNeeded(true);
            setPendingBytes(bytes);
            setPendingName(file.name);
            setLoading(false);
            return;
          }
        }
        // Fallback: try pdfjs
        if (pageCount === 0) {
          try {
            const { getPageCount } = await import('@/lib/thumbnail-renderer');
            pageCount = await getPageCount(bytes);
          } catch {
            // If we still can't get count, default to 0
          }
        }
      }

      const uploaded: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        bytes,
        pageCount,
        fileSize: bytes.length,
        isEncrypted,
        password: pwd,
      };

      addToCache({
        id: uploaded.id,
        name: uploaded.name,
        bytes,
        pageCount,
        cachedAt: Date.now(),
        isEncrypted,
      });

      if (multiple) {
        setLoadedFiles((prev) => {
          const next = [...prev, uploaded];
          onFilesLoaded(next);
          return next;
        });
      } else {
        setLoadedFiles([uploaded]);
        onFilesLoaded([uploaded]);
      }

      setPasswordNeeded(false);
      setPendingBytes(null);
    } catch {
      setError('Failed to process file.');
    } finally {
      setLoading(false);
    }
  }, [multiple, onFilesLoaded, addToCache]);

  const handleFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (files.length === 0) {
      setError('Please select PDF files.');
      return;
    }
    if (!multiple && files.length > 1) {
      processFile(files[0]);
    } else {
      files.forEach((f) => processFile(f));
    }
  }, [multiple, processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handlePasswordSubmit = () => {
    if (pendingBytes && password) {
      const file = new File([pendingBytes as BlobPart], pendingName, { type: 'application/pdf' });
      processFile(file, password);
    }
  };

  const removeFile = (id: string) => {
    setLoadedFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      onFilesLoaded(next);
      return next;
    });
  };

  if (loadedFiles.length > 0 && !multiple) {
    const f = loadedFiles[0];
    return (
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-indigo-500" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{f.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(f.fileSize)} · {f.pageCount} page{f.pageCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setLoadedFiles([]); onFilesLoaded([]); }} className="p-1 hover:bg-gray-100 rounded" aria-label="Remove file">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  if (loadedFiles.length > 0 && multiple) {
    return (
      <div className="space-y-2">
        {loadedFiles.map((f) => (
          <div key={f.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
            <FileText size={16} className="text-indigo-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
              <p className="text-xs text-gray-500">{f.pageCount} pages</p>
            </div>
            <button onClick={() => removeFile(f.id)} className="p-1 hover:bg-gray-100 rounded" aria-label="Remove file">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          + Add more files
        </button>
        <input ref={inputRef} type="file" accept=".pdf" multiple className="sr-only" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="file" accept=".pdf" multiple={multiple} className="sr-only" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
      <div
        className={`relative border-2 border-dashed rounded-xl min-h-[200px] flex flex-col items-center justify-center gap-3 p-8 transition-colors cursor-pointer ${
          isDragOver ? 'border-indigo-400 bg-indigo-50' : error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        tabIndex={0}
        role="button"
        aria-label="Upload PDF file"
      >
        {loading ? (
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
        ) : error ? (
          <>
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={(e) => { e.stopPropagation(); setError(null); }} className="text-xs text-red-500 underline">Try again</button>
          </>
        ) : passwordNeeded ? (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <Lock size={32} className="text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-700 mb-3">{ERRORS.ENCRYPTED_NEEDS_PASSWORD}</p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                placeholder="Enter password"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <button onClick={handlePasswordSubmit} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Unlock</button>
            </div>
          </div>
        ) : (
          <>
            <Upload size={32} className="text-gray-400" />
            <p className="text-sm text-gray-600">
              Drop your PDF{multiple ? 's' : ''} here or <span className="text-indigo-600 font-medium">click to browse</span>
            </p>
          </>
        )}
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && loadedFiles.length === 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Recent files</p>
          <div className="flex gap-2 flex-wrap">
            {recentFiles.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  const uploaded: UploadedFile = { id: f.id, name: f.name, bytes: f.bytes, pageCount: f.pageCount, fileSize: f.bytes.length, isEncrypted: f.isEncrypted };
                  setLoadedFiles([uploaded]);
                  onFilesLoaded([uploaded]);
                }}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors truncate max-w-[200px]"
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
