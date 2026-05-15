export type IDPrefix =
    | 'va-site'
    | 'va-bkg'
    | 'va-inc'
    | 'va-case'
    | 'va-lo'
    | 'va-op'
    | 'va-cert';

/** Generate a new human-readable display ID (display only — never used as DB PK) */
export function generateVAID(prefix: IDPrefix): string {
    const suffix = Math.random().toString(36).substring(2, 8); // 6 lowercase chars
    return `${prefix}-${suffix}`;
}

/**
 * Format / normalise any raw ID into the canonical `va-<type>-<6chars>` display format.
 * - If already `va-*` → lowercase passthrough
 * - If legacy `VT-*` → swap prefix
 * - If UUID → take last 6 hex chars as suffix
 */
export function formatDisplayId(
    rawId: string | undefined | null,
    fallbackPrefix: IDPrefix
): string {
    if (!rawId) return `${fallbackPrefix}-??????`;

    const lower = rawId.toLowerCase();

    // Already in canonical format
    if (lower.startsWith('va-')) return lower;

    // Legacy VT- format → convert prefix
    if (lower.startsWith('va-')) {
        return lower.replace(/^vt-/, 'va-');
    }

    // UUID / opaque string fallback — use last 6 alphanumeric chars
    const clean = rawId.replace(/-/g, '');
    const short = clean.slice(-6).toLowerCase();
    return `${fallbackPrefix}-${short}`;
}
