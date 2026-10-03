const AUTH_COOKIE_NAME = "era_site_auth";
const AUTH_PAYLOAD = "era-site-authenticated";

export function getSitePassword() {
  return process.env.ERA_SITE_PASSWORD?.trim() ?? "";
}

export function isSitePasswordRequired() {
  return getSitePassword().length > 0;
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME;
}

/** Edge-compatible HMAC token derived from the site password. */
export async function createSiteAuthToken(password: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(AUTH_PAYLOAD));
  const bytes = new Uint8Array(signature);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export async function isValidSiteAuthToken(password: string, token: string | undefined) {
  if (!token) {
    return false;
  }

  const expected = await createSiteAuthToken(password);
  return token === expected;
}
