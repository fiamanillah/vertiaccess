/**
 * Base prefix mappings for strictly matching VT types
 */
export type VTIDPrefix =
    | 'vt-site'
    | 'vt-bkg'
    | 'vt-inc'
    | 'vt-case'
    | 'vt-lo'
    | 'vt-op'
    | 'vt-cert';

/**
 * Generates a human-readable display VT ID.
 * Format: [prefix]-[6 alphanumeric chars]
 * Example: vt-site-4x9kp2
 */
export function generateVTID(prefix: VTIDPrefix): string {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const sixChar = Array.from({ length: 6 }, () =>
        alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
    ).join('');

    return `${prefix}-${sixChar}`;
}
