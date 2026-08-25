/**
 * Where we are willing to send somebody after they sign in or register.
 *
 * Both auth pages read a destination straight out of the query string and hand
 * it to router.push. Left unchecked that makes ?redirect=https://example.com a
 * way to have virtualfreaks.co deposit a person on somebody else's page — with
 * the trust of having just arrived from us, and at the exact moment they are
 * accustomed to typing a password. It is the standard shape of a credential
 * phishing link, and the domain doing the vouching would be ours.
 *
 * A path starting with two slashes is the same trick wearing a relative-looking
 * costume: //example.com is a protocol-relative URL, not a path.
 *
 * So: same-site paths only, and anything else falls back to a default.
 */
export function safeRedirect(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//')) return fallback
  return raw
}
