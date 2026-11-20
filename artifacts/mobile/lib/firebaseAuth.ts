import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import firebaseConfig from "@/firebase-applet-config.json";
import { getApiBaseUrl } from "@/services/api";

WebBrowser.maybeCompleteAuthSession();

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

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
  let bytes: number[] = [];
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

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  if (Platform.OS === "web") {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(firebaseAuth, provider);
    const idToken = await cred.user.getIdToken();
    const email = (cred.user.email || "").trim().toLowerCase();
    if (!email) {
      throw new Error("Google account did not provide an email address.");
    }
    return {
      idToken,
      uid: cred.user.uid,
      email,
      name: cred.user.displayName?.trim() || email.split("@")[0],
      avatarUrl: cred.user.photoURL || undefined,
    };
  }

  const redirectUrl = Linking.createURL("auth-callback");
  const bridgeUrl = `${getApiBaseUrl()}/auth/google-bridge?redirect=${encodeURIComponent(redirectUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(bridgeUrl, redirectUrl);

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
  if (Platform.OS === "web") {
    await signOut(firebaseAuth);
  }
}
