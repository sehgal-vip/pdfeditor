function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, '').slice(0, 200);
}

function stripPdfExt(name: string): string {
  return name.replace(/\.pdf$/i, '');
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

export function generateFilename(
  toolId: string,
  originalName: string,
  options?: Record<string, unknown>
): string {
  const base = stripPdfExt(originalName);

  // Special case: convert-to-pdf
  if (toolId === 'convert-to-pdf') {
    const fileCount = (options?.fileCount as number) ?? 1;
    if (fileCount > 1) {
      return sanitize('converted.pdf');
    }
    return sanitize(`${stripExt(originalName)}.pdf`);
  }

  const suffixMap: Record<string, string> = {
    split: `_pages_${(options?.range as string) || 'selected'}`,
    merge: `merged_${(options?.fileCount as number) || 2}_files`,
    reorder: '_reordered',
    'delete-pages': `_${(options?.deletedCount as number) || 0}_pages_removed`,
    'extract-pages': options?.pageNum ? `_page_${options.pageNum}` : '_extracted',
    'add-blank-pages': '_with_blanks',
    rotate: '_rotated',
    scale: `_resized_${(options?.target as string) || 'custom'}`,
    'add-page-numbers': '_numbered',
    'text-watermark': '_watermarked',
    encrypt: '_encrypted',
    unlock: '_unlocked',
    'edit-metadata': '_edited',
    'edit-pdf': '_edited',
    compress: '_compressed',
  };

  const suffix = suffixMap[toolId] || '_processed';
  const isMerge = toolId === 'merge';
  const filename = isMerge ? `${suffix}.pdf` : `${base}${suffix}.pdf`;
  return sanitize(filename);
}
