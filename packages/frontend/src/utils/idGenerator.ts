export type IDPrefix = 'VA-OP' | 'VA-LO' | 'VA-CERT' | 'VA-SITE' | 'VA-BKG' | 'VA-INC';

export function generateVAID(prefix: IDPrefix): string {
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  // Ensure exactly 8 chars for the suffix if substring(2, 10) is shorter (rare but possible)
  const suffix = randomChars.padEnd(8, 'X').substring(0, 8);
  return `${prefix}-${suffix}`;
}
