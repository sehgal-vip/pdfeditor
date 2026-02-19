import { generateFilename } from '@/lib/filename-generator';

describe('generateFilename', () => {
  it('T-FN-01: generates split filename with range', () => {
    const result = generateFilename('split', 'doc.pdf', { range: '1-3' });
    expect(result).toBe('doc_pages_1-3.pdf');
  });

  it('T-FN-01b: generates split filename without range', () => {
    const result = generateFilename('split', 'doc.pdf');
    expect(result).toBe('doc_pages_selected.pdf');
  });

  it('T-FN-02: generates merge filename', () => {
    const result = generateFilename('merge', 'doc.pdf', { fileCount: 3 });
    expect(result).toBe('merged_3_files.pdf');
  });

  it('T-FN-03: generates rotate filename', () => {
    const result = generateFilename('rotate', 'doc.pdf');
    expect(result).toBe('doc_rotated.pdf');
  });

  it('T-FN-04: generates encrypt filename', () => {
    const result = generateFilename('encrypt', 'doc.pdf');
    expect(result).toBe('doc_encrypted.pdf');
  });

  it('generates unlock filename', () => {
    const result = generateFilename('unlock', 'doc.pdf');
    expect(result).toBe('doc_unlocked.pdf');
  });

  it('generates reorder filename', () => {
    const result = generateFilename('reorder', 'doc.pdf');
    expect(result).toBe('doc_reordered.pdf');
  });

  it('generates delete-pages filename', () => {
    const result = generateFilename('delete-pages', 'doc.pdf', { deletedCount: 3 });
    expect(result).toBe('doc_3_pages_removed.pdf');
  });

  it('generates extract-pages filename with page number', () => {
    const result = generateFilename('extract-pages', 'doc.pdf', { pageNum: 2 });
    expect(result).toBe('doc_page_2.pdf');
  });

  it('generates watermark filename', () => {
    const result = generateFilename('text-watermark', 'doc.pdf');
    expect(result).toBe('doc_watermarked.pdf');
  });

  it('generates page numbers filename', () => {
    const result = generateFilename('add-page-numbers', 'doc.pdf');
    expect(result).toBe('doc_numbered.pdf');
  });

  it('generates scale filename', () => {
    const result = generateFilename('scale', 'doc.pdf', { target: 'A4' });
    expect(result).toBe('doc_resized_A4.pdf');
  });

  it('generates metadata filename', () => {
    const result = generateFilename('edit-metadata', 'doc.pdf');
    expect(result).toBe('doc_edited.pdf');
  });

  it('generates blank pages filename', () => {
    const result = generateFilename('add-blank-pages', 'doc.pdf');
    expect(result).toBe('doc_with_blanks.pdf');
  });

  it('handles unknown tool with _processed suffix', () => {
    const result = generateFilename('unknown-tool', 'doc.pdf');
    expect(result).toBe('doc_processed.pdf');
  });

  it('strips .pdf extension before adding suffix', () => {
    const result = generateFilename('rotate', 'MyDocument.pdf');
    expect(result).toBe('MyDocument_rotated.pdf');
  });

  it('sanitizes special characters', () => {
    const result = generateFilename('rotate', 'my<file>.pdf');
    expect(result).toBe('myfile_rotated.pdf');
  });

  it('generates edit-pdf filename', () => {
    const result = generateFilename('edit-pdf', 'doc.pdf');
    expect(result).toBe('doc_edited.pdf');
  });

  it('generates convert-to-pdf filename for single file', () => {
    const result = generateFilename('convert-to-pdf', 'photo.jpg', { fileCount: 1 });
    expect(result).toBe('photo.pdf');
  });

  it('generates convert-to-pdf filename for multiple files', () => {
    const result = generateFilename('convert-to-pdf', 'photo.jpg', { fileCount: 3 });
    expect(result).toBe('converted.pdf');
  });

  it('generates convert-to-pdf filename strips extension correctly', () => {
    const result = generateFilename('convert-to-pdf', 'document.docx', { fileCount: 1 });
    expect(result).toBe('document.pdf');
  });

  it('generates compress filename', () => {
    const result = generateFilename('compress', 'doc.pdf');
    expect(result).toBe('doc_compressed.pdf');
  });
});
