import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const documentCache = new Map<string, pdfjsLib.PDFDocumentProxy>();

function getCacheKey(bytes: Uint8Array): string {
  // Simple hash based on length + first/last bytes
  const len = bytes.length;
  const first = bytes.slice(0, 16);
  const last = bytes.slice(-16);
  return `${len}-${Array.from(first).join(',')}-${Array.from(last).join(',')}`;
}

export async function renderPageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale = 0.5
): Promise<string | null> {
  try {
    const key = getCacheKey(pdfBytes);
    let doc = documentCache.get(key);

    if (!doc) {
      doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
      documentCache.set(key, doc);
    }

    const page = await doc.getPage(pageIndex + 1); // pdfjs is 1-indexed
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

export async function getPageCount(pdfBytes: Uint8Array): Promise<number> {
  try {
    const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
    return doc.numPages;
  } catch {
    return 0;
  }
}

export function clearDocumentCache(): void {
  for (const doc of documentCache.values()) {
    doc.destroy();
  }
  documentCache.clear();
}
