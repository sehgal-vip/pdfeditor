import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileDropZone } from '@/components/common/FileDropZone';
import { ERRORS } from '@/lib/error-messages';

// Mock pdf-lib-with-encrypt
vi.mock('pdf-lib-with-encrypt', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({ getPageCount: () => 5 }),
  },
}));

vi.mock('@/lib/thumbnail-renderer', () => ({
  getPageCount: vi.fn().mockResolvedValue(5),
  renderPageThumbnail: vi.fn(),
  clearDocumentCache: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('@/stores/fileStore', () => ({
  useFileStore: vi.fn((selector) => {
    const state = { recentFiles: [], addToCache: vi.fn() };
    return selector(state);
  }),
}));

function createMockPDFFile(name = 'test.pdf') {
  const pdfContent = '%PDF-1.4 mock content';
  const bytes = new TextEncoder().encode(pdfContent);
  return new File([bytes], name, { type: 'application/pdf' });
}

function createNonPDFContentFile(name = 'fake.pdf') {
  const content = 'This is not a PDF at all';
  const bytes = new TextEncoder().encode(content);
  return new File([bytes], name, { type: 'application/pdf' });
}

describe('FileDropZone', () => {
  const onFilesLoaded = vi.fn();

  beforeEach(() => {
    onFilesLoaded.mockClear();
  });

  // 1. Initial upload state
  it('shows initial upload state with drop zone text', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    expect(screen.getByText(/Drop your PDF/)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/)).toBeInTheDocument();
  });

  // 2. Has upload button with aria-label
  it('has upload button with aria-label "Upload PDF file"', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    expect(screen.getByRole('button', { name: 'Upload PDF file' })).toBeInTheDocument();
  });

  // 3. Highlights on drag over
  it('highlights on drag over with border-indigo-400 class', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const dropZone = screen.getByRole('button', { name: 'Upload PDF file' });
    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    expect(dropZone.className).toContain('border-indigo-400');
  });

  // 4. Drag leave removes highlight
  it('removes highlight on drag leave', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const dropZone = screen.getByRole('button', { name: 'Upload PDF file' });
    fireEvent.dragOver(dropZone, { preventDefault: () => {} });
    expect(dropZone.className).toContain('border-indigo-400');
    fireEvent.dragLeave(dropZone);
    expect(dropZone.className).not.toContain('border-indigo-400');
  });

  // 5. Shows error for non-PDF files
  it('shows error for non-PDF files', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('Please select PDF files.')).toBeInTheDocument();
  });

  // 6. Shows plural text when multiple=true
  it('shows plural text "PDFs" when multiple=true', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} multiple />);
    expect(screen.getByText(/Drop your PDFs/)).toBeInTheDocument();
  });

  // 7. Hidden file input has .pdf accept attribute
  it('has hidden file input with .pdf accept attribute', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe('.pdf');
  });

  // 8. File input is visually hidden with sr-only class
  it('has file input with sr-only class for accessibility', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.className).toContain('sr-only');
  });

  // 9. Drop zone uses <div> with explicit onClick for reliable file picker trigger
  it('uses a <div> element with onClick handler for file picker trigger', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const dropZone = screen.getByRole('button', { name: 'Upload PDF file' });
    expect(dropZone.tagName).toBe('DIV');
  });

  // 10. File input has tabIndex={-1}
  it('has file input with tabIndex={-1}', () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.tabIndex).toBe(-1);
  });

  // 11. PDF magic bytes validation
  it('shows INVALID_PDF error for file with non-PDF content', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createNonPDFContentFile('fake.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(ERRORS.INVALID_PDF)).toBeInTheDocument();
    });
  });

  // 12. Successful file load shows compact file view
  it('shows compact file view after successful file load', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('document.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText(/5 pages/)).toBeInTheDocument();
  });

  // 13. Remove file button returns to upload state
  it('returns to upload state when file is removed', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('document.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: 'Remove file' });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/Drop your PDF/)).toBeInTheDocument();
    });
  });

  // 14. Multiple mode: shows all loaded files with remove buttons
  it('shows all loaded files with remove buttons in multiple mode', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} multiple />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file1 = createMockPDFFile('first.pdf');
    fireEvent.change(input, { target: { files: [file1] } });

    await waitFor(() => {
      expect(screen.getByText('first.pdf')).toBeInTheDocument();
    });

    const file2 = createMockPDFFile('second.pdf');
    const input2 = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input2, { target: { files: [file2] } });

    await waitFor(() => {
      expect(screen.getByText('second.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('first.pdf')).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: 'Remove file' });
    expect(removeButtons.length).toBe(2);
  });

  // 15. Multiple mode: shows "Add more files" as a label
  it('shows "Add more files" label in multiple mode after loading a file', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} multiple />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('test.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('+ Add more files')).toBeInTheDocument();
    });
  });

  // 16. Drag and drop calls handleFiles
  it('processes files on drag and drop', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const dropZone = screen.getByRole('button', { name: 'Upload PDF file' });
    const file = createMockPDFFile('dropped.pdf');

    const dataTransfer = {
      files: [file],
      types: ['Files'],
    };

    fireEvent.drop(dropZone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
    });
  });

  // 17. Error state shows error message and "Try again" button
  it('shows error message and "Try again" button in error state', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createNonPDFContentFile('bad.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(ERRORS.INVALID_PDF)).toBeInTheDocument();
    });
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  // 18. "Try again" button clears error
  it('"Try again" button clears error and returns to upload state', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createNonPDFContentFile('bad.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.queryByText(ERRORS.INVALID_PDF)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Drop your PDF/)).toBeInTheDocument();
  });

  // 19. Error state — drop zone click does not trigger file picker
  it('does not trigger file picker in error state', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    const file = createNonPDFContentFile('bad.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(ERRORS.INVALID_PDF)).toBeInTheDocument();
    });

    const dropZone = screen.getByRole('button', { name: 'Upload PDF file' });
    fireEvent.click(dropZone);
    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  // 20. Password-protected PDF shows password input
  it('shows password input for encrypted PDF', async () => {
    const { PDFDocument } = await import('pdf-lib-with-encrypt');
    (PDFDocument.load as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('password required to decrypt')
    );

    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('encrypted.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(ERRORS.ENCRYPTED_NEEDS_PASSWORD)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByText('Unlock')).toBeInTheDocument();
  });

  // 21. onFilesLoaded callback is called with loaded files
  it('calls onFilesLoaded with loaded files after successful processing', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('report.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFilesLoaded).toHaveBeenCalledTimes(1);
    });

    const callArgs = onFilesLoaded.mock.calls[0][0];
    expect(callArgs).toHaveLength(1);
    expect(callArgs[0].name).toBe('report.pdf');
    expect(callArgs[0].pageCount).toBe(5);
    expect(callArgs[0].bytes).toBeInstanceOf(Uint8Array);
  });

  // 22. onFilesLoaded is called with empty array when file is removed
  it('calls onFilesLoaded with empty array when file is removed', async () => {
    render(<FileDropZone onFilesLoaded={onFilesLoaded} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockPDFFile('document.pdf');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    onFilesLoaded.mockClear();
    const removeButton = screen.getByRole('button', { name: 'Remove file' });
    fireEvent.click(removeButton);

    expect(onFilesLoaded).toHaveBeenCalledWith([]);
  });
});
