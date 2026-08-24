/**
 * The current version of the terms and privacy policy.
 *
 * Bump this ONLY when something material changes — a new kind of data, a new
 * charge, a new way information is shared. Everyone who accepted an older
 * version is asked once, on their next visit, and never again until it moves.
 *
 * Do not bump it for a typo. A prompt that appears for trivial edits is a
 * prompt people learn to dismiss without reading, which leaves you with a
 * record of consent that nobody actually gave.
 */
export const TERMS_VERSION = '2026-08-25'

/** What changed, shown to anyone being asked to accept again. */
export const TERMS_SUMMARY =
  'We have added sections covering practice accounts, GCash payments, advertising on the platform, and the services that process your data.'

export function needsAcceptance(acceptedVersion?: string | null): boolean {
  return acceptedVersion !== TERMS_VERSION
}
