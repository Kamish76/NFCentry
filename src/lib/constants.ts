/**
 * Application-wide Constants
 * These constants are used across both frontend and backend
 */

// ============================================================================
// TAG MANAGEMENT CONSTANTS
// ============================================================================

export const TAG_WRITE_COOLDOWN_DAYS = 14;
export const TAG_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// ATTENDANCE CONSTANTS
// ============================================================================

export const SCAN_METHODS = ['NFC', 'QR', 'Manual'] as const;
export type ScanMethod = typeof SCAN_METHODS[number];

export const MAX_ATTENDANCE_DISTANCE_METERS: number | null = null;
export const ATTENDANCE_TIME_WINDOW_HOURS: number | null = null;

// ============================================================================
// QR CODE CONSTANTS
// ============================================================================

export const QR_CODE_SIZE = 300;
export const QR_CODE_ERROR_CORRECTION: 'L' | 'M' | 'Q' | 'H' = 'M';

// ============================================================================
// NFC CONSTANTS
// ============================================================================

export const NFC_RECORD_TYPE = 'text';
export const NFC_SCAN_TIMEOUT_MS = 10000;
