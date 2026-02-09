export type OAuthProvider = "google" | "notion" | "slack";

export function buildOAuthUrl(provider: OAuthProvider) {
  const base = "https://example.com/oauth";
  return `${base}/${provider}`;
}
