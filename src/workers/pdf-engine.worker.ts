import { PDFDocument, degrees, StandardFonts, rgb, PDFName, PDFRawStream, PDFRef, PDFDict } from 'pdf-lib-with-encrypt';

interface WorkerRequest {
  id: string;
  operation: string;
  pdfBytes: ArrayBuffer[];
  options: Record<string, unknown>;
}

interface WorkerResponse {
  id: string;
  type: 'progress' | 'result' | 'error' | 'cancelled';
  progress?: { step: string; current: number; total: number };
  result?: { files: { name: string; bytes: ArrayBuffer; pageCount?: number }[] };
  error?: string;
}

type ProgressFn = (progress: { step: string; current: number; total: number }) => void;
type CancelFn = () => boolean;
type OperationHandler = (
  pdfBytes: ArrayBuffer[],
  options: Record<string, unknown>,
  onProgress: ProgressFn,
  isCancelled: CancelFn
) => Promise<{ files: { name: string; bytes: ArrayBuffer; pageCount?: number }[] } | null>;

const cancelled = new Set<string>();
const operations: Record<string, OperationHandler> = {};

self.onmessage = async (e: MessageEvent) => {
  const data = e.data;

  if (data.type === 'cancel') {
    cancelled.add(data.id);
    return;
  }

  const request = data as WorkerRequest;
  const { id, operation, pdfBytes, options } = request;

  const onProgress: ProgressFn = (progress) => {
    self.postMessage({ id, type: 'progress', progress } as WorkerResponse);
  };

  const isCancelled: CancelFn = () => cancelled.has(id);

  try {
    const handler = operations[operation];
    if (!handler) {
      self.postMessage({ id, type: 'error', error: `Unknown operation: ${operation}` } as WorkerResponse);
      return;
    }

    const result = await handler(pdfBytes, options, onProgress, isCancelled);

    if (isCancelled()) {
      cancelled.delete(id);
      self.postMessage({ id, type: 'cancelled' } as WorkerResponse);
      return;
    }

    if (result) {
      const transferables = result.files.map((f) => f.bytes);
      self.postMessage({ id, type: 'result', result } as WorkerResponse, { transfer: transferables });
    }
  } catch (err) {
    cancelled.delete(id);
    self.postMessage({
      id,
      type: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    } as WorkerResponse);
  }
};

// Stub echo operation for testing
operations['echo'] = async (pdfBytes, _options, onProgress) => {
  onProgress({ step: 'Echoing', current: 1, total: 1 });
  return { files: [{ name: 'echo.pdf', bytes: pdfBytes[0], pageCount: 1 }] };
};

// ---------------------------------------------------------------------------
// Phase 2 Operations
// ---------------------------------------------------------------------------

/**
 * split — Split a single PDF into one or more PDFs based on page ranges.
 *
 * Options:
 *   mode: 'single' | 'separate'
 *   ranges: number[][] — e.g. [[0,1,2], [5,6]] (0-indexed page indices)
 *
 * 'single'   → all selected pages merged into one output PDF
 * 'separate' → one output PDF per range
 */
operations['split'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const mode = options.mode as 'single' | 'separate';
  const ranges = options.ranges as number[][];
  const sourceDoc = await PDFDocument.load(pdfBytes[0]);

  if (mode === 'single') {
    // Flatten all ranges into one list of page indices
    const allPages = ranges.flat();
    const newDoc = await PDFDocument.create();

    onProgress({ step: 'Splitting pages', current: 0, total: allPages.length });

    const copiedPages = await newDoc.copyPages(sourceDoc, allPages);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    onProgress({ step: 'Splitting pages', current: allPages.length, total: allPages.length });

    const saved = await newDoc.save();
    return {
      files: [
        {
          name: 'split.pdf',
          bytes: saved.buffer as ArrayBuffer,
          pageCount: newDoc.getPageCount(),
        },
      ],
    };
  } else {
    // separate mode: one PDF per range
    const files: { name: string; bytes: ArrayBuffer; pageCount?: number }[] = [];
    const total = ranges.length;

    for (let i = 0; i < ranges.length; i++) {
      if (isCancelled()) return null;

      onProgress({ step: `Splitting range ${i + 1} of ${total}`, current: i, total });

      const range = ranges[i];
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(sourceDoc, range);
      for (const page of copiedPages) {
        newDoc.addPage(page);
      }

      const saved = await newDoc.save();
      files.push({
        name: `split-${i + 1}.pdf`,
        bytes: saved.buffer as ArrayBuffer,
        pageCount: newDoc.getPageCount(),
      });
    }

    onProgress({ step: 'Splitting complete', current: total, total });
    return { files };
  }
};

/**
 * merge — Merge multiple PDFs into a single PDF.
 *
 * Options:
 *   order: number[] — indices into pdfBytes array, specifying merge order
 */
operations['merge'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const order = options.order as number[];
  const mergedDoc = await PDFDocument.create();
  const total = order.length;

  for (let i = 0; i < order.length; i++) {
    if (isCancelled()) return null;

    onProgress({ step: `Merging file ${i + 1} of ${total}`, current: i, total });

    const fileIndex = order[i];
    const sourceDoc = await PDFDocument.load(pdfBytes[fileIndex]);
    const pageCount = sourceDoc.getPageCount();
    const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);
    const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  onProgress({ step: 'Merge complete', current: total, total });

  const saved = await mergedDoc.save();
  return {
    files: [
      {
        name: 'merged.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: mergedDoc.getPageCount(),
      },
    ],
  };
};

/**
 * rotate — Rotate specific pages in a PDF.
 *
 * Options:
 *   rotations: Record<number, number> — pageIndex → degrees (e.g. { 0: 90, 2: 180 })
 */
operations['rotate'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const rotations = options.rotations as Record<number, number>;
  const doc = await PDFDocument.load(pdfBytes[0]);
  const pages = doc.getPages();
  const entries = Object.entries(rotations);
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    if (isCancelled()) return null;

    const [pageIndexStr, degreesValue] = entries[i];
    const pageIndex = Number(pageIndexStr);

    onProgress({ step: `Rotating page ${pageIndex + 1}`, current: i, total });

    pages[pageIndex].setRotation(degrees(degreesValue));
  }

  onProgress({ step: 'Rotation complete', current: total, total });

  const saved = await doc.save();
  return {
    files: [
      {
        name: 'rotated.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: doc.getPageCount(),
      },
    ],
  };
};

/**
 * reorder — Reorder pages in a PDF.
 *
 * Options:
 *   newOrder: number[] — array of original page indices in the desired new order
 */
operations['reorder'] = async (pdfBytes, options, onProgress) => {
  const newOrder = options.newOrder as number[];
  const sourceDoc = await PDFDocument.load(pdfBytes[0]);
  const newDoc = await PDFDocument.create();

  onProgress({ step: 'Reordering pages', current: 0, total: 1 });

  const copiedPages = await newDoc.copyPages(sourceDoc, newOrder);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  onProgress({ step: 'Reorder complete', current: 1, total: 1 });

  const saved = await newDoc.save();
  return {
    files: [
      {
        name: 'reordered.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: newDoc.getPageCount(),
      },
    ],
  };
};

/**
 * delete — Delete specific pages from a PDF.
 *
 * Options:
 *   pagesToDelete: number[] — 0-indexed page indices to remove
 *
 * Throws if attempting to delete all pages.
 */
operations['delete'] = async (pdfBytes, options, onProgress) => {
  const pagesToDelete = new Set(options.pagesToDelete as number[]);
  const sourceDoc = await PDFDocument.load(pdfBytes[0]);
  const totalPages = sourceDoc.getPageCount();

  if (pagesToDelete.size >= totalPages) {
    throw new Error('Cannot delete all pages from a PDF');
  }

  onProgress({ step: 'Deleting pages', current: 0, total: 1 });

  // Collect indices of pages to keep
  const pagesToKeep: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!pagesToDelete.has(i)) {
      pagesToKeep.push(i);
    }
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, pagesToKeep);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  onProgress({ step: 'Delete complete', current: 1, total: 1 });

  const saved = await newDoc.save();
  return {
    files: [
      {
        name: 'modified.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: newDoc.getPageCount(),
      },
    ],
  };
};

/**
 * extract — Extract specific pages from a PDF into one or more new PDFs.
 *
 * Options:
 *   pages: number[] — 0-indexed page indices to extract
 *   mode: 'single' | 'individual'
 *
 * 'single'     → all selected pages into one output PDF
 * 'individual' → each selected page as its own separate PDF
 */
operations['extract'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const pages = options.pages as number[];
  const mode = options.mode as 'single' | 'individual';
  const sourceDoc = await PDFDocument.load(pdfBytes[0]);

  if (mode === 'single') {
    onProgress({ step: 'Extracting pages', current: 0, total: pages.length });

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(sourceDoc, pages);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    onProgress({ step: 'Extraction complete', current: pages.length, total: pages.length });

    const saved = await newDoc.save();
    return {
      files: [
        {
          name: 'extracted.pdf',
          bytes: saved.buffer as ArrayBuffer,
          pageCount: newDoc.getPageCount(),
        },
      ],
    };
  } else {
    // individual mode: one PDF per page
    const files: { name: string; bytes: ArrayBuffer; pageCount?: number }[] = [];
    const total = pages.length;

    for (let i = 0; i < pages.length; i++) {
      if (isCancelled()) return null;

      onProgress({ step: `Extracting page ${pages[i] + 1}`, current: i, total });

      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(sourceDoc, [pages[i]]);
      newDoc.addPage(copiedPage);

      const saved = await newDoc.save();
      files.push({
        name: `page-${pages[i] + 1}.pdf`,
        bytes: saved.buffer as ArrayBuffer,
        pageCount: 1,
      });
    }

    onProgress({ step: 'Extraction complete', current: total, total });
    return { files };
  }
};

// ---------------------------------------------------------------------------
// Phase 3 Operations
// ---------------------------------------------------------------------------

// Helper: parse hex color string to rgb values
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

// Helper: convert number to lowercase roman numerals
function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

/**
 * add-blank-pages — Insert blank pages into a PDF at a specified position.
 *
 * Options:
 *   position: 'before' | 'after' | 'beginning' | 'end'
 *   targetPage: number — 0-indexed page index (used for 'before'/'after')
 *   count: number — number of blank pages to insert
 *   width: number — width of blank pages in points
 *   height: number — height of blank pages in points
 */
operations['add-blank-pages'] = async (pdfBytes, options, onProgress) => {
  const position = options.position as 'before' | 'after' | 'beginning' | 'end';
  const targetPage = options.targetPage as number;
  const count = options.count as number;
  const width = options.width as number;
  const height = options.height as number;

  const sourceDoc = await PDFDocument.load(pdfBytes[0]);
  const newDoc = await PDFDocument.create();
  const totalPages = sourceDoc.getPageCount();
  const allIndices = Array.from({ length: totalPages }, (_, i) => i);
  const copiedPages = await newDoc.copyPages(sourceDoc, allIndices);

  onProgress({ step: 'Adding blank pages', current: 0, total: 1 });

  if (position === 'beginning') {
    // Insert blank pages first, then all original pages
    for (let i = 0; i < count; i++) {
      newDoc.addPage([width, height]);
    }
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }
  } else if (position === 'end') {
    // All original pages first, then blank pages
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }
    for (let i = 0; i < count; i++) {
      newDoc.addPage([width, height]);
    }
  } else if (position === 'before') {
    // Copy pages, inserting blanks before targetPage
    for (let i = 0; i < copiedPages.length; i++) {
      if (i === targetPage) {
        for (let j = 0; j < count; j++) {
          newDoc.addPage([width, height]);
        }
      }
      newDoc.addPage(copiedPages[i]);
    }
  } else if (position === 'after') {
    // Copy pages, inserting blanks after targetPage
    for (let i = 0; i < copiedPages.length; i++) {
      newDoc.addPage(copiedPages[i]);
      if (i === targetPage) {
        for (let j = 0; j < count; j++) {
          newDoc.addPage([width, height]);
        }
      }
    }
  }

  onProgress({ step: 'Blank pages added', current: 1, total: 1 });

  const saved = await newDoc.save();
  return {
    files: [
      {
        name: 'with-blank-pages.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: newDoc.getPageCount(),
      },
    ],
  };
};

/**
 * add-page-numbers — Draw page numbers on pages of a PDF.
 *
 * Options:
 *   position: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
 *   format: '1' | 'Page 1' | 'Page 1 of N' | '1/N' | 'roman'
 *   startNumber: number — the number to start counting from
 *   fontSize: number
 *   color: string — hex color e.g. '#000000'
 *   margin: number — distance from page edge in points
 *   pageRange?: number[] — 0-indexed page indices to apply numbering to (all pages if omitted)
 */
operations['add-page-numbers'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const position = options.position as string;
  const format = options.format as string;
  const startNumber = options.startNumber as number;
  const fontSize = options.fontSize as number;
  const colorHex = options.color as string;
  const margin = options.margin as number;
  const pageRange = options.pageRange as number[] | undefined;

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { r, g, b } = parseHexColor(colorHex);
  const fontColor = rgb(r, g, b);
  const totalPageCount = pages.length;

  const targetPages = pageRange ?? Array.from({ length: totalPageCount }, (_, i) => i);
  const total = targetPages.length;

  for (let idx = 0; idx < targetPages.length; idx++) {
    if (isCancelled()) return null;

    const pageIndex = targetPages[idx];
    const page = pages[pageIndex];
    const { width, height } = page.getSize();
    const currentNumber = startNumber + idx;

    onProgress({ step: `Adding page number ${idx + 1} of ${total}`, current: idx, total });

    // Format the page number text
    let text: string;
    switch (format) {
      case '1':
        text = String(currentNumber);
        break;
      case 'Page 1':
        text = `Page ${currentNumber}`;
        break;
      case 'Page 1 of N':
        text = `Page ${currentNumber} of ${targetPages.length}`;
        break;
      case '1/N':
        text = `${currentNumber}/${targetPages.length}`;
        break;
      case 'roman':
        text = toRoman(currentNumber);
        break;
      default:
        text = String(currentNumber);
    }

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    // Calculate x position
    let x: number;
    if (position.includes('left')) {
      x = margin;
    } else if (position.includes('right')) {
      x = width - textWidth - margin;
    } else {
      // center
      x = (width - textWidth) / 2;
    }

    // Calculate y position
    let y: number;
    if (position.startsWith('top')) {
      y = height - margin - textHeight;
    } else if (position.startsWith('bottom')) {
      y = margin;
    } else {
      // middle
      y = (height - textHeight) / 2;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: fontColor,
    });
  }

  onProgress({ step: 'Page numbers added', current: total, total });

  const saved = await pdfDoc.save();
  return {
    files: [
      {
        name: 'numbered.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * add-watermark — Draw a text watermark on pages of a PDF.
 *
 * Options:
 *   text: string — watermark text
 *   fontSize: number
 *   angle: number — rotation angle in degrees
 *   opacity: number — 0 to 1
 *   color: string — hex color e.g. '#FF0000'
 *   mode: 'center' | 'tile'
 *   pageRange?: number[] — 0-indexed page indices (all pages if omitted)
 */
operations['add-watermark'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const text = options.text as string;
  const fontSize = options.fontSize as number;
  const angle = options.angle as number;
  const opacity = options.opacity as number;
  const colorHex = options.color as string;
  const mode = options.mode as 'center' | 'tile';
  const pageRange = options.pageRange as number[] | undefined;

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { r, g, b } = parseHexColor(colorHex);
  const fontColor = rgb(r, g, b);

  const targetPages = pageRange ?? Array.from({ length: pages.length }, (_, i) => i);
  const total = targetPages.length;

  for (let idx = 0; idx < targetPages.length; idx++) {
    if (isCancelled()) return null;

    const pageIndex = targetPages[idx];
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    onProgress({ step: `Adding watermark to page ${idx + 1} of ${total}`, current: idx, total });

    if (mode === 'center') {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const x = (width - textWidth) / 2;
      const y = height / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: fontColor,
        rotate: degrees(angle),
        opacity,
      });
    } else {
      // tile mode: draw a grid of watermarks across the page
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const spacingX = textWidth + fontSize * 4;
      const spacingY = fontSize * 6;

      for (let tileY = -spacingY; tileY < height + spacingY; tileY += spacingY) {
        for (let tileX = -textWidth; tileX < width + textWidth; tileX += spacingX) {
          page.drawText(text, {
            x: tileX,
            y: tileY,
            size: fontSize,
            font,
            color: fontColor,
            rotate: degrees(angle),
            opacity,
          });
        }
      }
    }
  }

  onProgress({ step: 'Watermark added', current: total, total });

  const saved = await pdfDoc.save();
  return {
    files: [
      {
        name: 'watermarked.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * scale — Scale/resize pages in a PDF to target dimensions.
 *
 * Options:
 *   targetWidth: number — target width in points
 *   targetHeight: number — target height in points
 *   fitContent: boolean — if true, scale content to fit; if false, just change MediaBox
 *   pages?: number[] — 0-indexed page indices to scale (all pages if omitted)
 */
operations['scale'] = async (pdfBytes, options, onProgress, isCancelled) => {
  const targetWidth = options.targetWidth as number;
  const targetHeight = options.targetHeight as number;
  const fitContent = options.fitContent as boolean;
  const targetPageIndices = options.pages as number[] | undefined;

  const sourceDoc = await PDFDocument.load(pdfBytes[0]);
  const totalPages = sourceDoc.getPageCount();
  const pagesToScale = new Set(targetPageIndices ?? Array.from({ length: totalPages }, (_, i) => i));

  if (fitContent) {
    // For fitContent: embed pages from source into a new document, drawing them scaled
    const newDoc = await PDFDocument.create();
    const total = totalPages;

    for (let i = 0; i < totalPages; i++) {
      if (isCancelled()) return null;

      onProgress({ step: `Scaling page ${i + 1} of ${total}`, current: i, total });

      if (pagesToScale.has(i)) {
        // Embed the source page as a Form XObject in the new document
        const sourcePages = sourceDoc.getPages();
        const [embeddedPage] = await newDoc.embedPages([sourcePages[i]]);
        const newPage = newDoc.addPage([targetWidth, targetHeight]);

        // Calculate scale to fit while preserving aspect ratio
        const origWidth = embeddedPage.width;
        const origHeight = embeddedPage.height;
        const scaleX = targetWidth / origWidth;
        const scaleY = targetHeight / origHeight;
        const scale = Math.min(scaleX, scaleY);
        const drawWidth = origWidth * scale;
        const drawHeight = origHeight * scale;

        // Center the content on the page
        const x = (targetWidth - drawWidth) / 2;
        const y = (targetHeight - drawHeight) / 2;

        newPage.drawPage(embeddedPage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        });
      } else {
        // Non-targeted page: copy as-is
        const [copiedPage] = await newDoc.copyPages(sourceDoc, [i]);
        newDoc.addPage(copiedPage);
      }
    }

    onProgress({ step: 'Scale complete', current: total, total });

    const saved = await newDoc.save();
    return {
      files: [
        {
          name: 'scaled.pdf',
          bytes: saved.buffer as ArrayBuffer,
          pageCount: newDoc.getPageCount(),
        },
      ],
    };
  } else {
    // Non-fitContent: just modify the MediaBox
    const total = pagesToScale.size;
    let current = 0;
    const pages = sourceDoc.getPages();

    for (let i = 0; i < totalPages; i++) {
      if (isCancelled()) return null;

      if (pagesToScale.has(i)) {
        onProgress({ step: `Resizing page ${i + 1}`, current, total });
        pages[i].setMediaBox(0, 0, targetWidth, targetHeight);
        current++;
      }
    }

    onProgress({ step: 'Resize complete', current: total, total });

    const saved = await sourceDoc.save();
    return {
      files: [
        {
          name: 'scaled.pdf',
          bytes: saved.buffer as ArrayBuffer,
          pageCount: sourceDoc.getPageCount(),
        },
      ],
    };
  }
};

/**
 * encrypt — Encrypt a PDF with user and owner passwords and permission settings.
 *
 * Options:
 *   userPassword: string
 *   ownerPassword: string
 *   permissions: { printing: boolean, copying: boolean, modifying: boolean }
 */
operations['encrypt'] = async (pdfBytes, options, onProgress) => {
  onProgress({ step: 'Encrypting PDF', current: 0, total: 1 });

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);

  await pdfDoc.encrypt({
    userPassword: options.userPassword as string,
    ownerPassword: options.ownerPassword as string,
    permissions: {
      printing: (options.permissions as any).printing ? 'highResolution' : undefined,
      copying: (options.permissions as any).copying,
      modifying: (options.permissions as any).modifying,
    },
  });

  const saved = await pdfDoc.save();

  onProgress({ step: 'Encryption complete', current: 1, total: 1 });

  return {
    files: [
      {
        name: 'encrypted.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * unlock — Remove encryption from a PDF using the provided password.
 *
 * Options:
 *   password: string — the password to unlock the PDF
 */
operations['unlock'] = async (pdfBytes, options, onProgress) => {
  onProgress({ step: 'Unlocking PDF', current: 0, total: 1 });

  const pdfDoc = await PDFDocument.load(pdfBytes[0], {
    password: options.password as string,
  });

  const saved = await pdfDoc.save();

  onProgress({ step: 'Unlock complete', current: 1, total: 1 });

  return {
    files: [
      {
        name: 'unlocked.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * edit-metadata — Edit or clear metadata fields in a PDF.
 *
 * Options:
 *   title?: string
 *   author?: string
 *   subject?: string
 *   keywords?: string
 *   creator?: string
 *   producer?: string
 *   clearAll?: boolean — if true, set all fields to empty string
 */
operations['edit-metadata'] = async (pdfBytes, options, onProgress) => {
  onProgress({ step: 'Editing metadata', current: 0, total: 1 });

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);

  if (options.clearAll) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
  } else {
    if (options.title !== undefined) pdfDoc.setTitle(options.title as string);
    if (options.author !== undefined) pdfDoc.setAuthor(options.author as string);
    if (options.subject !== undefined) pdfDoc.setSubject(options.subject as string);
    if (options.keywords !== undefined) pdfDoc.setKeywords((options.keywords as string).split(',').map((k: string) => k.trim()));
    if (options.creator !== undefined) pdfDoc.setCreator(options.creator as string);
    if (options.producer !== undefined) pdfDoc.setProducer(options.producer as string);
  }

  onProgress({ step: 'Metadata updated', current: 1, total: 1 });

  const saved = await pdfDoc.save();
  return {
    files: [
      {
        name: 'metadata-edited.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

// ---------------------------------------------------------------------------
// Phase 6 Operations
// ---------------------------------------------------------------------------

// Helper: get standard page dimensions in points
function getPageDimensions(size: string, orientation: string): [number, number] {
  const sizes: Record<string, [number, number]> = {
    'A4': [595.28, 841.89],
    'Letter': [612, 792],
  };
  const [w, h] = sizes[size] ?? sizes['A4'];
  if (orientation === 'landscape') return [h, w];
  return [w, h];
}

// Helper: calculate fit dimensions for images on a page
function calculateFit(
  imgW: number, imgH: number,
  pageW: number, pageH: number,
  margin: number,
  mode: string
): { x: number; y: number; w: number; h: number } {
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;

  if (mode === 'original') {
    // Center at original size (in points: assume 72 DPI)
    const w = imgW * 72 / 96; // Convert pixels to points
    const h = imgH * 72 / 96;
    return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
  }

  if (mode === 'stretch') {
    return { x: margin, y: margin, w: availW, h: availH };
  }

  if (mode === 'cover') {
    const scale = Math.max(availW / imgW, availH / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
  }

  // contain (default)
  const scale = Math.min(availW / imgW, availH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
}

// Helper: determine auto orientation based on image dimensions
function autoOrientation(imgW: number, imgH: number, orientation: string): string {
  if (orientation !== 'auto') return orientation;
  return imgW > imgH ? 'landscape' : 'portrait';
}

interface StyledWord {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any;
  bold: boolean;
  italic: boolean;
  width: number;
}

interface StyledSegment {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any;
  width: number;
}

interface StyledLine {
  segments: StyledSegment[];
  totalWidth: number;
}

/**
 * convert-to-pdf — Convert images, DOCX, and TXT files to PDF.
 *
 * Options:
 *   files: Array of preprocessed file descriptors
 *   config: { imagePageSize, imageOrientation, imageFitMode, docPageSize, docOrientation, textFontSize, textLineHeight, margin }
 */
operations['convert-to-pdf'] = async (_pdfBytes, options, onProgress, isCancelled) => {
  const files = options.files as Array<{
    type: string;
    name: string;
    bytes?: Uint8Array;
    mimeType?: string;
    width?: number;
    height?: number;
    blocks?: Array<{
      type: string;
      level?: number;
      runs?: Array<{ text: string; bold: boolean; italic: boolean; underline: boolean }>;
      src?: string;
    }>;
  }>;
  const config = options.config as Record<string, unknown>;
  const margin = (config.margin as number) ?? 36; // NOT || 72 — 0 is valid

  const pdfDoc = await PDFDocument.create();
  const total = files.length;

  // Embed standard fonts for document pages
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getFont(bold: boolean, italic: boolean): any {
    if (bold && italic) return helveticaBoldOblique;
    if (bold) return helveticaBold;
    if (italic) return helveticaOblique;
    return helvetica;
  }

  for (let i = 0; i < files.length; i++) {
    if (isCancelled()) return null;
    const file = files[i];
    onProgress({ step: `Converting ${file.name}`, current: i, total });

    if (file.type === 'image' && file.bytes) {
      // Image page
      const imgBytes = file.bytes;
      const mimeType = file.mimeType ?? 'image/png';

      // Embed image — MUST await (async!)
      const embedded = mimeType === 'image/jpeg' || mimeType === 'image/jpg'
        ? await pdfDoc.embedJpg(imgBytes)
        : await pdfDoc.embedPng(imgBytes);

      const imgW = file.width ?? embedded.width;
      const imgH = file.height ?? embedded.height;

      const orientation = autoOrientation(imgW, imgH, (config.imageOrientation as string) ?? 'auto');
      const pageSize = (config.imagePageSize as string) ?? 'A4';

      let pageW: number, pageH: number;
      if (pageSize === 'fit') {
        // Fit page to image size (in points)
        pageW = imgW * 72 / 96 + margin * 2;
        pageH = imgH * 72 / 96 + margin * 2;
      } else {
        [pageW, pageH] = getPageDimensions(pageSize, orientation);
      }

      const fitMode = (config.imageFitMode as string) ?? 'contain';
      const { x, y, w, h } = calculateFit(imgW, imgH, pageW, pageH, margin, fitMode);

      const page = pdfDoc.addPage([pageW, pageH]);
      page.drawImage(embedded, { x, y, width: w, height: h });

    } else if (file.type === 'document' || file.type === 'text') {
      // Document/text pages with block layout
      const blocks = file.blocks ?? [];
      const fontSize = (config.textFontSize as number) ?? 12;
      const lineHeight = (config.textLineHeight as number) ?? 1.5;
      const pageSize = (config.docPageSize as string) ?? 'A4';
      const docOrientation = (config.docOrientation as string) ?? 'portrait';

      const [pageW, pageH] = getPageDimensions(pageSize, docOrientation);
      const contentW = pageW - margin * 2;
      const lineSpacing = fontSize * lineHeight;

      let page = pdfDoc.addPage([pageW, pageH]);
      let cursorY = pageH - margin;

      function newPage() {
        page = pdfDoc.addPage([pageW, pageH]);
        cursorY = pageH - margin;
      }

      for (const block of blocks) {
        if (block.type === 'image' && block.src) {
          // Inline image from DOCX
          try {
            const dataMatch = block.src.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
            if (dataMatch) {
              const imgBytes = Uint8Array.from(atob(dataMatch[2]), (c) => c.charCodeAt(0));
              const isJpeg = dataMatch[1] === 'jpeg' || dataMatch[1] === 'jpg';
              const emb = isJpeg ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);

              const maxW = contentW;
              const scale = Math.min(1, maxW / emb.width);
              const drawW = emb.width * scale;
              const drawH = emb.height * scale;

              if (cursorY - drawH < margin) newPage();

              cursorY -= drawH;
              page.drawImage(emb, { x: margin, y: cursorY, width: drawW, height: drawH });
              cursorY -= lineSpacing * 0.5; // Small gap after image
            }
          } catch {
            // Skip failed inline images
          }
          continue;
        }

        const runs = block.runs ?? [];
        if (runs.length === 0) continue;

        // Determine block-level font size
        let blockFontSize = fontSize;
        let blockExtraSpacing = 0;
        if (block.type === 'heading') {
          const level = block.level ?? 2;
          blockFontSize = fontSize * (level === 1 ? 2 : level === 2 ? 1.5 : level === 3 ? 1.25 : 1.1);
          blockExtraSpacing = blockFontSize * 0.5;
        }

        const blockLineSpacing = blockFontSize * lineHeight;
        let prefix = '';
        if (block.type === 'list-item') {
          prefix = '  \u2022 ';
        }

        // Word-wrap across run boundaries
        const words: StyledWord[] = [];
        if (prefix) {
          const font = getFont(false, false);
          words.push({ text: prefix, font, bold: false, italic: false, width: font.widthOfTextAtSize(prefix, blockFontSize) });
        }

        for (const run of runs) {
          const font = getFont(run.bold || (block.type === 'heading'), run.italic);
          const runWords = run.text.split(/(\s+)/);
          for (const w of runWords) {
            if (w.length === 0) continue;
            words.push({
              text: w,
              font,
              bold: run.bold || (block.type === 'heading'),
              italic: run.italic,
              width: font.widthOfTextAtSize(w, blockFontSize),
            });
          }
        }

        // Build lines
        const lines: StyledLine[] = [];
        let currentLine: StyledSegment[] = [];
        let currentLineWidth = 0;

        for (const word of words) {
          if (currentLineWidth + word.width > contentW && currentLine.length > 0) {
            lines.push({ segments: currentLine, totalWidth: currentLineWidth });
            currentLine = [];
            currentLineWidth = 0;
          }
          currentLine.push({ text: word.text, font: word.font, width: word.width });
          currentLineWidth += word.width;
        }
        if (currentLine.length > 0) {
          lines.push({ segments: currentLine, totalWidth: currentLineWidth });
        }

        // Add extra spacing before headings
        if (blockExtraSpacing > 0) {
          cursorY -= blockExtraSpacing;
        }

        // Draw lines
        for (const line of lines) {
          cursorY -= blockLineSpacing;
          if (cursorY < margin) {
            newPage();
            cursorY -= blockLineSpacing;
          }

          let x = margin;
          for (const seg of line.segments) {
            const { r, g, b: bVal } = { r: 0, g: 0, b: 0 }; // Black text
            page.drawText(seg.text, {
              x,
              y: cursorY,
              size: blockFontSize,
              font: seg.font,
              color: rgb(r, g, bVal),
            });
            x += seg.width;
          }
        }

        // Add paragraph spacing
        cursorY -= blockLineSpacing * 0.3;
      }
    }
  }

  onProgress({ step: 'Conversion complete', current: total, total });

  const saved = await pdfDoc.save();
  return {
    files: [
      {
        name: 'converted.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * edit-pdf — Apply text boxes, text edits, and optional form flattening.
 *
 * Options:
 *   textBoxes: TextBox[]
 *   textEdits: TextEdit[]
 *   flattenForm: boolean
 */
operations['edit-pdf'] = async (pdfBytes, options, onProgress) => {
  onProgress({ step: 'Applying edits', current: 0, total: 1 });

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);

  // Optional flatten
  if (options.flattenForm) {
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // No form or already flattened — ignore
    }
  }

  const pages = pdfDoc.getPages();

  // Helper: get standard font from family/bold/italic
  function getStdFont(family: string, bold: boolean, italic: boolean) {
    if (family === 'Courier') {
      if (bold && italic) return StandardFonts.CourierBoldOblique;
      if (bold) return StandardFonts.CourierBold;
      if (italic) return StandardFonts.CourierOblique;
      return StandardFonts.Courier;
    }
    if (family === 'TimesRoman') {
      if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
      if (bold) return StandardFonts.TimesRomanBold;
      if (italic) return StandardFonts.TimesRomanItalic;
      return StandardFonts.TimesRoman;
    }
    // Helvetica (default)
    if (bold && italic) return StandardFonts.HelveticaBoldOblique;
    if (bold) return StandardFonts.HelveticaBold;
    if (italic) return StandardFonts.HelveticaOblique;
    return StandardFonts.Helvetica;
  }

  // Map PDF.js font names to StandardFonts
  function mapPDFJsFontToStandard(pdfJsFontName: string): string {
    const name = pdfJsFontName.toLowerCase();
    if (name.includes('courier')) {
      if (name.includes('bold') && (name.includes('oblique') || name.includes('italic'))) return 'CourierBoldOblique';
      if (name.includes('bold')) return 'CourierBold';
      if (name.includes('oblique') || name.includes('italic')) return 'CourierOblique';
      return 'Courier';
    }
    if (name.includes('times')) {
      if (name.includes('bold') && (name.includes('italic'))) return 'TimesRomanBoldItalic';
      if (name.includes('bold')) return 'TimesRomanBold';
      if (name.includes('italic')) return 'TimesRomanItalic';
      return 'TimesRoman';
    }
    // Default to Helvetica
    if (name.includes('bold') && (name.includes('oblique') || name.includes('italic'))) return 'HelveticaBoldOblique';
    if (name.includes('bold')) return 'HelveticaBold';
    if (name.includes('oblique') || name.includes('italic')) return 'HelveticaOblique';
    return 'Helvetica';
  }

  // Draw text boxes
  const textBoxes = (options.textBoxes ?? []) as Array<{
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    style: { fontFamily: string; fontSize: number; color: string; bold: boolean; italic: boolean };
  }>;

  for (const tb of textBoxes) {
    if (tb.pageIndex >= pages.length) continue;
    const page = pages[tb.pageIndex];
    const fontEnum = getStdFont(tb.style.fontFamily, tb.style.bold, tb.style.italic);
    const font = await pdfDoc.embedFont(fontEnum);
    const { r, g, b: bVal } = parseHexColor(tb.style.color);

    // Draw text at top of box: baseline = bottom (y) + height - fontSize
    // In PDF space, y is the box bottom, text should appear near the top
    page.drawText(tb.text, {
      x: tb.x,
      y: tb.y + tb.height - tb.style.fontSize,
      size: tb.style.fontSize,
      font,
      color: rgb(r, g, bVal),
      maxWidth: tb.width,
    });
  }

  // Apply text edits (cover + redraw)
  const textEdits = (options.textEdits ?? []) as Array<{
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    newText: string;
    originalFontName: string;
    fontSize: number;
    coverColor: string;
  }>;

  for (const te of textEdits) {
    if (te.pageIndex >= pages.length) continue;
    const page = pages[te.pageIndex];

    // Draw cover rect (descender-aware)
    const coverY = te.y - te.height * 0.25 - 1;
    const coverH = te.height * 1.25 + 2;
    const { r: cr, g: cg, b: cb } = parseHexColor(te.coverColor);
    page.drawRectangle({
      x: te.x - 1,
      y: coverY,
      width: te.width + 2,
      height: coverH,
      color: rgb(cr, cg, cb),
    });

    // Draw new text
    const fontName = mapPDFJsFontToStandard(te.originalFontName);
    const fontEnum = StandardFonts[fontName as keyof typeof StandardFonts] ?? StandardFonts.Helvetica;
    const font = await pdfDoc.embedFont(fontEnum);

    page.drawText(te.newText, {
      x: te.x,
      y: te.y,
      size: te.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  onProgress({ step: 'Edit complete', current: 1, total: 1 });

  const saved = await pdfDoc.save();
  return {
    files: [
      {
        name: 'edited.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

/**
 * compress — Compress a PDF to reduce file size.
 *
 * Options:
 *   level: 'low' | 'medium' | 'high'
 *   stripMetadata: boolean
 *   flattenForms: boolean
 */
operations['compress'] = async (pdfBytes, options, onProgress) => {
  const level = (options.level as 'low' | 'medium' | 'high') ?? 'medium';
  const stripMetadata = level === 'high' ? true : (options.stripMetadata as boolean) ?? false;
  const flattenForms = level === 'high' ? true : (options.flattenForms as boolean) ?? false;

  onProgress({ step: 'Loading PDF', current: 0, total: 4 });

  const pdfDoc = await PDFDocument.load(pdfBytes[0]);

  // Step 1: Flatten forms if requested
  if (flattenForms) {
    onProgress({ step: 'Flattening forms', current: 1, total: 4 });
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {
      // No form or already flattened — ignore
    }
  }

  // Step 2: Compress uncompressed streams (medium and high)
  if (level === 'medium' || level === 'high') {
    onProgress({ step: 'Compressing streams', current: 2, total: 4 });
    const context = pdfDoc.context;
    const indirectObjects = context.enumerateIndirectObjects();

    for (const [ref, obj] of indirectObjects) {
      if (obj instanceof PDFRawStream) {
        const dict = obj.dict;
        const filter = dict.get(PDFName.of('Filter'));
        // Only compress streams that have no filter (uncompressed)
        if (!filter) {
          try {
            const contents = obj.contents;
            const compressedStream = context.flateStream(contents);
            context.assign(ref as PDFRef, compressedStream);
          } catch {
            // Skip streams that fail to compress
          }
        }
      }
    }
  }

  // Step 3: Strip metadata if requested
  if (stripMetadata) {
    onProgress({ step: 'Stripping metadata', current: 3, total: 4 });
    // Clear info dict fields
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');

    // Remove XMP metadata stream from catalog
    try {
      const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root) as PDFDict;
      if (catalog && catalog.get(PDFName.of('Metadata'))) {
        catalog.delete(PDFName.of('Metadata'));
      }
    } catch {
      // Ignore if catalog manipulation fails
    }
  }

  // Step 4: Save with object streams enabled
  onProgress({ step: 'Saving compressed PDF', current: 4, total: 4 });
  const saved = await pdfDoc.save({ useObjectStreams: true });

  return {
    files: [
      {
        name: 'compressed.pdf',
        bytes: saved.buffer as ArrayBuffer,
        pageCount: pdfDoc.getPageCount(),
      },
    ],
  };
};

export { operations, PDFDocument, degrees, StandardFonts, rgb };
