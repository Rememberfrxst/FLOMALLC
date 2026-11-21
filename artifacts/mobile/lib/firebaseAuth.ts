import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { getApiBaseUrl } from "@/services/api";

try {
  WebBrowser.maybeCompleteAuthSession();
} catch {
  // Ignore on platforms where web browser auth completion is a no-op
}

export interface GoogleSignInResult {
  idToken: string;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof atob === "function") {
    return decodeURIComponent(
      Array.prototype.map
        .call(
          atob(padded),
          (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(""),
    );
  }
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    const a = chars.indexOf(padded[i]);
    const b = chars.indexOf(padded[i + 1]);
    const c = padded[i + 2] === "=" ? -1 : chars.indexOf(padded[i + 2]);
    const d = padded[i + 3] === "=" ? -1 : chars.indexOf(padded[i + 3]);
    if (a < 0 || b < 0) break;
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0) bytes.push(((c & 3) << 6) | d);
  }
  return decodeURIComponent(
    bytes.map((b) => "%" + ("00" + b.toString(16)).slice(-2)).join(""),
  );
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, any>;
  } catch {
    return null;
  }
}

async function checkServerReachable(baseUrl: string): Promise<boolean> {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timer = controller
    ? setTimeout(() => controller.abort(), 3500)
    : undefined;
  try {
    const res = await fetch(`${baseUrl}/healthz`, {
      method: "GET",
      ...(controller ? { signal: controller.signal } : {}),
    });
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.includes("application/json");
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  const baseUrl = getApiBaseUrl();
  const serverOnline = await checkServerReachable(baseUrl);
  if (!serverOnline) {
    throw new Error(
      "Google Sign-In needs the FLOMA server to be online. You can still sign in or create an account with Email & Password below.",
    );
  }

  let redirectUrl = "mobile://auth-callback";
  try {
    redirectUrl = Linking.createURL("auth-callback");
  } catch {
    // fallback to scheme deep link
  }

  const bridgeUrl = `${baseUrl}/auth/google-bridge?redirect=${encodeURIComponent(redirectUrl)}`;

  let result: WebBrowser.WebBrowserAuthSessionResult;
  try {
    result = await WebBrowser.openAuthSessionAsync(bridgeUrl, redirectUrl);
  } catch (err: any) {
    throw new Error(
      err?.message ||
        "Could not open Google Sign-In browser. Please use Email & Password below.",
    );
  }

  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in was cancelled.");
  }

  const parsed = Linking.parse(result.url);
  const queryIdToken =
    typeof parsed.queryParams?.idToken === "string"
      ? parsed.queryParams.idToken
      : undefined;
  const queryError =
    typeof parsed.queryParams?.error === "string"
      ? parsed.queryParams.error
      : undefined;

  if (queryError) {
    throw new Error(queryError);
  }
  if (!queryIdToken) {
    throw new Error("Could not complete Google sign-in.");
  }

  const claims = decodeJwtPayload(queryIdToken) || {};
  const email =
    typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  return {
    idToken: queryIdToken,
    uid: String(claims.user_id || claims.sub || `google_${Date.now()}`),
    email,
    name:
      (typeof claims.name === "string" && claims.name.trim()) ||
      (email ? email.split("@")[0] : "FLOMA Shopper"),
    avatarUrl:
      typeof claims.picture === "string" ? claims.picture : undefined,
  };
}

export async function signOutFirebase(): Promise<void> {
  // No native firebase web SDK session to clear on iOS/Android
}
