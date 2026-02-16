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

### 1.15 Pipeline System

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
