// packages/core/src/id-utils.ts
// Centralised ID generation utilities for the VertiAccess platform.

/**
 * Generates a VA-CERT-XXXXX certificate ID.
 * Format: VA-CERT-[5-digit number, zero-padded]
 * Example: VA-CERT-88291
 */
export function generateCertId(): string {
    // Generate a 5-digit number (10000–99999) for uniqueness
    const num = Math.floor(10000 + Math.random() * 90000);
    return `VA-CERT-${num}`;
}

/**
 * Generates a human-readable secondary ID for Bookings and Sites.
 * Format: va-[3 lowercase letters]-[7 alphanumeric chars]
 * Example: va-abc-332dde3
 */
export function generateHumanId(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const threeLetter = Array.from({ length: 3 }, () =>
        letters[Math.floor(Math.random() * letters.length)]
    ).join('');

    const sevenChar = Array.from({ length: 7 }, () =>
        alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
    ).join('');

    return `va-${threeLetter}-${sevenChar}`;
}
