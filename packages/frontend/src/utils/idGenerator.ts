export type IDPrefix =
    | 'vt-site'
    | 'vt-bkg'
    | 'vt-inc'
    | 'vt-case'
    | 'vt-lo'
    | 'vt-op'
    | 'vt-cert';

/** Generate a new human-readable display ID (display only — never used as DB PK) */
export function generateVTID(prefix: IDPrefix): string {
    const suffix = Math.random().toString(36).substring(2, 8); // 6 lowercase chars
    return `${prefix}-${suffix}`;
}

/**
 * Format / normalise any raw ID into the canonical `vt-<type>-<6chars>` display format.
 * - If already `vt-*` → lowercase passthrough
 * - If legacy `VA-*` → swap prefix
 * - If UUID → take last 6 hex chars as suffix
 */
export function formatDisplayId(
    rawId: string | undefined | null,
    fallbackPrefix: IDPrefix
): string {
    if (!rawId) return `${fallbackPrefix}-??????`;

    const lower = rawId.toLowerCase();

    // Already in canonical format
    if (lower.startsWith('vt-')) return lower;

    // Legacy VA- format → convert prefix
    if (lower.startsWith('va-')) {
        return lower.replace(/^va-/, 'vt-');
    }

    // UUID / opaque string fallback — use last 6 alphanumeric chars
    const clean = rawId.replace(/-/g, '');
    const short = clean.slice(-6).toLowerCase();
    return `${fallbackPrefix}-${short}`;
}
