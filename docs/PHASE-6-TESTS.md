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

## Test Summary

| Category | Files | Tests |
|----------|-------|-------|
| New lib tests | 4 | 65 |
| New store tests | 1 | 36 |
| Updated lib tests | 3 | ~10 updated assertions |
| Updated component tests | 1 | ~4 updated assertions |
| **Total new/updated** | **9** | **~115 changes** |
| Compress PDF tests | 3 | ~5 updated assertions |
| **Full suite** | **35** | **~406** |
