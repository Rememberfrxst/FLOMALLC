import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import firebaseConfig from "@/firebase-applet-config.json";

export interface GoogleSignInResult {
  idToken: string;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
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

export async function signOutFirebase(): Promise<void> {
  await signOut(firebaseAuth);
}
