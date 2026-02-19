import { useState, useCallback, useMemo } from 'react';
import type { UploadedFile, ToolOutput } from '@/types';
import { workerClient } from '@/lib/pdf-worker-client';
import { useProcessingStore } from '@/stores/processingStore';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ProgressBar } from '@/components/common/ProgressBar';
import { PreviewPanel } from '@/components/common/PreviewPanel';
import { DownloadPanel } from '@/components/common/DownloadPanel';
import { ToolSuggestions } from '@/components/common/ToolSuggestions';
import { Minimize2 } from 'lucide-react';
import { ERRORS } from '@/lib/error-messages';
import { formatFileSize } from '@/lib/download-utils';
import toast from 'react-hot-toast';

type CompressionLevel = 'low' | 'medium' | 'high';

const LEVEL_DESCRIPTIONS: Record<CompressionLevel, { label: string; description: string }> = {
  low: { label: 'Low', description: 'Fast. Re-saves with optimized structure.' },
  medium: { label: 'Medium', description: 'Balanced. Compresses streams and removes duplicates.' },
  high: { label: 'High', description: 'Maximum. Also strips metadata and flattens forms.' },
};

const LEVEL_ESTIMATES: Record<CompressionLevel, { minPct: number; maxPct: number }> = {
  low:    { minPct: 5,  maxPct: 15 },
  medium: { minPct: 15, maxPct: 35 },
  high:   { minPct: 20, maxPct: 40 },
};

export function CompressTool() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [stripMetadata, setStripMetadata] = useState(false);
  const [flattenForms, setFlattenForms] = useState(false);
  const [result, setResult] = useState<ToolOutput | null>(null);

  const status = useProcessingStore((s) => s.status);

  const file = files[0] ?? null;

  const analysis = useMemo(() => {
    if (!file) return null;
    return {
      isEncrypted: file.isEncrypted,
      pageCount: file.pageCount,
      hasMixedPageSizes: false,
    };
  }, [file]);

  const estimate = useMemo(() => {
    if (!file) return null;
    const { minPct, maxPct } = LEVEL_ESTIMATES[level];
    const size = file.bytes.length;
    return {
      minSize: formatFileSize(Math.round(size * (1 - maxPct / 100))),
      maxSize: formatFileSize(Math.round(size * (1 - minPct / 100))),
      minPct,
      maxPct,
    };
  }, [file, level]);

  const canProcess = useMemo(() => {
    return !!file;
  }, [file]);

  const handleFilesLoaded = useCallback((loaded: UploadedFile[]) => {
    setFiles(loaded);
    setResult(null);
    useProcessingStore.getState().reset();
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file || !canProcess) return;

    try {
      const output = await workerClient.process('compress', [file.bytes], {
        level,
        stripMetadata: level === 'high' ? true : stripMetadata,
        flattenForms: level === 'high' ? true : flattenForms,
      });

      // Check if compression actually saved space
      const outputSize = output.files[0]?.bytes.length ?? 0;
      if (outputSize >= file.bytes.length) {
        toast(ERRORS.COMPRESS_NO_SAVINGS, { icon: '\u26A0\uFE0F' });
      }

      setResult(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [file, canProcess, level, stripMetadata, flattenForms]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setLevel('medium');
    setStripMetadata(false);
    setFlattenForms(false);
    setResult(null);
    useProcessingStore.getState().reset();
  }, []);

  // Result state
  if (result) {
    return (
      <div className="space-y-4">
        <PreviewPanel result={result} originalBytes={file?.bytes} showOriginalToggle />
        <DownloadPanel result={result} onReset={handleReset} />
      </div>
    );
  }

  // Configure and process
  return (
    <div className="space-y-6">
      <FileDropZone onFilesLoaded={handleFilesLoaded} />

      {file && (<>

      <ToolSuggestions analysis={analysis} currentToolId="compress" />

      {/* Top toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            File size: {formatFileSize(file.bytes.length)}
          </p>
          {estimate && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Estimated after compression: {estimate.minSize} – {estimate.maxSize}  (↓ {estimate.minPct}–{estimate.maxPct}%)
            </p>
          )}
        </div>
        <button
          onClick={handleProcess}
          disabled={!canProcess || status === 'processing'}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minimize2 size={14} />
          {status === 'processing' ? 'Processing...' : 'Compress PDF'}
        </button>
      </div>

      {/* Compression level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compression level</label>
        <div className="space-y-2">
          {(Object.entries(LEVEL_DESCRIPTIONS) as [CompressionLevel, { label: string; description: string }][]).map(
            ([key, { label, description }]) => (
              <label key={key} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="compression-level"
                  value={key}
                  checked={level === key}
                  onChange={() => setLevel(key)}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-medium">{label}</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
                </div>
              </label>
            )
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
        {level === 'high' ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Metadata stripping and form flattening are included in High compression.
          </p>
        ) : (
          <div className="space-y-2">
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={(e) => setStripMetadata(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Strip metadata
              <span className="text-xs text-gray-400 dark:text-gray-500">— removes title, author, keywords, etc.</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={flattenForms}
                onChange={(e) => setFlattenForms(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Flatten forms
              <span className="text-xs text-gray-400 dark:text-gray-500">— removes interactive form field overhead</span>
            </label>
          </div>
        )}
      </div>

      <ProgressBar />

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!canProcess || status === 'processing'}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
      >
        <Minimize2 size={16} />
        {status === 'processing' ? 'Processing...' : 'Compress PDF'}
      </button>      </>)}
    </div>
  );
}
