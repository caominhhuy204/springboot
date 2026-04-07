const trimTrailingSlash = (value?: string) => value?.trim().replace(/\/$/, "");

const browserOrigin =
  typeof window !== "undefined" ? trimTrailingSlash(window.location.origin) : undefined;

export const apiBaseUrl =
  trimTrailingSlash(import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.DEV ? "http://localhost:8080" : browserOrigin) ||
  "";

export const googleAuthUrl =
  trimTrailingSlash(import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined) ||
  `${apiBaseUrl}/oauth2/authorization/google`;
