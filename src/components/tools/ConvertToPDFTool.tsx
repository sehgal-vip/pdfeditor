import { useState, useCallback, useRef } from 'react';
import type { ToolOutput } from '@/types';
import { workerClient } from '@/lib/pdf-worker-client';
import { useProcessingStore } from '@/stores/processingStore';
import { ProgressBar } from '@/components/common/ProgressBar';
import { PreviewPanel } from '@/components/common/PreviewPanel';
import { DownloadPanel } from '@/components/common/DownloadPanel';
import { ERRORS } from '@/lib/error-messages';
import { detectRequiredFonts } from '@/lib/fonts';
import {
  preprocessImage,
  preprocessDocx,
  preprocessTxt,
  getFileType,
  ACCEPTED_EXTENSIONS,
  DEFAULT_CONVERT_CONFIG,
} from '@/lib/convert-preprocessor';
import type { ConvertInputFile, ConvertConfig } from '@/lib/convert-preprocessor';
import { FileUp, Upload, X, FileText, Image as ImageIcon, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILES = 50;

export function ConvertToPDFTool() {
  const [inputFiles, setInputFiles] = useState<ConvertInputFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Set<string>>(new Set());
  const [failedFiles, setFailedFiles] = useState<Map<string, string>>(new Map());
  const [config, setConfig] = useState<ConvertConfig>({ ...DEFAULT_CONVERT_CONFIG });
  const [result, setResult] = useState<ToolOutput | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDocxNote, setShowDocxNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = useProcessingStore((s) => s.status);

  const hasImages = inputFiles.some((f) => f.type === 'image');
  const hasDocs = inputFiles.some((f) => f.type === 'document' || f.type === 'text');

  const handleAddFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);

    if (inputFiles.length + files.length > MAX_FILES) {
      toast.error(ERRORS.MAX_FILES_EXCEEDED);
      return;
    }

    for (const file of files) {
      const fileType = getFileType(file);
      if (!fileType) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      const fileKey = `${file.name}-${Date.now()}`;
      setPendingFiles((prev) => new Set(prev).add(fileKey));

      try {
        let processed: ConvertInputFile;

        if (fileType === 'image') {
          processed = await preprocessImage(file);
        } else if (fileType === 'document') {
          processed = await preprocessDocx(file);
          if (!showDocxNote) {
            setShowDocxNote(true);
            toast(ERRORS.DOCX_LAYOUT_NOTE, { icon: 'ℹ️', duration: 6000 });
          }
        } else {
          processed = await preprocessTxt(file);
        }

        setInputFiles((prev) => [...prev, processed]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process file';
        setFailedFiles((prev) => new Map(prev).set(file.name, message));
        toast.error(`${file.name}: ${message}`);
      } finally {
        setPendingFiles((prev) => {
          const next = new Set(prev);
          next.delete(fileKey);
          return next;
        });
      }
    }
  }, [inputFiles.length, showDocxNote]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleAddFiles(e.dataTransfer.files);
  }, [handleAddFiles]);

  const removeFile = useCallback((index: number) => {
    setInputFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleProcess = useCallback(async () => {
    if (inputFiles.length === 0) return;

    // Check for CJK content in document files
    for (const file of inputFiles) {
      if (file.type === 'document' || file.type === 'text') {
        const allText = file.blocks.map((b) => b.runs?.map((r) => r.text).join('') ?? '').join('');
        const { hasCJK } = detectRequiredFonts(allText);
        if (hasCJK) {
          toast.error(ERRORS.CJK_NOT_SUPPORTED);
          return;
        }
      }
    }

    // Prepare files for worker (serialize for postMessage)
    const workerFiles = inputFiles.map((f) => {
      if (f.type === 'image') {
        return { type: f.type, name: f.name, bytes: f.bytes, mimeType: f.mimeType, width: f.width, height: f.height };
      }
      return { type: f.type, name: f.name, blocks: f.blocks };
    });

    try {
      const output = await workerClient.processConvert(workerFiles, config as unknown as Record<string, unknown>);
      setResult(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  }, [inputFiles, config]);

  const handleReset = useCallback(() => {
    setInputFiles([]);
    setPendingFiles(new Set());
    setFailedFiles(new Map());
    setConfig({ ...DEFAULT_CONVERT_CONFIG });
    setResult(null);
    setShowDocxNote(false);
    useProcessingStore.getState().reset();
  }, []);

  // Result state
  if (result) {
    return (
      <div className="space-y-4">
        <PreviewPanel result={result} />
        <DownloadPanel result={result} onReset={handleReset} />
      </div>
    );
  }

  const canProcess = inputFiles.length > 0 && pendingFiles.size === 0 && status !== 'processing';

  return (
    <div className="space-y-6">
      {/* File Drop Zone - Custom (not PDF-only FileDropZone) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {inputFiles.length === 0 ? (
        <div
          className={`relative border-2 border-dashed rounded-xl min-h-[200px] flex flex-col items-center justify-center gap-3 p-8 transition-colors cursor-pointer ${
            isDragOver
              ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
          tabIndex={0}
          role="button"
          aria-label="Upload files for conversion"
        >
          <Upload size={32} className="text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drop your files here or <span className="text-indigo-600 dark:text-indigo-400 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Supports JPG, PNG, WebP, GIF, DOCX, and TXT
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* File list */}
          {inputFiles.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {file.type === 'image' ? (
                <ImageIcon size={16} className="text-orange-500 shrink-0" />
              ) : (
                <FileText size={16} className="text-teal-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {file.type === 'image' ? `${(file as { width: number }).width}×${(file as { height: number }).height}px` : `${file.blocks.length} blocks`}
                </p>
              </div>
              <button
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="Remove file"
              >
                <X size={14} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          ))}

          {/* Pending indicator */}
          {pendingFiles.size > 0 && (
            <div className="flex items-center gap-2 p-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
              Processing {pendingFiles.size} file{pendingFiles.size !== 1 ? 's' : ''}...
            </div>
          )}

          {/* Add more */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            + Add more files
          </button>
        </div>
      )}

      {/* Failed files */}
      {failedFiles.size > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium mb-1">
            <AlertCircle size={14} />
            Some files could not be processed
          </div>
          {Array.from(failedFiles.entries()).map(([name, error]) => (
            <p key={name} className="text-xs text-red-500 dark:text-red-400 ml-5">{name}: {error}</p>
          ))}
        </div>
      )}

      {/* Options */}
      {inputFiles.length > 0 && (
        <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversion Options</h3>

          {/* Image settings */}
          {hasImages && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Image Settings</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Page Size</label>
                  <select
                    value={config.imagePageSize}
                    onChange={(e) => setConfig((c) => ({ ...c, imagePageSize: e.target.value as ConvertConfig['imagePageSize'] }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="fit">Fit to Image</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fit Mode</label>
                  <select
                    value={config.imageFitMode}
                    onChange={(e) => setConfig((c) => ({ ...c, imageFitMode: e.target.value as ConvertConfig['imageFitMode'] }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="stretch">Stretch</option>
                    <option value="original">Original Size</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Orientation</label>
                  <select
                    value={config.imageOrientation}
                    onChange={(e) => setConfig((c) => ({ ...c, imageOrientation: e.target.value as ConvertConfig['imageOrientation'] }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value="auto">Auto</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Document settings */}
          {hasDocs && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Document Settings</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Page Size</label>
                  <select
                    value={config.docPageSize}
                    onChange={(e) => setConfig((c) => ({ ...c, docPageSize: e.target.value as ConvertConfig['docPageSize'] }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Orientation</label>
                  <select
                    value={config.docOrientation}
                    onChange={(e) => setConfig((c) => ({ ...c, docOrientation: e.target.value as ConvertConfig['docOrientation'] }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={config.textFontSize}
                    onChange={(e) => setConfig((c) => ({ ...c, textFontSize: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Line Spacing</label>
                  <select
                    value={config.textLineHeight}
                    onChange={(e) => setConfig((c) => ({ ...c, textLineHeight: Number(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg"
                  >
                    <option value={1.0}>Single</option>
                    <option value={1.15}>1.15</option>
                    <option value={1.5}>1.5</option>
                    <option value={2.0}>Double</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Shared margin */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Margin: {config.margin}pt</label>
            <input
              type="range"
              min={0}
              max={72}
              value={config.margin}
              onChange={(e) => setConfig((c) => ({ ...c, margin: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* DOCX limitations note */}
      {showDocxNote && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-600 dark:text-blue-400">{ERRORS.DOCX_LAYOUT_NOTE}</p>
        </div>
      )}

      <ProgressBar />

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!canProcess}
        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
      >
        <FileUp size={16} />
        {status === 'processing' ? 'Converting...' : 'Convert to PDF'}
      </button>
    </div>
  );
}
