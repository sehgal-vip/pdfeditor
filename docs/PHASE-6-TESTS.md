# Phase 6: Edit PDF & Convert to PDF — Test Cases

## Overview

Phase 6 introduces 2 new tools (Edit PDF and Convert to PDF) and the Compress PDF tool, adding **130+ new test cases** across 6 new test files plus updates to 4 existing test files. Total test count: **~406 tests** across **35 test files** (full suite).

---

## New Test Files

### 1. `src/__tests__/lib/fonts.test.ts` (7 tests)

Tests the multi-script font detection utility (`src/lib/fonts.ts`).

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| F-01 | Detects Latin text | `detectRequiredFonts('Hello World')` includes `latin`, no CJK |
| F-02 | Detects Arabic text | Arabic characters are identified, `arabic` script returned |
| F-03 | Detects Devanagari text | Hindi characters trigger `devanagari` detection |
| F-04 | Detects Cyrillic text | Russian characters trigger `cyrillic` detection |
| F-05 | Detects CJK text | Chinese characters set `hasCJK: true` |
| F-06 | Detects mixed scripts | Multi-script input returns all relevant scripts |
| F-07 | Empty string returns empty | No scripts, no CJK for empty input |

### 2. `src/__tests__/lib/html-parser.test.ts` (16 tests)

Tests the HTML-to-DocBlock parser (`src/lib/html-parser.ts`).

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| HP-01 | Simple paragraph | `<p>` → single paragraph block with correct text |
| HP-02 | Headings with levels | `<h1>` through `<h3>` produce heading blocks with correct levels |
| HP-03 | Bold text | `<strong>` sets `bold: true` on runs |
| HP-04 | Italic text | `<em>` sets `italic: true` on runs |
| HP-05 | Underline text | `<u>` sets `underline: true` on runs |
| HP-06 | Nested formatting | `<strong><em>` produces runs with both bold and italic |
| HP-07 | Whitespace preservation | Text nodes are NOT trimmed — spaces between elements preserved |
| HP-08 | **Images before paragraphs** | `<img>` inside `<p>` produces image block FIRST (critical gotcha) |
| HP-09 | Standalone images | `<img>` without wrapper produces image block |
| HP-10 | Lists | `<ul><li>` produces list-item blocks |
| HP-11 | Empty paragraphs skipped | `<p></p>` produces no blocks |
| HP-12 | Mixed content | Heading + paragraph + list in one HTML |
| HP-13 | `<b>` tag | Same as `<strong>` |
| HP-14 | `<i>` tag | Same as `<em>` |
| HP-15 | Empty input | Returns empty array |
| HP-16 | Image + text in same paragraph | Image extracted first, remaining text as separate paragraph |

### 3. `src/__tests__/lib/convert-preprocessor.test.ts` (10 tests)

Tests the file preprocessing utilities (`src/lib/convert-preprocessor.ts`).

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| CP-01 | TXT multi-paragraph | Double newlines split into separate paragraph blocks |
| CP-02 | TXT empty file | Throws "empty" error |
| CP-03 | TXT whitespace-only | Throws "empty" error |
| CP-04 | TXT single paragraph | No double newline → single block |
| CP-05 | TXT default formatting | Runs have `bold: false`, `italic: false`, `underline: false` |
| CP-06 | getFileType images | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` → `'image'` |
| CP-07 | getFileType documents | `.docx`, `.doc` → `'document'` |
| CP-08 | getFileType text | `.txt` → `'text'` |
| CP-09 | getFileType unsupported | `.zip`, `.css`, `.pdf` → `null` |
| CP-10 | ACCEPTED_EXTENSIONS | Contains all expected file extensions |

### 4. `src/__tests__/lib/pdf-editor-utils.test.ts` (32 tests)

Tests coordinate conversion and font mapping (`src/lib/pdf-editor-utils.ts`).

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| EU-01 | getStandardFont Helvetica (4) | All 4 variants: regular, bold, oblique, bold-oblique |
| EU-02 | getStandardFont Courier (4) | All 4 variants |
| EU-03 | getStandardFont TimesRoman (4) | All 4 variants |
| EU-04 | getStandardFont unknown family | Defaults to Helvetica variants |
| EU-05 | getStandardFont empty string | Defaults to Helvetica |
| EU-06 | mapPDFJsFontToStandard Helvetica | Maps Helvetica, Helvetica-Bold, etc. |
| EU-07 | mapPDFJsFontToStandard Courier | Maps Courier variants |
| EU-08 | mapPDFJsFontToStandard Times | Maps Times variants |
| EU-09 | mapPDFJsFontToStandard unknown | Maps `g_d0_f1` to Helvetica |
| EU-10 | mapPDFJsFontToStandard italic unknown | Maps BoldItalic to HelveticaBoldOblique |
| EU-11 | mapPDFJsFontToStandard case-insensitive | HELVETICA-BOLD, courier-oblique, TIMES-BOLDITALIC |
| EU-12 | mapPDFJsFontToStandard Courier italic | Courier-Italic → CourierOblique |
| EU-13 | screenToPDF zoom 1.0 | Click at (100, 100) → (100, 742) |
| EU-14 | screenToPDF zoom 2.0 | Correctly divides by scale |
| EU-15 | screenToPDF zoom 0.5 | Correctly divides by scale |
| EU-16 | screenToPDF with offset | Subtracts canvas left/top |
| EU-17 | screenToPDF top of page | Returns high PDF Y |
| EU-18 | screenToPDF bottom of page | Returns low PDF Y |
| EU-19 | pdfToScreen zoom 1.0 | (100, 742) → (100, 100) |
| EU-20 | pdfToScreen zoom 2.0 | Doubles screen coordinates |
| EU-21 | pdfToScreen origin | (0,0) → bottom-left of screen |
| EU-22 | pdfToScreen high Y | High PDF Y → top of screen |
| EU-23 | pdfRectToScreen zoom 1.0 | Correct left/top/width/height |
| EU-24 | pdfRectToScreen zoom 2.0 | Scales dimensions |
| EU-25 | pdfRectToScreen at PDF origin | Correct screen bottom-left |
| EU-26 | pdfRectToScreen zero height | Zero screen height |
| EU-27 | **Round-trip zoom 1.5** | screenToPDF(pdfRectToScreen(rect)) ≈ original rect |
| EU-28 | **Round-trip zoom 0.5** | Same identity at half zoom |
| EU-29 | **Round-trip zoom 3.0** | Same identity at max zoom |
| EU-30 | **Text box click position** | Click y maps to box top, not bottom (bug regression) |
| EU-31 | **Text box click middle** | Box appears at click point in page middle |
| EU-32 | **Resize keeps top edge fixed** | Increasing height + decreasing y = fixed top |

### 5. `src/__tests__/stores/editorStore.test.ts` (36 tests)

Tests the editor Zustand store (`src/stores/editorStore.ts`).

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| ES-01 | Initial state | mode='form-fill', zoom=1.0, empty arrays, not dirty, empty extractedText/pageRotations |
| ES-02 | Set mode deselects text box | `setMode('add-text')` sets mode and clears selectedTextBoxId |
| ES-03 | Set page deselects text box | `setCurrentPage(3)` sets page and clears selection |
| ES-04 | **Zoom clamp max** | 5.0 → 3.0 |
| ES-05 | **Zoom clamp min** | 0.1 → 0.5 |
| ES-06 | Zoom valid values | 1.5 → 1.5 |
| ES-07 | Zoom exact boundaries | 0.5 → 0.5, 3.0 → 3.0 |
| ES-08 | Add/remove text boxes | addTextBox increases length, removeTextBox decreases |
| ES-09 | addTextBox pushes undo, clears redo | Undo stack grows, redo cleared |
| ES-10 | removeTextBox pushes undo | deleteTextBox action on undo stack |
| ES-11 | removeTextBox deselects removed box | Selected becomes null |
| ES-12 | removeTextBox keeps other selection | Different box stays selected |
| ES-13 | removeTextBox ignores non-existent | No-op, undo stack unchanged |
| ES-14 | updateTextBox partial update | Only specified fields change |
| ES-15 | Undo/redo add text box | Undo removes, redo re-adds |
| ES-16 | Undo/redo remove text box | Undo restores, redo re-removes |
| ES-17 | **Undo/redo moveTextBox** | Coordinates restored on undo, re-applied on redo |
| ES-18 | **Undo/redo resizeTextBox with Y** | y, width, height all restored (bug regression) |
| ES-19 | Undo/redo editTextBox | Text content restored |
| ES-20 | Undo/redo editTextBoxStyle | Style object restored |
| ES-21 | Add/remove text edits | addTextEdit/removeTextEdit symmetric |
| ES-22 | removeTextEdit ignores non-existent | No-op |
| ES-23 | updateTextEdit partial update | Only specified fields change |
| ES-24 | Undo/redo add text edit | Undo removes, redo re-adds |
| ES-25 | Undo/redo remove text edit | Undo restores, redo re-removes |
| ES-26 | Undo/redo modifyTextEdit | Text content restored |
| ES-27 | Cross-mode undo linear stack | LIFO across textBox and textEdit actions |
| ES-28 | Multiple undo then redo | Full round-trip restores all state |
| ES-29 | **pushAction clears redo stack** | New action after undo wipes redo |
| ES-30 | pushAction marks dirty | isDirty set to true |
| ES-31 | Undo empty stack is no-op | State unchanged |
| ES-32 | Redo empty stack is no-op | State unchanged |
| ES-33 | setTextStyle partial merge | Only specified keys changed |
| ES-34 | extractedText per page | Pages stored independently |
| ES-35 | extractedText no overwrite | Multiple pages coexist |
| ES-36 | Reset clears all state | Resets mode, zoom, dirty, undo, redo, textBoxes, textEdits, extractedText, pageRotations |

---

## Updated Test Files

### 6. `src/__tests__/lib/constants.test.ts` (8 tests, 4 updated)

| Test ID | Change | Description |
|---------|--------|-------------|
| C-01 | Updated | TOOLS length 13→15 |
| C-02 | Updated | Multiple-file tools: 1→2 (merge + convert-to-pdf) |
| C-03 | Updated | Pipeline-incompatible: 1→3 (merge, edit-pdf, convert-to-pdf) |
| C-04 | Updated | TOOL_MAP has 15 entries, includes edit-pdf and convert-to-pdf |
| C-05 | Updated | CATEGORIES count 5→7, includes Edit and Convert |

### 7. `src/__tests__/lib/error-messages.test.ts` (6 tests, 2 added)

| Test ID | Change | Description |
|---------|--------|-------------|
| EM-01 | Added | All 4 Edit PDF error constants exist |
| EM-02 | Added | All 11 Convert to PDF error constants exist |

### 8. `src/__tests__/lib/filename-generator.test.ts` (21 tests, 3 added)

| Test ID | Change | Description |
|---------|--------|-------------|
| FG-01 | Added | `edit-pdf` → `doc_edited.pdf` |
| FG-02 | Added | `convert-to-pdf` single → strips extension → `photo.pdf` |
| FG-03 | Added | `convert-to-pdf` multi → `converted.pdf` |

### 9. `src/__tests__/components/ToolGrid.test.tsx` (updated)

| Test ID | Change | Description |
|---------|--------|-------------|
| TG-01 | Updated | Renders 15 tool cards (was 13) |
| TG-02 | Updated | Renders 7 category headers (was 5) |

---

## Critical Test Assertions (Gotchas)

These tests specifically verify the "Top 10 Gotchas" from the implementation plan and bug regressions:

1. **Margin nullish coalescing** — Convert-to-PDF worker uses `?? 36` not `|| 72` (tested via `margin: 0` being valid)
2. **Whitespace preservation** — HP-07: text nodes are NOT trimmed in `extractRuns()`
3. **Images before paragraphs** — HP-08: `<img>` inside `<p>` produces image block first
4. **Zoom clamping** — ES-04/05: 0.5 ≤ zoom ≤ 3.0
5. **Redo stack cleared on new action** — ES-29: push after undo clears redo
6. **Coordinate round-trips** — EU-27/28/29: screen→PDF→screen ≈ identity at zoom 0.5/1.5/3.0
7. **All 12 font variants** — EU-01 through EU-04: all 4 families × 4 styles mapped correctly
8. **Text box click position** — EU-30/31: box top aligns with click point (y = pdfY - height)
9. **Resize keeps top edge fixed** — EU-32: increasing height + decreasing y = constant top
10. **Resize undo restores Y** — ES-18: resizeTextBox action tracks fromY/toY for proper undo

---

## Compress PDF Test Cases

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| CMP-01 | Constants includes compress tool | TOOLS array has 16 entries, TOOL_MAP has 'compress' |
| CMP-02 | Compress tool has correct properties | id='compress', category='transform', pipelineCompatible=true |
| CMP-03 | Filename generator compress suffix | `generateFilename('compress', 'doc.pdf')` returns `'doc_compressed.pdf'` |
| CMP-04 | Error message COMPRESS_NO_SAVINGS | Message exists and is truthy |
| CMP-05 | Compress tool is pipeline compatible | Not in the non-pipeline-compatible list |
| CMP-06 | Tier estimate contract | Low/Medium/High/Extra High estimates reflect 5-15, 20-40, 35-60, and up-to-90 guidance |
| CMP-07 | Tier ordering expectation | On same fixture, extra-high output is smallest in most cases, followed by high, medium, low |
| CMP-08 | PDF validity after compression | All tier outputs begin with `%PDF-` and are loadable by `PDFDocument.load()` |
| CMP-09 | Safety fallback behavior | Failed/unsupported transforms are skipped without corrupting output |

---

## Running Tests

```bash
# Run all Phase 6 tests
npx vitest run src/__tests__/lib/fonts.test.ts \
  src/__tests__/lib/html-parser.test.ts \
  src/__tests__/lib/convert-preprocessor.test.ts \
  src/__tests__/lib/pdf-editor-utils.test.ts \
  src/__tests__/stores/editorStore.test.ts

# Run full lib + store suite (includes Phase 1-6)
npx vitest run src/__tests__/lib/ src/__tests__/stores/

# Full suite (all tests)
npm run test
```

---

## Aggressive Compression Test Cases (Techniques 1–6)

### Worker-Level Compression Techniques

| Test ID | Test Case | Level | Description |
|---------|-----------|-------|-------------|
| CMP-10 | Legacy encoding conversion | medium | Streams with LZWDecode, ASCII85Decode, ASCIIHexDecode, RunLengthDecode are converted to FlateDecode |
| CMP-11 | Legacy conversion preserves dict keys | medium | Non-filter dict keys (e.g., Width, Height) preserved after re-encode |
| CMP-12 | FlateDecode re-compression | medium | Existing FlateDecode streams re-compressed at pako level 9; smaller result accepted |
| CMP-13 | Re-compress skip if larger | medium | Streams not replaced when level-9 output is >= original size |
| CMP-14 | Re-compress skips images | medium | PDFRawStream with `Subtype: Image` not touched by recompressFlateStreams |
| CMP-15 | Stream deduplication | medium | Identical streams deduplicated — duplicate refs rewritten to canonical copy |
| CMP-16 | Dedup byte-equality check | medium | Hash collisions with different content are NOT merged |
| CMP-17 | Dedup orphan deletion | medium | Duplicate streams deleted from context after ref rewrite |
| CMP-18 | Image recompression (JPEG) | high | DCTDecode images ≥100px re-encoded as JPEG at quality 0.60 via OffscreenCanvas |
| CMP-19 | Image recompression (FlateDecode RGB) | high | FlateDecode DeviceRGB images converted to JPEG; only replaced if smaller |
| CMP-20 | Image recompression (FlateDecode Gray) | high | FlateDecode DeviceGray images converted to JPEG |
| CMP-21 | Image skip small | high | Images <100px in either dimension are not recompressed |
| CMP-22 | Image recompression gated | high | OffscreenCanvas check prevents crash in non-supporting environments |
| CMP-23 | Strip non-essentials catalog | high | Outlines, Dests, OpenAction, PieceInfo, MarkInfo, StructTreeRoot removed from catalog |
| CMP-24 | Strip Names JS/EmbeddedFiles | high | JavaScript and EmbeddedFiles removed from Names dict |
| CMP-25 | Strip page thumbnails | high | Thumb entries removed from all page dicts |
| CMP-26 | Strip annotations keep links | high | Non-Link annotations removed; Link annotations preserved |
| CMP-27 | Remove unused objects | high | Unreachable objects (not reachable from Root/Info/Encrypt) deleted |
| CMP-28 | Unused removal preserves reachable | high | All objects reachable via DFS from trailer roots are kept |
| CMP-29 | Per-stream try/catch safety | all | Individual stream failures do not abort entire compression |
| CMP-30 | Output size check | all | If compressed output ≥ input size, COMPRESS_NO_SAVINGS toast shown |

### Pipeline Integration

| Test ID | Test Case | Level | Description |
|---------|-----------|-------|-------------|
| CMP-31 | Low pipeline | low | Save with useObjectStreams only — fast, ~5–15% savings |
| CMP-32 | Medium pipeline | medium | Legacy convert → compress uncompressed → re-compress Flate → dedup → save |
| CMP-33 | High pipeline | high | Flatten → legacy convert → compress → image recompress → re-compress → dedup → strip metadata → strip non-essentials → remove unused → save |
| CMP-34 | Progress steps medium | medium | Reports 5 progress steps |
| CMP-35 | Progress steps high | high | Reports 10 progress steps |
| CMP-36 | Progress steps extra-high | extra-high | Reports full extra-high path including aggressive image stage |
| CMP-37 | Replace-only-if-smaller enforcement | all | Any transformed stream/image is replaced only when resulting bytes are smaller |
| CMP-38 | Tier contract safety | all | Low excludes lossy passes; Medium remains conservative; High/Extra High apply increasingly aggressive options |
| CMP-39 | Byte-delta instrumentation | all | Per-step byte deltas are available for tuning and diagnostics |

### UI Updates

| Test ID | Test Case | Description |
|---------|-----------|-------------|
| CMP-40 | Medium estimate range | LEVEL_ESTIMATES medium: 20–50% |
| CMP-41 | High estimate range | LEVEL_ESTIMATES high: 35–70% |
| CMP-42 | Medium description updated | "Recompresses streams at max level, deduplicates content." |
| CMP-43 | High description updated | "Maximum. Downsamples images, strips metadata and non-essential data." |

### Browser Manual Tests

| Test ID | Test Case | Expected |
|---------|-----------|----------|
| CMP-B1 | Upload image-heavy PDF, run High | 40–70% size reduction |
| CMP-B2 | Upload text-only PDF, run Medium | 20–50% size reduction |
| CMP-B3 | Upload small PDF, run Low | Quick completion, modest (~5–15%) savings |
| CMP-B4 | Upload PDF with forms, run High | Forms flattened, metadata stripped, images recompressed |
| CMP-B5 | Upload already-compressed PDF, run Medium | No-savings toast if output ≥ input |
| CMP-B6 | Upload scan-heavy PDF, run Extra High | Best-case reduction can approach ~90% with visible quality tradeoff |
| CMP-B7 | Compare all tiers on same scan-heavy file | Extra High <= High <= Medium <= Low size ordering |
| CMP-B8 | Compare all tiers on text-heavy file | Smaller gains overall but no broken rendering |

---

## Test Summary

| Category | Files | Tests |
|----------|-------|-------|
| New lib tests | 4 | 65 |
| New store tests | 1 | 36 |
| Updated lib tests | 3 | ~10 updated assertions |
| Updated component tests | 1 | ~4 updated assertions |
| **Total new/updated** | **9** | **~115 changes** |
| Compress PDF tests | 3 | ~5 updated assertions |
| Aggressive compression tests | — | ~30 new scenarios |
| **Full suite** | **35** | **~436** |
