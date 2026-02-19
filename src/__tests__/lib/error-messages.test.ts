import { ERRORS } from '@/lib/error-messages';

describe('ERRORS', () => {
  it('has all required error messages', () => {
    expect(ERRORS.INVALID_PDF).toBeTruthy();
    expect(ERRORS.ENCRYPTED_NEEDS_PASSWORD).toBeTruthy();
    expect(ERRORS.WRONG_PASSWORD).toBeTruthy();
    expect(ERRORS.FILE_TOO_LARGE).toBeTruthy();
    expect(ERRORS.WORKER_CRASHED).toBeTruthy();
    expect(ERRORS.OPERATION_CANCELLED).toBeTruthy();
    expect(ERRORS.CANNOT_DELETE_ALL).toBeTruthy();
    expect(ERRORS.MERGE_MIN_FILES).toBeTruthy();
    expect(ERRORS.NON_LATIN_WARNING).toBeTruthy();
    expect(ERRORS.ANNOTATIONS_WARNING).toBeTruthy();
  });

  it('has all Edit PDF error messages', () => {
    expect(ERRORS.NO_FORM_FIELDS).toBeTruthy();
    expect(ERRORS.NO_EDITABLE_TEXT).toBeTruthy();
    expect(ERRORS.EDIT_TEXT_LIMITATION).toBeTruthy();
    expect(ERRORS.UNSAVED_CHANGES).toBeTruthy();
  });

  it('has all Convert to PDF error messages', () => {
    expect(ERRORS.NO_FILES_ADDED).toBeTruthy();
    expect(ERRORS.IMAGE_LOAD_FAILED).toBeTruthy();
    expect(ERRORS.ANIMATED_GIF_NOTE).toBeTruthy();
    expect(ERRORS.MAX_FILES_EXCEEDED).toBeTruthy();
    expect(ERRORS.EMPTY_DOCUMENT).toBeTruthy();
    expect(ERRORS.DOC_NOT_SUPPORTED).toBeTruthy();
    expect(ERRORS.DOCX_PARSE_FAILED).toBeTruthy();
    expect(ERRORS.DOCX_LAYOUT_NOTE).toBeTruthy();
    expect(ERRORS.TABLE_SIMPLIFIED).toBeTruthy();
    expect(ERRORS.CJK_NOT_SUPPORTED).toBeTruthy();
    expect(ERRORS.UNDERLINE_NOT_SUPPORTED).toBeTruthy();
  });

  it('INVALID_PDF contains "not a valid PDF"', () => {
    expect(ERRORS.INVALID_PDF).toContain('not a valid PDF');
  });

  it('MERGE_MIN_FILES mentions 2 files', () => {
    expect(ERRORS.MERGE_MIN_FILES).toContain('2');
  });

  it('CANNOT_DELETE_ALL mentions at least one page', () => {
    expect(ERRORS.CANNOT_DELETE_ALL).toContain('At least one page');
  });

  it('has Compress PDF error messages', () => {
    expect(ERRORS.COMPRESS_NO_SAVINGS).toBeTruthy();
  });
});
