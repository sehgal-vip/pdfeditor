import type { PDFTool } from '@/types';
import { generateFilename } from './filename-generator';
import { SplitTool } from '@/components/tools/SplitTool';
import { MergeTool } from '@/components/tools/MergeTool';
import { RotateTool } from '@/components/tools/RotateTool';
import { ReorderTool } from '@/components/tools/ReorderTool';
import { DeletePagesTool } from '@/components/tools/DeletePagesTool';
import { ExtractPagesTool } from '@/components/tools/ExtractPagesTool';
import { AddBlankPagesTool } from '@/components/tools/AddBlankPagesTool';
import { PageNumbersTool } from '@/components/tools/PageNumbersTool';
import { TextWatermarkTool } from '@/components/tools/TextWatermarkTool';
import { ScaleResizeTool } from '@/components/tools/ScaleResizeTool';
import { EncryptTool } from '@/components/tools/EncryptTool';
import { UnlockTool } from '@/components/tools/UnlockTool';
import { MetadataEditorTool } from '@/components/tools/MetadataEditorTool';
import { ConvertToPDFTool } from '@/components/tools/ConvertToPDFTool';
import { EditPDFTool } from '@/components/tools/EditPDFTool';
import { CompressTool } from '@/components/tools/CompressTool';

const time = {
  split: (p: number) => 0.5 + p * 0.01,
  merge: (p: number) => 0.5 + p * 0.02,
  rotate: (p: number) => 0.3 + p * 0.005,
  reorder: (p: number) => 0.5 + p * 0.01,
  'delete-pages': (p: number) => 0.5 + p * 0.01,
  'extract-pages': (p: number) => 0.5 + p * 0.01,
  'add-blank-pages': () => 0.5,
  'add-page-numbers': (p: number) => 1 + p * 0.05,
  'text-watermark': (p: number) => 1 + p * 0.05,
  scale: (p: number) => 1 + p * 0.03,
  encrypt: (p: number) => 0.5 + p * 0.02,
  unlock: () => 0.5,
  'edit-metadata': () => 0.3,
  'edit-pdf': (p: number) => 1 + p * 0.03,
  'convert-to-pdf': () => 2,
  compress: (p: number) => 1 + p * 0.02,
} as Record<string, (p: number, s: number) => number>;

export const CATEGORIES = {
  organize: { label: 'Organize', color: 'blue-500' },
  transform: { label: 'Transform', color: 'amber-500' },
  stamp: { label: 'Stamp', color: 'purple-500' },
  security: { label: 'Security', color: 'red-500' },
  info: { label: 'Info', color: 'green-500' },
  edit: { label: 'Edit', color: 'teal-500' },
  convert: { label: 'Convert', color: 'orange-500' },
} as const;

export const TOOLS: PDFTool[] = [
  { id: 'split', name: 'Split PDF', description: 'Split document into separate files', icon: 'Scissors', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: SplitTool, estimateTime: time['split'], generateFilename: (n, o) => generateFilename('split', n, o) },
  { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDFs into one', icon: 'Layers', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: true, pipelineCompatible: false, component: MergeTool, estimateTime: time['merge'], generateFilename: (n, o) => generateFilename('merge', n, o) },
  { id: 'reorder', name: 'Reorder Pages', description: 'Rearrange pages by dragging', icon: 'ArrowUpDown', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: ReorderTool, estimateTime: time['reorder'], generateFilename: (n, o) => generateFilename('reorder', n, o) },
  { id: 'delete-pages', name: 'Delete Pages', description: 'Remove unwanted pages', icon: 'Trash2', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: DeletePagesTool, estimateTime: time['delete-pages'], generateFilename: (n, o) => generateFilename('delete-pages', n, o) },
  { id: 'extract-pages', name: 'Extract Pages', description: 'Pull specific pages into a new PDF', icon: 'FileOutput', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: ExtractPagesTool, estimateTime: time['extract-pages'], generateFilename: (n, o) => generateFilename('extract-pages', n, o) },
  { id: 'add-blank-pages', name: 'Add Blank Pages', description: 'Insert blank pages at any position', icon: 'FilePlus', category: 'organize', categoryColor: 'blue-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: AddBlankPagesTool, estimateTime: time['add-blank-pages'], generateFilename: (n, o) => generateFilename('add-blank-pages', n, o) },
  { id: 'rotate', name: 'Rotate Pages', description: 'Rotate pages in any direction', icon: 'RotateCw', category: 'transform', categoryColor: 'amber-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: RotateTool, estimateTime: time['rotate'], generateFilename: (n, o) => generateFilename('rotate', n, o) },
  { id: 'scale', name: 'Scale / Resize', description: 'Change page dimensions', icon: 'Maximize', category: 'transform', categoryColor: 'amber-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: ScaleResizeTool, estimateTime: time['scale'], generateFilename: (n, o) => generateFilename('scale', n, o) },
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size', icon: 'Minimize2', category: 'transform', categoryColor: 'amber-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: CompressTool, estimateTime: time['compress'], generateFilename: (n, o) => generateFilename('compress', n, o) },
  { id: 'add-page-numbers', name: 'Page Numbers', description: 'Add page numbers to your document', icon: 'Hash', category: 'stamp', categoryColor: 'purple-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: PageNumbersTool, estimateTime: time['add-page-numbers'], generateFilename: (n, o) => generateFilename('add-page-numbers', n, o) },
  { id: 'text-watermark', name: 'Text Watermark', description: 'Add text watermark to pages', icon: 'Type', category: 'stamp', categoryColor: 'purple-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: TextWatermarkTool, estimateTime: time['text-watermark'], generateFilename: (n, o) => generateFilename('text-watermark', n, o) },
  { id: 'encrypt', name: 'Encrypt PDF', description: 'Password-protect your PDF', icon: 'Lock', category: 'security', categoryColor: 'red-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: EncryptTool, estimateTime: time['encrypt'], generateFilename: (n, o) => generateFilename('encrypt', n, o) },
  { id: 'unlock', name: 'Unlock PDF', description: 'Remove password protection', icon: 'Unlock', category: 'security', categoryColor: 'red-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: UnlockTool, estimateTime: time['unlock'], generateFilename: (n, o) => generateFilename('unlock', n, o) },
  { id: 'edit-metadata', name: 'Edit Metadata', description: 'View and edit document properties', icon: 'FileText', category: 'info', categoryColor: 'green-500', acceptsMultipleFiles: false, pipelineCompatible: true, component: MetadataEditorTool, estimateTime: time['edit-metadata'], generateFilename: (n, o) => generateFilename('edit-metadata', n, o) },
  { id: 'edit-pdf', name: 'Edit PDF', description: 'Fill forms, add text, and edit content', icon: 'PenLine', category: 'edit', categoryColor: 'teal-500', acceptsMultipleFiles: false, pipelineCompatible: false, component: EditPDFTool, estimateTime: time['edit-pdf'], generateFilename: (n, o) => generateFilename('edit-pdf', n, o) },
  { id: 'convert-to-pdf', name: 'Convert to PDF', description: 'Convert images and documents to PDF', icon: 'FileUp', category: 'convert', categoryColor: 'orange-500', acceptsMultipleFiles: true, pipelineCompatible: false, component: ConvertToPDFTool, estimateTime: time['convert-to-pdf'], generateFilename: (n, o) => generateFilename('convert-to-pdf', n, o) },
];

export const TOOL_MAP: Record<string, PDFTool> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
