# Quire — Test Cases

## 1. Functional Test Cases

### 1.1 File Upload (FileDropZone)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-UP-01 | Upload valid PDF via click | Click drop zone > select a .pdf file | File loads, shows name/size/page count |
| F-UP-02 | Upload valid PDF via drag-and-drop | Drag .pdf file onto drop zone | File loads, drop zone highlights on dragover |
| F-UP-03 | Upload non-PDF file | Select a .txt or .jpg file | Error: "Please select PDF files." |
| F-UP-04 | Upload encrypted PDF | Upload a password-protected PDF | Password prompt appears |
| F-UP-05 | Unlock encrypted PDF with correct password | Enter correct password and click Unlock | File loads with page count |
| F-UP-06 | Unlock encrypted PDF with wrong password | Enter wrong password | Error message, prompt remains |
| F-UP-07 | Upload large file (>50MB) | Upload a 60MB PDF | Console warning, file still loads |
| F-UP-08 | Upload invalid PDF (wrong magic bytes) | Upload a file renamed to .pdf | Error: "This file is not a valid PDF." |
| F-UP-09 | Recent files appear after upload | Upload a file, reset, return to upload | "Recent files" section shows previous file |
| F-UP-10 | Click recent file to re-use | Click a file in "Recent files" | File loads without re-upload |
| F-UP-11 | Keyboard Enter opens file picker | Tab to drop zone > press Enter | File picker opens (ARIA `role="button"` contract) |
| F-UP-12 | Keyboard Space opens file picker | Tab to drop zone > press Space | File picker opens (ARIA `role="button"` contract) |
| F-UP-13 | Click to browse works on Safari | Click drop zone on Safari / iOS Safari | File picker opens (requires `sr-only`, not `display:none`) |
| F-UP-14 | Click-to-browse works on all tools | Navigate to each tool page > click drop zone | File picker opens on all 15 tools using FileDropZone |
| F-UP-15 | Multiple mode: no React setState-during-render | Upload file in Merge (multiple mode) | No console error "Cannot update a component while rendering" |
| F-UP-16 | ConvertToPDF drop zone keyboard accessible | Tab to Convert to PDF drop zone > press Enter or Space | File picker opens (same fix as FileDropZone) |
| F-UP-17 | ConvertToPDF drop zone works on Safari | Click Convert to PDF drop zone on Safari | File picker opens (sr-only, not hidden) |

#### Known Issues (Fixed)

| ID | Issue | Root Cause | Fix |
|----|-------|------------|-----|
| F-UP-BUG-01 | Keyboard Enter/Space did not open file picker | Drop zone used `<label>` with `role="button"` + `tabIndex={0}` but no `onKeyDown` handler. Native `<label>` does not respond to Enter/Space like `<button>` does — WCAG violation. | Replaced `<label htmlFor>` with `<div onClick>` + explicit `onKeyDown` for Enter/Space. |
| F-UP-BUG-02 | Click to browse may fail on Safari | File input used `className="hidden"` (`display:none`), which prevents label-triggered activation on Safari/iOS. | Changed to `className="sr-only"` (visually hidden but browser-accessible). |
| F-UP-BUG-03 | Child elements could accidentally open file picker | Password form "Unlock" button and error "Try again" button used `e.preventDefault()` (label-specific). | Changed to `e.stopPropagation()` to properly prevent click bubbling to the parent div's `onClick`. |
| F-UP-BUG-04 | React "Cannot update a component while rendering" in multiple mode | `onFilesLoaded(next)` was called inside `setLoadedFiles` updater function, triggering parent state update during render. | Moved `onFilesLoaded` call outside the updater — updater runs synchronously so the computed `next` is available immediately after. |
| F-UP-BUG-05 | ConvertToPDF drop zone had same 3 bugs as FileDropZone | Used `<label>` without keyboard handling, `className="hidden"` on input, no ARIA attributes. | Applied same fixes: `<div>` + `onClick` + `onKeyDown` + `role="button"` + `aria-label`, `sr-only` input, `tabIndex={-1}`. |

### 1.2 Split PDF Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-SP-01 | Split single range | Upload 5-page PDF > select pages 1-3 > Extract pages | Output PDF has 3 pages |
| F-SP-02 | Split into separate ranges | Enter "1-2, 3-5" in separate mode > Split | 2 output PDFs (2 pages + 3 pages) |
| F-SP-03 | Invalid range text | Enter "abc" in range input | Parse error shown, process button disabled |
| F-SP-04 | Range exceeds page count | Enter "1-100" on a 5-page PDF | Only valid pages extracted (1-5) |

### 1.3 Merge PDFs Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-MG-01 | Merge two PDFs | Upload 2 PDFs > Merge | Single output with combined page count |
| F-MG-02 | Reorder files before merge | Upload 2 PDFs > move second to first > Merge | Output has file 2's pages first |
| F-MG-03 | Remove file from merge list | Upload 3 PDFs > remove middle file | 2 files remain in list |
| F-MG-04 | Merge with fewer than 2 files | Upload 1 file > click Merge | Error: "Merge requires at least 2 PDF files." |

### 1.4 Rotate Pages Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-RO-01 | Rotate single page 90° | Click page 1 thumbnail | Page shows 90° badge |
| F-RO-02 | Rotate all pages 90° CW | Click "Rotate All 90° CW" | All pages show 90° badge |
| F-RO-03 | Cycle rotation to 0° | Click same page 4 times | Returns to 0° (no badge) |
| F-RO-04 | Process rotated pages | Rotate page 1 > click Rotate Pages | Output PDF has page 1 rotated |
| F-RO-05 | Reset all rotations | Rotate some pages > click "Reset all" | All rotation badges cleared |

### 1.5 Reorder Pages Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-RE-01 | Move page forward | Click right arrow on page 1 | Page 1 moves to position 2 |
| F-RE-02 | Move page backward | Click left arrow on page 2 | Page 2 moves to position 1 |
| F-RE-03 | Process unchanged order | Don't reorder > check Process button | Process button is disabled |
| F-RE-04 | Process reordered pages | Swap pages > Process | Output has new page order |

### 1.6 Delete Pages Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-DE-01 | Delete single page | Select page 2 > Delete | Output has N-1 pages |
| F-DE-02 | Delete multiple pages | Select pages 1, 3, 5 > Delete | Output has N-3 pages |
| F-DE-03 | Attempt to delete all pages | Select all pages | Error: "Cannot delete all pages." Button disabled |
| F-DE-04 | Batch select even pages | Click "Even" > Delete | Even-numbered pages removed |

### 1.7 Extract Pages Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-EX-01 | Extract as single PDF | Select pages 1,3 > "As single PDF" > Extract | One PDF with 2 pages |
| F-EX-02 | Extract as individual PDFs | Select pages 1,3 > "Each page separate" > Extract | Two PDFs (1 page each), ZIP download |

### 1.8 Add Blank Pages Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-BL-01 | Add blank page at end | Set "At end", count=1 > Process | Output has N+1 pages |
| F-BL-02 | Add blank page at beginning | Set "At beginning", count=2 > Process | Output has N+2 pages, first 2 blank |
| F-BL-03 | Add blank before page 3 | Set "Before page", target=3 > Process | Blank page inserted at position 3 |
| F-BL-04 | Custom page size | Select "Custom", set 500x500 > Process | Blank page has custom dimensions |

### 1.9 Page Numbers Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-PN-01 | Add page numbers bottom-center | Default settings > Process | Numbers appear at bottom center |
| F-PN-02 | Roman numeral format | Select "i, ii, iii" format > Process | Pages show roman numerals |
| F-PN-03 | "Page X of N" format | Select "Page 1 of N" > Process | Format shows "Page 1 of 5" etc. |
| F-PN-04 | Apply to page range only | Set "Page range" > enter "2-4" > Process | Only pages 2-4 get numbers |
| F-PN-05 | Custom font size and color | Set size=24, color=red > Process | Numbers larger and red |

### 1.10 Text Watermark Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-WM-01 | Center watermark | Enter "DRAFT" > mode=Center > Process | Centered text on each page |
| F-WM-02 | Tile watermark | Enter "CONFIDENTIAL" > mode=Tile > Process | Repeated text grid on pages |
| F-WM-03 | Custom opacity and angle | Set opacity=0.5, angle=30 > Process | Watermark visible at angle |
| F-WM-04 | Apply to specific pages | Set "Page range" > enter "1-2" > Process | Only pages 1-2 have watermark |

### 1.11 Scale / Resize Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-SC-01 | Scale to A4 with fit content | Select A4, fitContent=true > Process | Pages resized to A4, content scaled |
| F-SC-02 | Scale to Letter | Select Letter > Process | Pages have Letter dimensions |
| F-SC-03 | Custom dimensions | Select Custom, enter 500x700 > Process | Pages have 500x700pt dimensions |
| F-SC-04 | Scale selected pages only | Select "Selected pages" > pick pages > Process | Only selected pages resized |

### 1.12 Encrypt Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-EN-01 | Encrypt with password | Enter password + confirm > Encrypt | Output PDF requires password to open |
| F-EN-02 | Password mismatch | Enter different passwords | Error shown, button disabled |
| F-EN-03 | Weak password indicator | Enter "abc" | Red bar, "Weak" label |
| F-EN-04 | Strong password indicator | Enter "MyP@ssw0rd123!" | Green bar, "Strong" label |
| F-EN-05 | Set permissions | Uncheck "Allow copying" > Encrypt | Output PDF disallows text copying |

### 1.13 Unlock Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-UL-01 | Unlock encrypted PDF | Upload encrypted PDF > enter password > Unlock | Output PDF opens without password |
| F-UL-02 | Wrong password | Enter incorrect password | Error: "Incorrect password." |
| F-UL-03 | Upload non-encrypted PDF | Upload unencrypted PDF | Info: "This PDF is not password-protected." |

### 1.14 Edit Metadata Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-MD-01 | Set title and author | Enter title + author > Save Changes | Output PDF has new metadata |
| F-MD-02 | Clear all metadata | Click "Clear all metadata" | Output PDF has empty metadata fields |
| F-MD-03 | Set keywords | Enter "report, 2024, finance" > Save | Keywords stored in PDF metadata |

### 1.15 Compress PDF Tool

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-CP-01 | Upload PDF and see all 4 compression levels | Upload any PDF | Radio buttons for Low, Medium, High, and Extra High are shown |
| F-CP-02 | Low compression baseline | Upload text+vector PDF > select Low > Compress | Output PDF is smaller with no visible degradation; target ~5–15% reduction |
| F-CP-03 | Medium compression balanced | Upload mixed-content PDF > select Medium > Compress | Output PDF target ~20–40% reduction; visible quality change minimal |
| F-CP-04 | High compression aggressive | Upload image-heavy PDF > select High > Compress | Output PDF target ~35–60% reduction with acceptable quality tradeoff |
| F-CP-05 | Extra High extreme mode | Upload scan-heavy PDF > select Extra High > Compress | Output PDF can reach up to ~90% reduction on favorable inputs; quality warning applies |
| F-CP-06 | Extra High warning shown | Select Extra High compression level | Amber warning text about grayscale conversion and quality loss appears |
| F-CP-07 | Warning hidden for other levels | Select Low, Medium, or High | No amber warning about grayscale shown |
| F-CP-08 | Options hidden for High | Select High compression | "Included in High compression" message shown; checkboxes hidden |
| F-CP-09 | Options hidden for Extra High | Select Extra High compression | "Included in Extra High compression" message shown; checkboxes hidden |
| F-CP-10 | Options visible for Low/Medium | Select Low or Medium | Strip metadata and Flatten forms checkboxes visible |
| F-CP-11 | Estimate updates per level | Switch between levels | Estimate ranges update (Low: 5–15%, Medium: 20–40%, High: 35–60%, Extra High: up to 90% on scan-heavy PDFs) |
| F-CP-12 | Extra High forces stripMetadata and flattenForms | Select Extra High > Compress | Worker receives stripMetadata=true and flattenForms=true |
| F-CP-13 | Extra High grayscale conversion | Upload image-heavy PDF > Extra High > Compress | Images in output are grayscale |
| F-CP-14 | Extra High image quality/dimensions | Upload image-heavy PDF > Extra High > Compress | Images recompressed at quality 0.35, max dimension 1024px |
| F-CP-15 | No savings warning | Upload already-optimized PDF > Compress | Warning toast: "Compression did not reduce file size" |
| F-CP-16 | Tier size ordering | Run same PDF with Low, Medium, High, Extra High | Output sizes follow: Extra High <= High <= Medium <= Low (when compression is effective) |
| F-CP-17 | Preserve PDF validity | Run all levels on same input | Every output starts with `%PDF-` and re-loads with PDFDocument.load without error |
| F-CP-18 | Replace-only-if-smaller rule | Use PDF where some streams/images expand when recompressed | Those streams/images are kept original; file is not bloated by replacement |
| F-CP-19 | Unsupported image safety | Compress PDF with unsupported image color spaces/filters | Compression skips unsupported images safely; output still renders |
| F-CP-20 | Small image protection | Compress PDF containing many logos/icons | Small assets are preserved or conservatively processed; no severe icon artifacts |
| F-CP-21 | High/Extra High semantic safety | Compress PDF with links/forms/metadata | Links still work; form flattening and metadata stripping follow selected tier contract |
| F-CP-22 | Runtime efficiency guard | Compress large (100+ page) PDF in each tier | Operation completes without worker crash; progress updates remain responsive |

### 1.16 Pipeline System

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| F-PL-01 | Select tools in pipeline mode | Toggle Pipeline > click 3 tools | Tools show numbered badges (1, 2, 3) |
| F-PL-02 | 5-tool limit enforced | Select 5 tools > try adding 6th | 6th tool card is grayed out |
| F-PL-03 | Merge excluded from pipeline | Toggle Pipeline > check Merge card | Merge card is disabled/grayed |
| F-PL-04 | Load preset | Click "Scan Cleanup" preset | Pipeline populates with unlock, delete-pages, add-page-numbers |
| F-PL-05 | Reorder pipeline steps | Move step 2 up | Step order changes, validation re-runs |
| F-PL-06 | Remove pipeline step | Click X on a step | Step removed, numbers update |
| F-PL-07 | Validation: unlock not first | Add rotate then unlock | Warning: "Unlock should be first step" |
| F-PL-08 | Validation: encrypt not last | Add encrypt then rotate | Warning: "Encrypt should be last step" |
| F-PL-09 | Start pipeline disabled <2 tools | Select 1 tool | "Start Pipeline" button disabled |
| F-PL-10 | Execute 2-step pipeline | Select page-numbers + encrypt > Start > Upload > Apply each | Final output has numbers and encryption |
| F-PL-11 | Skip a pipeline step | During step 2, click "Skip" | Step marked as skipped, input passed through |
| F-PL-12 | Cancel pipeline mid-execution | During step 2, click "Cancel Pipeline" | Returns to pipeline builder |
| F-PL-13 | Retry failed step | Fail a step (e.g., bad config) > click "Retry" | Step returns to configuring state |
| F-PL-14 | Pipeline summary after completion | Complete all steps | Summary shows all steps with done/skipped status |

---

## 2. Technical Test Cases

### 2.1 Web Worker Operations

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-WK-01 | Worker initializes | App loads | Worker created without errors |
| T-WK-02 | Worker processes split operation | Send split request via workerClient | Returns ToolOutput with correct files |
| T-WK-03 | Worker processes merge operation | Send merge request with 2 PDFs | Returns single merged PDF bytes |
| T-WK-04 | Worker handles cancellation | Start operation, call cancelAll() | Operation returns 'cancelled' status |
| T-WK-05 | Worker reports progress | Start multi-page operation | Progress updates received (step, current, total) |
| T-WK-06 | Worker handles invalid PDF | Send corrupt bytes to worker | Returns error message, doesn't crash |
| T-WK-07 | Worker handles empty options | Send operation with {} options | Uses defaults, doesn't crash |
| T-WK-08 | Worker transfers ArrayBuffers | Check bytes after transfer | Sender's copy is detached (transferred) |

### 2.2 PDF-lib Operations

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-PD-01 | Output has valid PDF magic bytes | Process any tool | Output starts with `%PDF-` |
| T-PD-02 | Output is loadable by pdf-lib | Process then reload output with PDFDocument.load() | Loads without error |
| T-PD-03 | Encrypt uses separate encrypt() call | Encrypt a PDF | pdfDoc.encrypt() called, not save({...encryption}) |
| T-PD-04 | Scale uses embedPages for fitContent | Scale with fitContent=true | Creates new doc, embeds pages as Form XObjects |
| T-PD-05 | Page numbers use StandardFonts.Helvetica | Add page numbers | Font embedded correctly, text rendered |
| T-PD-06 | Watermark respects opacity | Add watermark with opacity=0.3 | drawText called with opacity parameter |

### 2.3 Store Management

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-ST-01 | appStore hash routing | Set hash to #split | currentView='tool', currentToolId='split' |
| T-ST-02 | appStore pipeline mode toggle | Call togglePipelineMode() | pipelineMode toggles, selection clears |
| T-ST-03 | fileStore FIFO cache (max 5) | Add 6 files to cache | Only 5 most recent retained |
| T-ST-04 | fileStore dedup by ID | Add same file ID twice | Only one entry in cache |
| T-ST-05 | processingStore lifecycle | Start > progress > result | Status transitions: idle > processing > done |
| T-ST-06 | processingStore reset | Call reset() | All fields return to initial values |
| T-ST-07 | pipelineStore addTool max 5 | Add 6 tools | 6th is rejected, array stays at 5 |
| T-ST-08 | pipelineStore reorderTools | Reorder index 0 to 2 | Tool moves, validation re-runs |
| T-ST-09 | pipelineStore memory cleanup | Complete step 3 | Step 1 intermediate result is deleted |
| T-ST-10 | pipelineStore loadPreset | Load "Scan Cleanup" preset | selectedTools = ['unlock', 'delete-pages', 'add-page-numbers'] |

### 2.4 Pipeline Validator

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-PV-01 | Max 5 tools | Validate 6-tool pipeline | Error: "limited to 5 steps" |
| T-PV-02 | Unlock not first | Validate ['rotate', 'unlock'] | Warning: "Unlock should be first" |
| T-PV-03 | Encrypt not last | Validate ['encrypt', 'rotate'] | Warning: "Encrypt should be last" |
| T-PV-04 | Delete after page numbers | Validate ['add-page-numbers', 'delete-pages'] | Suggestion: "Consider moving Delete before Page Numbers" |
| T-PV-05 | Duplicate tool | Validate ['rotate', 'rotate'] | Suggestion: "'rotate' appears twice" |
| T-PV-06 | Valid pipeline | Validate ['unlock', 'rotate', 'encrypt'] | valid=true, no warnings |
| T-PV-07 | Empty pipeline | Validate [] | valid=true, no warnings |

### 2.5 Page Range Parser

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-PR-01 | Single page | Parse "3" with totalPages=5 | [3] |
| T-PR-02 | Range | Parse "1-3" with totalPages=5 | [1, 2, 3] |
| T-PR-03 | Mixed | Parse "1, 3-5, 8" with totalPages=10 | [1, 3, 4, 5, 8] |
| T-PR-04 | "end" keyword | Parse "3-end" with totalPages=5 | [3, 4, 5] |
| T-PR-05 | Out of range | Parse "10" with totalPages=5 | [] or clamped |
| T-PR-06 | Invalid input | Parse "abc" | Empty array or error |
| T-PR-07 | Deduplication | Parse "1, 1, 2" | [1, 2] (no duplicates) |

### 2.6 Filename Generator

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-FN-01 | Split filename | generateFilename('split', 'doc.pdf', {}) | 'doc_split.pdf' |
| T-FN-02 | Merge filename | generateFilename('merge', 'doc.pdf', {}) | 'doc_merged.pdf' |
| T-FN-03 | Rotate filename | generateFilename('rotate', 'doc.pdf', {}) | 'doc_rotated.pdf' |
| T-FN-04 | Encrypt filename | generateFilename('encrypt', 'doc.pdf', {}) | 'doc_encrypted.pdf' |

### 2.7 Thumbnail Renderer

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-TH-01 | Render page thumbnail | renderPageThumbnail(bytes, 0, 0.5) | Returns JPEG data URL string |
| T-TH-02 | Cache hit | Render same page twice | Second call uses cached document |
| T-TH-03 | Invalid PDF bytes | renderPageThumbnail(new Uint8Array([0]), 0) | Returns null (no crash) |
| T-TH-04 | Get page count | getPageCount(validBytes) | Returns correct number |
| T-TH-05 | Clear cache | clearDocumentCache() | Cache is empty, documents destroyed |

### 2.8 Download Utilities

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| T-DL-01 | Download single file | downloadFile({name, bytes, pageCount}) | Browser save dialog with correct name |
| T-DL-02 | Download as ZIP | downloadAsZip(files, 'output.zip') | ZIP file with all PDFs inside |
| T-DL-03 | Format file size bytes | formatFileSize(500) | "500 B" |
| T-DL-04 | Format file size KB | formatFileSize(2048) | "2.0 KB" |
| T-DL-05 | Format file size MB | formatFileSize(5242880) | "5.0 MB" |

---

## 3. UI Test Cases

### 3.1 Layout and Navigation

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-LY-01 | Header displays "Quire" branding | Load app | "Quire" heading visible in header |
| U-LY-02 | Footer shows privacy message | Load app | "Your files never leave your browser" visible |
| U-LY-03 | Tool grid shows all 13 tools | Load app | 13 tool cards in 5 categorized sections |
| U-LY-04 | Category colors correct | Check tool card borders | Blue=Organize, Amber=Transform, Purple=Stamp, Red=Security, Green=Info |
| U-LY-05 | Category dot indicators | Check category headers | Colored dots before category names |
| U-LY-06 | Hash URL navigates to tool | Navigate to #split | Split tool view opens |
| U-LY-07 | Unknown hash falls back to grid | Navigate to #nonexistent | Grid view shown |
| U-LY-08 | Back button works | Open tool > browser back | Returns to grid |
| U-LY-09 | "Back to tools" button | Click "Back to tools" in any tool | Returns to grid view |
| U-LY-10 | Responsive grid layout | Resize browser to mobile width | Grid stacks to 1 column |

### 3.2 Tool Cards

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-TC-01 | Tool card hover effect | Hover over a tool card | Card lifts (-translate-y-0.5) with shadow |
| U-TC-02 | Tool card click navigates | Click "Split PDF" card | Navigates to split tool (#split) |
| U-TC-03 | Pipeline mode badges | Toggle Pipeline > click 3 tools | Cards show numbered badges (1, 2, 3) |
| U-TC-04 | Pipeline disabled cards | Toggle Pipeline > check Merge | Merge card grayed out, cursor not-allowed |
| U-TC-05 | Pipeline 5-tool max grayout | Select 5 tools | Remaining unselected cards grayed out |

### 3.3 File Drop Zone

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-FD-01 | Drop zone initial state | Open any tool | Shows upload icon + "Drop your PDF here or click to browse" |
| U-FD-02 | Drag over highlight | Drag file over drop zone | Border turns indigo, background indigo-50 |
| U-FD-03 | Loading spinner | Upload a large file | Spinner shown during processing |
| U-FD-04 | File info after upload | Upload PDF | Shows file name, size (KB/MB), page count |
| U-FD-05 | Remove file button | Click X on loaded file | File removed, drop zone reappears |
| U-FD-06 | Error state styling | Upload non-PDF | Red border, red alert icon, error text |

### 3.4 Thumbnail Grid

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-TG-01 | Thumbnails render | Upload multi-page PDF in Rotate tool | Page thumbnails visible in grid |
| U-TG-02 | Page number badges | Check thumbnail grid | Each thumbnail has page number badge |
| U-TG-03 | Selected state overlay | Click thumbnail in Delete tool | Blue border + checkmark overlay |
| U-TG-04 | Delete state overlay | Select page in Delete tool | Red overlay + trash icon |
| U-TG-05 | Rotation badge | Rotate a page in Rotate tool | Rotation degree badge appears |
| U-TG-06 | Keyboard navigation | Tab into grid, use arrow keys | Focus moves between thumbnails |

### 3.5 Progress Bar

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-PB-01 | Indeterminate state | Start processing (no progress yet) | Pulsing full-width bar |
| U-PB-02 | Determinate progress | Processing with page progress | Bar fills proportionally |
| U-PB-03 | Done state | Processing completes | Green bar, "Done" text with check icon |
| U-PB-04 | Error state | Processing fails | Red bar, error message |
| U-PB-05 | Cancel button | During processing, click Cancel | Processing stops, "Cancelled" shown |
| U-PB-06 | ARIA progressbar role | Inspect progress bar | role="progressbar" with aria-valuenow/min/max |

### 3.6 Preview and Download Panel

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-PD-01 | Preview thumbnail | After processing | First page thumbnail shown |
| U-PD-02 | File info display | After processing | Name, page count, file size shown |
| U-PD-03 | Processing time | After processing | "Completed in X.Xs" shown |
| U-PD-04 | Size comparison | After processing | Green "↓ X% smaller" or neutral size text |
| U-PD-05 | Download button | Click Download | Browser save dialog opens |
| U-PD-06 | Download as ZIP | Multi-file output > Download All as ZIP | ZIP file downloads |
| U-PD-07 | "Process another file" button | Click "Process another file" | Tool resets to upload state |

### 3.7 Pipeline Builder UI

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-PB-01 | Mode toggle | Click "Pipeline" tab | Pipeline mode activates |
| U-PB-02 | Preset cards | Check presets row | 4 preset cards with icons, names, descriptions |
| U-PB-03 | Preset tool chips | Check preset cards | Small chips showing tool names |
| U-PB-04 | Pipeline list empty state | No tools selected | "Select tools from the grid below" placeholder |
| U-PB-05 | Pipeline list items | Select 3 tools | Ordered list with badges, icons, names |
| U-PB-06 | Reorder buttons | Click ChevronUp/ChevronDown | Steps reorder in list |
| U-PB-07 | Remove button | Click X on a step | Step removed from list |
| U-PB-08 | Validation warnings inline | Create invalid pipeline | Colored warnings below relevant steps |
| U-PB-09 | Start button disabled state | 0 or 1 tools selected | Button disabled |
| U-PB-10 | Clear button | Click Clear | Pipeline list emptied |

### 3.8 Pipeline Execution Wizard UI

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-PE-01 | Sidebar stepper | Start pipeline | Left sidebar shows all steps with status indicators |
| U-PE-02 | Pending step indicator | Check future steps | Gray circle |
| U-PE-03 | Active step indicator | Check current step | Blue pulsing circle |
| U-PE-04 | Done step indicator | Complete a step | Green circle with check |
| U-PE-05 | Failed step indicator | Fail a step | Red circle with X |
| U-PE-06 | Skipped step indicator | Skip a step | Gray circle with dash |
| U-PE-07 | Step config section | Active tool step | Collapsible configuration form shown |
| U-PE-08 | Apply button | Click Apply in a step | Processing starts, progress shown |
| U-PE-09 | Intermediate result card | After step completes | Green card with output info |
| U-PE-10 | Continue/Reconfigure/Skip buttons | After step completes | Three action buttons shown |
| U-PE-11 | Error recovery buttons | After step fails | Retry/Skip/Cancel buttons shown |
| U-PE-12 | Pipeline summary | All steps done | Summary list with status per step |
| U-PE-13 | Final download | All steps done | PreviewPanel + DownloadPanel shown |

### 3.9 Keyboard Shortcuts

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-KS-01 | ? key opens shortcuts help | Press ? key | Shortcuts modal appears |
| U-KS-02 | Escape closes modal | Open shortcuts modal > press Escape | Modal closes |
| U-KS-03 | Escape returns to grid | Open a tool > press Escape | Returns to grid view |
| U-KS-04 | Shortcuts disabled in inputs | Focus a text input > press ? | Character typed, modal doesn't open |

### 3.10 Accessibility

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-AC-01 | Focus rings visible | Tab through elements | 2px indigo focus ring on every interactive element |
| U-AC-02 | Icon-only buttons have aria-label | Inspect icon buttons | All have aria-label attribute |
| U-AC-03 | Progress bar ARIA | Inspect progress bar | role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax |
| U-AC-04 | Thumbnail grid ARIA | Inspect grid | role="grid" with role="gridcell" children |
| U-AC-05 | Form inputs have labels | Inspect form fields | All inputs have associated label elements |
| U-AC-06 | Tab order logical | Tab through any tool view | Focus moves in logical top-to-bottom, left-to-right order |
| U-AC-07 | Color not sole indicator | Check all status indicators | Color paired with icons (check/X/dash) |

### 3.11 beforeunload Warning

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| U-BU-01 | Warning during processing | Start processing > close tab | Browser shows leave confirmation |
| U-BU-02 | Warning during pipeline | Mid-pipeline > close tab | Browser shows leave confirmation |
| U-BU-03 | No warning when idle | No active processing > close tab | Tab closes without warning |

---

## 4. Browser Compatibility

| ID | Browser | Key Checks |
|----|---------|------------|
| B-01 | Chrome (latest) | All tools, worker, thumbnails, download |
| B-02 | Firefox (latest) | All tools, worker, thumbnails, download |
| B-03 | Safari (latest) | All tools, worker (check ArrayBuffer transfer), download |
| B-04 | Edge (latest) | All tools, worker, thumbnails, download |
| B-05 | Mobile Chrome | Grid responsive, simple tools (rotate, metadata) work |
| B-06 | Mobile Safari | Grid responsive, file upload works |

---

## 5. Performance Test Cases

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| P-01 | Large page count | 100-page PDF, split tool | Thumbnails load progressively, no freeze |
| P-02 | Large file size | 100MB PDF, merge | Processing completes, memory warning in console |
| P-03 | Many pages rotation | 500-page PDF, rotate all | Cancel works mid-operation, per-page progress |
| P-04 | Pipeline memory | 5-step pipeline, 50-page PDF | Intermediate results cleaned, memory stable |
| P-05 | Rapid thumbnail scroll | 100-page grid, fast scrolling | Render queue handles without browser hang |
| P-06 | Sequential operations | Upload > process > download > "Process another" > repeat | No memory leaks after 5 cycles |
| P-07 | Worker crash recovery | Send extremely corrupt data | Error shown, worker remains functional for next operation |

---

## 6. Visual Test Cases

### 6.1 Header Category Navigation

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-HDR-01 | Open app on desktop viewport (>= 768px) | All 5 category buttons (Organize, Transform, Stamp, Security, Info) visible in header, right-aligned before shortcuts button | Each category button has colored dot matching its theme color (blue, amber, purple, red, green) |
| TC-HDR-02 | Open app on mobile viewport (< 768px) | Category nav is hidden (`hidden md:flex`). Only Quire logo and shortcuts button visible | Resize below 768px — categories disappear; resize above — they reappear |
| TC-HDR-03 | Hover over any category button (e.g., "Organize") | Dropdown appears below the button containing all tools in that category | Dropdown has white background, rounded corners, shadow, and border. Stays visible while mouse is over trigger or dropdown |
| TC-HDR-04 | Move mouse away from both the category button and dropdown | Dropdown disappears immediately | No lingering dropdowns when hovering between different categories |
| TC-HDR-05 | Hover over "Organize" category | Dropdown lists: Split PDF, Merge PDFs, Reorder Pages, Delete Pages, Extract Pages, Add Blank Pages | Each tool shows its icon (colored per category), name (bold), and description (gray, smaller text) |
| TC-HDR-06 | Check all category dropdowns | See table below | Tools match expected grouping |
| TC-HDR-07 | Click "Split PDF" in the Organize dropdown | App navigates to Split PDF tool view. URL hash changes to `#split` | Tool component loads correctly. Repeat for tools from each category |
| TC-HDR-08 | Navigate to Split PDF tool, hover over "Organize" category | "Split PDF" item has indigo highlight (`bg-indigo-50 text-indigo-700`), icon is indigo | Other tools in same dropdown do NOT have indigo highlight |
| TC-HDR-09 | Go to home/grid view, hover over any category | No tools are highlighted with indigo in any dropdown | All tool items show default gray hover styling |
| TC-HDR-10 | Start a PDF operation, click a different tool in header dropdown | `window.confirm` dialog: "You have work in progress. Leave this page?" | Dialog has OK and Cancel buttons |
| TC-HDR-11 | While processing, click another tool and press OK | Navigation proceeds to selected tool. Processing interrupted | URL hash updates, new tool loads |
| TC-HDR-12 | While processing, click another tool and press Cancel | Navigation blocked. User stays on current tool. Processing continues | URL hash unchanged, current tool view persists |
| TC-HDR-13 | With no active processing, click a tool in header dropdown | Navigation happens immediately with no confirm dialog | No dialog shown when status is idle, done, error, or cancelled |
| TC-HDR-14 | Inspect each category button | Organize: blue dot (`bg-blue-500`), Transform: amber (`bg-amber-500`), Stamp: purple (`bg-purple-500`), Security: red (`bg-red-500`), Info: green (`bg-green-500`) | Colors match |
| TC-HDR-15 | Open a dropdown near other UI elements | Dropdown renders above all other content (`z-50`) | No clipping or overlapping issues with page content |
| TC-HDR-16 | Hover over the rightmost category ("Info") | Dropdown is right-aligned (`right-0`) so it doesn't overflow viewport | No horizontal scrollbar; dropdown stays within viewport bounds |
| TC-HDR-17 | Click the keyboard shortcuts (?) button in header | Shortcuts modal/dialog opens | Button is at the far right of the header, after the category nav |
| TC-HDR-18 | Verify header dimensions after adding navigation | Header remains `h-14` (56px tall), with consistent spacing | No layout shift or overflow from the added category buttons |
| TC-HDR-19 | Hover over each category and inspect tool icons | Tool icons use category-themed colors (blue for Organize, amber for Transform, etc.) | Active tool's icon switches to indigo instead of category color |
| TC-HDR-20 | Quickly move mouse across multiple category buttons | Only currently hovered category's dropdown is visible. No overlapping dropdowns | CSS `group-hover` mechanism handles transitions cleanly |
| TC-HDR-21 | Inspect category buttons with screen reader / dev tools | Each category button has `aria-haspopup="true"` | Accessible navigation pattern |
| TC-HDR-22 | Load a PDF into any tool, then click a different tool in header | `window.confirm` dialog: "You have a file loaded. Leave this tool?" | Dialog has OK and Cancel buttons |
| TC-HDR-23 | With a file loaded, click another tool and press OK | Navigation proceeds to the selected tool | URL hash updates, new tool loads |
| TC-HDR-24 | With a file loaded, click another tool and press Cancel | Navigation blocked. User stays on current tool with file intact | URL hash unchanged, current tool view persists |
| TC-HDR-25 | Have file loaded AND be actively processing, then click another tool | "work in progress" message appears (not "file loaded") | Processing state takes priority in warning check |

**TC-HDR-06 Expected Tool Groupings:**

| Category | Expected Tools |
|----------|---------------|
| Organize | Split PDF, Merge PDFs, Reorder Pages, Delete Pages, Extract Pages, Add Blank Pages |
| Transform | Rotate Pages, Scale / Resize |
| Stamp | Page Numbers, Text Watermark |
| Security | Encrypt PDF, Unlock PDF |
| Info | Edit Metadata |

### 6.2 Reorder Pages Tool

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-RO-01 | Upload a multi-page PDF to the Reorder tool | Actual PDF page thumbnail images render in the grid (not just page numbers) | Each card shows rendered page content, with loading pulse animation while loading |
| TC-RO-02 | Upload a PDF where thumbnail rendering fails for a page | Failed thumbnails show amber warning icon with "Page N" text | Graceful degradation — tool is still functional |
| TC-RO-03 | Drag page 1 and drop it after page 3 | Page order updates: pages shift to accommodate the moved page | Grid re-renders with new order. "was N" badges appear on moved pages |
| TC-RO-04 | Start dragging a page card | Dragged card becomes semi-transparent (opacity 0.5) with lighter border | Cursor changes to `grabbing` during drag |
| TC-RO-05 | Drag a page card over the gaps between other cards | Vertical indigo line (3px, `bg-indigo-500`) appears between cards showing insertion point | Line has small dots at top/bottom ends. Disappears when drag ends |
| TC-RO-06 | Inspect each page card | A grip/drag handle icon (GripVertical) appears at top center of each card | Visual cue that cards are draggable |
| TC-RO-07 | Click left/right arrow buttons on a page card | Page swaps with its neighbor in the indicated direction | First page's left arrow disabled; last page's right arrow disabled |
| TC-RO-08 | Upload a PDF and view the reorder grid | Each card has a small rounded badge at bottom showing original page number | Badge has dark semi-transparent background with white text |
| TC-RO-09 | Move page 3 to position 1 | Moved card shows indigo "was 3" badge at top-right, card has indigo border/background | Unmoved cards have gray border and no "was" badge |
| TC-RO-10 | Reorder some pages, then click "Reset Order" | All pages return to original order (0, 1, 2, ...) | "Reset Order" button disabled when no changes made |
| TC-RO-11 | Load a PDF without making any reorder changes | "Reorder Pages" button is disabled (opacity 50%) | Button enables only after page order has been modified |
| TC-RO-12 | Hover over a page card | Cursor shows `grab`. While actively dragging, cursor shows `grabbing` | CSS `cursor-grab active:cursor-grabbing` applied |
| TC-RO-13 | Resize the browser window with pages loaded | Grid columns adapt via `auto-fill, minmax(140px, 1fr)` | No overflow or layout breaking at any width |
| TC-RO-14 | Try to drag a thumbnail image directly | Thumbnail image has `draggable={false}` and `pointer-events-none` | No browser-native image drag behavior interferes |
| TC-RO-15 | Drag a page card and hover over the left half of another card | Insertion line appears on the left edge of the hovered card (`-left-[7px]`) | Line does NOT appear over the dragged card itself |
| TC-RO-16 | Drag a page card and hover over the right half of the last card | Insertion line appears on the right edge of the last card (`-right-[7px]`) | Only occurs for the last card when insertion point is at the end |
| TC-RO-17 | Drag a page to a new position and release | Insertion line disappears immediately. Page snaps into new position | No lingering visual artifacts. Both `dragIndex` and `insertAt` reset to null |
| TC-RO-18 | Load a multi-page PDF and reorder some pages | "Reorder Pages" button appears at top of grid next to "Reset Order" | Top button has indigo-600 background, white text, same disabled state as bottom button |
| TC-RO-19 | Load a PDF without making any reorder changes | Top "Reorder Pages" button is disabled (opacity 50%, cursor not-allowed) | Button enables only after page order has been modified |

### 6.3 Page Numbers — Unified Position Picker

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-POS-01 | Open Page Numbers tool and load a PDF | Single page preview appears with 3x3 grid of clickable zones overlaid on top. Page number text drawn at selected position | Canvas has `data-testid="pagenumber-preview-canvas"`, wrapped in `rounded-xl shadow-inner` container |
| TC-POS-02 | Inspect the page preview | 9 transparent clickable zones overlaid on canvas in 3x3 grid (`grid-cols-3 grid-rows-3`), positioned with `absolute inset-2` | Each zone is a `<button>` with `aria-label="Place number at [Position Name]"` |
| TC-POS-03 | Click the bottom-right zone | Clicked zone shows: solid indigo border (2px, `border-indigo-500`), light indigo tint (`bg-indigo-500/10`), floating label pill ("Bottom Right") | Only one zone selected at a time. Clicking another zone moves the selection |
| TC-POS-04 | Inspect the 8 non-selected zones | Unselected zones have thin dashed gray borders (`border-gray-300/60 border-dashed`), fully transparent background | On hover, zones show faint indigo tint (`hover:bg-indigo-500/5`) |
| TC-POS-05 | Click through different zones | Page number text on canvas moves to corresponding position | Canvas redraws immediately. Text has white semi-transparent pill behind it |
| TC-POS-06 | Open the tool fresh and load a PDF | Bottom-center zone is selected by default. Page number "1" appears at bottom-center | Bottom-center zone has selected indigo style with "Bottom Center" label |
| TC-POS-07 | With format "Page 1 of N" and a 10-page PDF | Preview header reads: "Position & Preview — Click a zone to place the number · Page 1 of 10, Page 2 of 10, ..." | Label updates when format, start number, or file changes |
| TC-POS-08 | Load a real PDF with visible content | Actual first page renders on canvas with 9 clickable zones overlaid transparently on top | Page content visible through zone buttons |
| TC-POS-09 | Change font size, color, margin, format, or start number | Page number text on canvas updates immediately to reflect new settings | Changing font size makes number visibly larger/smaller |
| TC-POS-10 | Load a 5-page PDF | Bottom-right corner shows "Page 1 of 5" floating badge with `pointer-events-none` | Badge has semi-transparent background, backdrop blur |
| TC-POS-11 | Open Page Numbers tool on desktop viewport (>= 1024px) | Settings on LEFT column, unified position/preview canvas on RIGHT column, side by side | Uses `grid grid-cols-1 lg:grid-cols-2 gap-6 items-start` |
| TC-POS-12 | View on narrow viewport (< 1024px) | Layout falls back to single column — settings stacked above preview | `grid-cols-1` on smaller screens |

### 6.4 Page Numbers — Canvas Preview

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-PN-01 | Open Page Numbers tool and load a PDF | Canvas preview (400x566) renders showing first page with 3x3 position grid overlay and page number drawn at selected position | Canvas has `data-testid="pagenumber-preview-canvas"` |
| TC-PN-02 | Load a PDF and inspect the preview canvas | Nine rectangular zones overlaid on page in 3x3 grid (TL, TC, TR, ML, MC, MR, BL, BC, BR) | 8 inactive zones have thin (1px) gray dashed outlines, 1 active zone has thicker (2.5px) solid indigo outline |
| TC-PN-03 | Select "Top Right" (TR) position | Top-right zone has solid indigo border (2.5px, #6366f1), light indigo fill (8% opacity), page number text drawn inside | Switching positions immediately updates highlighted zone |
| TC-PN-04 | With any position selected, inspect other 8 zones | Inactive zones have thin gray (#d1d5db) dashed borders (1px, dash pattern [4,3]) | Outlines clearly visible but subtle, with rounded corners (r=4) |
| TC-PN-05 | Select "Bottom Left" with format "Page 1 of N" | Text "Page 1 of 10" appears in bottom-left area, left-aligned with bottom baseline | Text drawn at margin distance from edge, bold, using selected color |
| TC-PN-06 | Inspect the page number text on canvas | Subtle indigo-tinted rounded pill (12% opacity) behind the page number text | Pill auto-sizes to text width with 4px padding |
| TC-PN-07 | Click through all 9 positions in the grid selector | For each click: new zone highlighted, page number moved, previous zone reverts to dashed outline | No flicker or delay between position changes |
| TC-PN-08 | Increase font size from 12pt to 36pt | Page number text on canvas becomes visibly larger | Font scales via `fontSize * (canvasWidth / 612)` |
| TC-PN-09 | Change color from black to red (#ff0000) | Page number text on canvas turns red immediately | Color updates live |
| TC-PN-10 | Increase margin from 40pt to 100pt | Page number text moves further inward from page edges | Margin scaled relative to canvas width |
| TC-PN-11 | Switch format from "1" to "Page 1 of N" | Canvas text changes from "1" to "Page 1 of 10" | All 5 format options render correctly |
| TC-PN-12 | Change starting number from 1 to 5 | Canvas shows "5" (or "Page 5 of N") instead of "1" | Preview reflects actual first page number |
| TC-PN-13 | Load a 10-page PDF with format "Page 1 of N" and start 1 | Preview label reads: "Preview Page 1 · Page 1 of 10, Page 2 of 10, ..." | Label updates dynamically |
| TC-PN-14 | Load a 5-page PDF | Bottom-right corner shows "Page 1 of 5" badge with semi-transparent background and backdrop blur | Badge always visible regardless of selected position |
| TC-PN-15 | Load a PDF where thumbnail hasn't completed yet | Canvas shows white background with faint gray horizontal lines, with position grid and page number still overlaid | Tool usable even before thumbnail loads |
| TC-PN-16 | Load file A, then load file B | Canvas updates to show file B's first page with position overlay | Previous thumbnail cleared, new one renders asynchronously |

### 6.5 Watermark Preview

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-WM-01 | Open Text Watermark tool and load a PDF | Canvas-based preview shows first page with watermark text overlaid | Canvas has `data-testid="watermark-preview-canvas"`, dimensions 400x566 |
| TC-WM-02 | Load a multi-page PDF | Preview canvas shows actual rendered first page (not just blank white box) | Thumbnail loaded via `renderPageThumbnail(file.bytes, 0, 1.0)` |
| TC-WM-03 | Load a PDF where thumbnail rendering takes time or fails | Preview shows white background with faint horizontal gray lines simulating text content | Lines at even intervals with slight width variation |
| TC-WM-04 | Set mode to "Center" and type "DRAFT" | Single "DRAFT" text appears centered on canvas, rotated at configured angle | Text is bold, uses configured color and opacity, font scales to canvas width |
| TC-WM-05 | Switch mode to "Tile" | Watermark text repeats in tiled grid pattern across entire canvas | Tiled text is half the font size of center mode |
| TC-WM-06 | Adjust opacity slider from 15% to 80% | Watermark text immediately becomes more opaque | Canvas redraws on every opacity change |
| TC-WM-07 | Drag rotation slider from 45° to -30° | Watermark text rotates from diagonal top-right to diagonal top-left in real-time | Both center and tile modes update rotation |
| TC-WM-08 | Increase font size from 60pt to 100pt | Watermark text on canvas becomes larger immediately | Font scales: `fontSize * (canvasWidth / 612)` |
| TC-WM-09 | Change color from gray (#808080) to red (#ff0000) | Watermark text color changes immediately on canvas | Both canvas text and color picker/hex display update |
| TC-WM-10 | Change watermark text from "CONFIDENTIAL" to "DO NOT COPY" | Canvas preview immediately shows "DO NOT COPY" | Empty text falls back to "Watermark" placeholder |
| TC-WM-11 | Load a 10-page PDF | Small floating badge in bottom-right reads "Page 1 of 10" | Badge has semi-transparent black background, white text, rounded-full, backdrop blur |
| TC-WM-12 | Inspect the preview section | Preview label says "Preview" with "Page 1" subtitle. Canvas inside `rounded-xl` container with `shadow-inner` and gray-50 background | Professional appearance with depth cues |
| TC-WM-13 | Load file A, then load file B | Preview updates to show file B's first page with watermark overlay | Previous thumbnail cleared, new one loads asynchronously |
| TC-WM-14 | Load a file, configure watermark, process, then reset | Preview, thumbnail, and all settings return to defaults | Canvas shows placeholder lines, text resets to "CONFIDENTIAL" |
| TC-WM-15 | Toggle between Center and Tile modes with file loaded | Canvas preview immediately switches between single centered text and tiled pattern | Tile mode shows multiple smaller text instances |
| TC-WM-16 | Open Text Watermark tool on desktop viewport (>= 1024px) | Settings on LEFT column, live preview canvas on RIGHT column, side by side | Uses `grid grid-cols-1 lg:grid-cols-2 gap-6 items-start` |
| TC-WM-17 | View on narrow viewport (< 1024px) | Layout falls back to single column — settings stacked above preview | `grid-cols-1` on smaller screens |

### 6.6 Top Execution Buttons (All Tools)

| ID | Tool | Expected Toolbar | Verify |
|----|------|-----------------|--------|
| TC-TOP-01 | Split | Page count, "Reset Selection" button (when pages selected), "Split PDF" button with scissors icon | Top button matches bottom button's disabled/enabled state |
| TC-TOP-02 | Merge | File count and total page count, "Merge PDFs" button | Disabled with < 2 files, enabled with 2+ |
| TC-TOP-03 | Delete Pages | Page count + selection count, "Reset Selection" button, Delete button (red) | "Select pages" when none selected, "Delete N Pages" when some selected, disabled when all selected |
| TC-TOP-04 | Extract Pages | Page count + selection count, "Reset Selection" button, Extract button | "Select pages" when none selected, "Extract N Pages" when some selected |
| TC-TOP-05 | Reorder Pages | Page count and instructions, "Reset Order" and "Reorder Pages" buttons side by side | Both disabled when order unchanged |
| TC-TOP-06 | Rotate Pages | Page count, rotation count, "Rotate Pages" button | Disabled when no rotations applied |
| TC-TOP-07 | Add Blank Pages | "Add N Blank Pages" button (right-aligned) | Disabled when inputs invalid |
| TC-TOP-08 | Scale / Resize | "Resize PDF" button (right-aligned) | Disabled until valid configuration |
| TC-TOP-09 | Page Numbers | "Add Page Numbers" button at bottom of left settings column | Disabled until file loaded |
| TC-TOP-10 | Text Watermark | "Add Watermark" button at bottom of left settings column | Disabled when text empty |
| TC-TOP-11 | Encrypt PDF | "Encrypt PDF" button (right-aligned) | Disabled until passwords match and non-empty |
| TC-TOP-12 | Unlock PDF | "Unlock PDF" button (right-aligned) | Disabled until password entered |
| TC-TOP-13 | Edit Metadata | "Save Changes" button (right-aligned) | Enabled whenever file loaded |

### 6.7 Result Page Document Viewer

| ID | Scenario | Expected Result | Verify |
|----|----------|-----------------|--------|
| TC-DV-01 | Process a single-output tool and view the result | Result page shows ALL pages rendered vertically in scrollable container (max-height 600px). Each page is full-width image with rounded corners and shadow | Pages lazy-load with IntersectionObserver (300px rootMargin). Unloaded pages show gray pulse placeholder |
| TC-DV-02 | View a multi-page result | Each rendered page has "N / total" badge in bottom-right corner with semi-transparent black background, white text, backdrop-blur | Badges are accurate (e.g., "3 / 12") |
| TC-DV-03 | Process a large PDF (e.g., 50 pages) and view result | Only visible pages (and those within 300px of viewport) are rendered. Scrolling triggers additional loads | Placeholder pulse animations for pages not yet loaded |
| TC-DV-04 | Process a Split tool that produces 3 output files | Tab bar appears showing each file name with FileText icon and page count. First file selected by default | Tabs scrollable horizontally. Selected tab has white background, indigo text |
| TC-DV-05 | Click on a different file tab | Page renderer reloads and shows all pages of newly selected file | Previous file's pages cleared. New file's pages lazy-load from top |
| TC-DV-06 | On a tool with `showOriginalToggle`, click "Show original" | Page renderer switches to showing original input PDF pages. File tabs disappear. Button text changes to "Show processed" | Clicking "Show processed" switches back |
| TC-DV-07 | View a result from any tool | Top of preview panel shows: file name (or "N files"), page count, file size, size comparison, processing time | Size reduction in green ("↓ 50% smaller"), increase in gray |
| TC-DV-08 | View a result with many pages (e.g., 20) | Page renderer container has `max-h-[600px] overflow-y-auto` | Scrollbar appears. Lazy loading triggers on scroll |
