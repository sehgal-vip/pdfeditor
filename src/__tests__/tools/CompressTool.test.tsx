import { render, screen, fireEvent } from '@testing-library/react';
import { CompressTool } from '@/components/tools/CompressTool';
import { useProcessingStore } from '@/stores/processingStore';

// Common mocks
vi.mock('@/lib/pdf-worker-client', () => ({
  workerClient: {
    cancelAll: vi.fn(),
    process: vi.fn().mockResolvedValue({
      files: [{ name: 'compressed.pdf', bytes: new Uint8Array([37, 80, 68, 70]), pageCount: 5 }],
      processingTime: 100,
    }),
  },
}));
vi.mock('@/lib/thumbnail-renderer', () => ({
  renderPageThumbnail: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock'),
  getPageCount: vi.fn().mockResolvedValue(5),
  clearDocumentCache: vi.fn(),
}));
vi.mock('@/lib/render-queue', () => ({
  renderQueue: {
    enqueue: vi.fn().mockResolvedValue('data:image/jpeg;base64,mock'),
    cancel: vi.fn(),
    cancelAll: vi.fn(),
  },
}));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

// Mock dependent components
vi.mock('@/components/common/FileDropZone', () => ({
  FileDropZone: ({ onFilesLoaded }: { onFilesLoaded: (files: any[]) => void }) => (
    <div data-testid="file-drop-zone">
      <span>Drop your PDF</span>
      <button
        data-testid="mock-load"
        onClick={() =>
          onFilesLoaded([
            {
              id: 'test-1',
              name: 'test.pdf',
              bytes: new Uint8Array(new Array(10240).fill(0)),
              pageCount: 5,
              fileSize: 10240,
              isEncrypted: false,
            },
          ])
        }
      >
        Load File
      </button>
    </div>
  ),
}));
vi.mock('@/components/common/ProgressBar', () => ({
  ProgressBar: () => <div data-testid="progress-bar" />,
}));
vi.mock('@/components/common/PreviewPanel', () => ({
  PreviewPanel: () => <div data-testid="preview-panel" />,
}));
vi.mock('@/components/common/DownloadPanel', () => ({
  DownloadPanel: ({ onReset }: { onReset: () => void }) => (
    <div data-testid="download-panel">
      <button onClick={onReset}>Reset</button>
    </div>
  ),
}));
vi.mock('@/components/common/ToolSuggestions', () => ({
  ToolSuggestions: () => null,
}));

describe('CompressTool', () => {
  beforeEach(() => {
    useProcessingStore.getState().reset();
  });

  it('shows FileDropZone initially', () => {
    render(<CompressTool />);
    expect(screen.getByText('Drop your PDF')).toBeInTheDocument();
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
  });

  it('hides tool UI when no file is loaded', () => {
    render(<CompressTool />);
    expect(screen.queryByText('Compression level')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Compress PDF/ })).not.toBeInTheDocument();
  });

  it('shows compression level options after file load', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    expect(screen.getByText('Compression level')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Extra High')).toBeInTheDocument();
  });

  it('shows all four compression level descriptions', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    expect(screen.getByText(/Fast baseline compression/)).toBeInTheDocument();
    expect(screen.getByText(/Balanced mode\. Recompresses streams/)).toBeInTheDocument();
    expect(screen.getByText(/Aggressive mode\./)).toBeInTheDocument();
    expect(screen.getByText(/Extreme size reduction for scan-heavy files/)).toBeInTheDocument();
  });

  it('defaults to Medium compression level', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    const mediumRadio = screen.getByDisplayValue('medium');
    expect(mediumRadio).toBeChecked();
  });

  it('shows strip metadata and flatten forms checkboxes for low/medium levels', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Medium is default — should show checkboxes
    expect(screen.getByText('Strip metadata')).toBeInTheDocument();
    expect(screen.getByText('Flatten forms')).toBeInTheDocument();
  });

  it('hides checkboxes and shows "included" message for High level', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Switch to high
    fireEvent.click(screen.getByDisplayValue('high'));

    expect(screen.getByText(/included in High compression/)).toBeInTheDocument();
    expect(screen.queryByText('Strip metadata')).not.toBeInTheDocument();
    expect(screen.queryByText('Flatten forms')).not.toBeInTheDocument();
  });

  it('hides checkboxes and shows "included" message for Extra High level', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Switch to extra-high
    fireEvent.click(screen.getByDisplayValue('extra-high'));

    expect(screen.getByText(/included in Extra High compression/)).toBeInTheDocument();
    expect(screen.queryByText('Strip metadata')).not.toBeInTheDocument();
    expect(screen.queryByText('Flatten forms')).not.toBeInTheDocument();
  });

  it('shows amber warning when Extra High is selected', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // No warning for medium
    expect(screen.queryByText(/converts all color images to grayscale/)).not.toBeInTheDocument();

    // Switch to extra-high
    fireEvent.click(screen.getByDisplayValue('extra-high'));

    expect(screen.getByText(/prioritizes file size above visual fidelity/)).toBeInTheDocument();
  });

  it('does not show amber warning for other levels', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Check low
    fireEvent.click(screen.getByDisplayValue('low'));
    expect(screen.queryByText(/prioritizes file size above visual fidelity/)).not.toBeInTheDocument();

    // Check medium
    fireEvent.click(screen.getByDisplayValue('medium'));
    expect(screen.queryByText(/prioritizes file size above visual fidelity/)).not.toBeInTheDocument();

    // Check high
    fireEvent.click(screen.getByDisplayValue('high'));
    expect(screen.queryByText(/prioritizes file size above visual fidelity/)).not.toBeInTheDocument();
  });

  it('shows file size and estimated reduction', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    expect(screen.getByText(/File size:/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated after compression/)).toBeInTheDocument();
  });

  it('updates estimate range when switching to Extra High', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Switch to extra-high
    fireEvent.click(screen.getByDisplayValue('extra-high'));

    // Extra high estimates: 70-90%
    expect(screen.getByText(/70–90%/)).toBeInTheDocument();
  });

  it('shows updated medium and high estimate ranges', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    fireEvent.click(screen.getByDisplayValue('medium'));
    expect(screen.getByText(/20–40%/)).toBeInTheDocument();

    fireEvent.click(screen.getByDisplayValue('high'));
    expect(screen.getByText(/35–60%/)).toBeInTheDocument();
  });

  it('shows Compress PDF button after file load', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    const buttons = screen.getAllByRole('button', { name: /Compress PDF/ });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('Compress PDF button is enabled when file is loaded', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    const button = screen.getAllByRole('button', { name: /Compress PDF/ })[0];
    expect(button).not.toBeDisabled();
  });

  it('button text changes to Processing during processing', async () => {
    const { act } = await import('react');

    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    act(() => {
      useProcessingStore.getState().startProcessing();
    });

    expect(screen.getAllByRole('button', { name: /Processing/ })[0]).toBeInTheDocument();
  });

  it('calls workerClient.process with extra-high level', async () => {
    const { workerClient } = await import('@/lib/pdf-worker-client');
    const { waitFor } = await import('@testing-library/react');

    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Switch to extra-high
    fireEvent.click(screen.getByDisplayValue('extra-high'));

    // Click process button
    const buttons = screen.getAllByRole('button', { name: /Compress PDF/ });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(workerClient.process).toHaveBeenCalledWith(
        'compress',
        expect.anything(),
        expect.objectContaining({
          level: 'extra-high',
          stripMetadata: true,
          flattenForms: true,
        }),
      );
    });
  });

  it('calls workerClient.process with high level and forced options', async () => {
    const { workerClient } = await import('@/lib/pdf-worker-client');
    const { waitFor } = await import('@testing-library/react');

    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    // Switch to high
    fireEvent.click(screen.getByDisplayValue('high'));

    // Click process button
    const buttons = screen.getAllByRole('button', { name: /Compress PDF/ });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(workerClient.process).toHaveBeenCalledWith(
        'compress',
        expect.anything(),
        expect.objectContaining({
          level: 'high',
          stripMetadata: true,
          flattenForms: true,
        }),
      );
    });
  });

  it('switching levels preserves radio selection', () => {
    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    fireEvent.click(screen.getByDisplayValue('extra-high'));
    expect(screen.getByDisplayValue('extra-high')).toBeChecked();
    expect(screen.getByDisplayValue('medium')).not.toBeChecked();

    fireEvent.click(screen.getByDisplayValue('low'));
    expect(screen.getByDisplayValue('low')).toBeChecked();
    expect(screen.getByDisplayValue('extra-high')).not.toBeChecked();
  });

  it('shows result panels after processing', async () => {
    const { waitFor } = await import('@testing-library/react');

    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    const buttons = screen.getAllByRole('button', { name: /Compress PDF/ });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByTestId('preview-panel')).toBeInTheDocument();
      expect(screen.getByTestId('download-panel')).toBeInTheDocument();
    });
  });

  it('resets to initial state after clicking reset in download panel', async () => {
    const { waitFor } = await import('@testing-library/react');

    render(<CompressTool />);
    fireEvent.click(screen.getByTestId('mock-load'));

    const buttons = screen.getAllByRole('button', { name: /Compress PDF/ });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByTestId('download-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
    });
  });
});
