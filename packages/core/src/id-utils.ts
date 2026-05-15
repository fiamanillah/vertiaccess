/**
 * Base prefix mappings for strictly matching VA types
 */
export type VAIDPrefix =
    | 'va-site'
    | 'va-bkg'
    | 'va-inc'
    | 'va-case'
    | 'va-lo'
    | 'va-op'
    | 'va-cert';

/**
 * Generates a human-readable display VA ID.
 * Format: [prefix]-[6 alphanumeric chars]
 * Example: va-site-4x9kp2
 */
export function generateVAID(prefix: VAIDPrefix): string {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const sixChar = Array.from({ length: 6 }, () =>
        alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
    ).join('');

    return `${prefix}-${sixChar}`;
}
