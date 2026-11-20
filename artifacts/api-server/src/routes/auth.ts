import { JWT_SECRET, REFRESH_SECRET } from "../lib/auth-config";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { users, refreshTokens } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import {
  requireAuth,
  AuthRequest,
  OWNER_EMAIL,
  isStoreOwner,
} from "../middlewares/auth";

const router = Router();

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, {
    expiresIn: "30d",
  });
  return { accessToken, refreshToken };
};

router.post("/register", async (req, res) => {
  try {
    const parseResult = RegisterBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.issues,
      });
      return;
    }

    const { name, password, phone } = parseResult.data;
    const email = parseResult.data.email.trim().toLowerCase();
    if (email === OWNER_EMAIL) {
      res
        .status(403)
        .json({ error: "This email is reserved for the store owner" });
      return;
    }

    // Check if email already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUsers = await db
      .insert(users)
      .values({
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "customer",
      })
      .returning();

    const user = newUsers[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.role!);

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      deviceInfo: req.headers["user-agent"] || "unknown",
    });

    const { passwordHash: _, totpSecret: __, ...safeUser } = user;

    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

import crypto from "crypto";

function generateBase32Secret(length = 20): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += base32chars[randomBytes[i] % 32];
  }
  return secret;
}

function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (let i = 0; i < secret.length; i++) {
    const val = base32chars.indexOf(secret.charAt(i).toUpperCase());
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const currentStep = Math.floor(epoch / timeStep);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const step = currentStep + errorWindow;
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(step));
    const hmac = crypto
      .createHmac("sha1", Buffer.from(bytes))
      .update(buf)
      .digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;
    const formattedCode = code.toString().padStart(6, "0");
    if (formattedCode === token) return true;
  }
  return false;
}

router.post(["/login", "/admin-login"], async (req, res) => {
  try {
    const parseResult = LoginBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parseResult.error.issues,
      });
      return;
    }

    const { password } = parseResult.data;
    const email = parseResult.data.email.trim().toLowerCase();

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = userRecords[0];

    if (!user || (req.path === "/admin-login" && !isStoreOwner(user))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Check if user requires 2FA (e.g. Admin with 2FA enabled)
    if (user.role === "admin" && user.is2faEnabled) {
      res.json({ require2FA: true, userId: user.id });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role!);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers["user-agent"] || "unknown",
    });

    const { passwordHash: _, totpSecret: __, ...safeUser } = user;

    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Wait, let's just verify the jwt token and then mint a new one. The mobile app just needs an accessToken.
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as {
        id: string;
      };
      const userRecords = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);
      const user = userRecords[0];

      if (!user) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      const { accessToken } = generateTokens(user.id, user.role!);
      res.json({ accessToken });
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin 2FA Login endpoint
router.post("/admin-login-2fa", async (req, res) => {
  try {
    const { userId, password, code } = req.body;
    if (!userId || !password || !code) {
      res
        .status(400)
        .json({ error: "userId, password and 2FA code are required" });
      return;
    }

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRecords[0];

    if (!user || !isStoreOwner(user)) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }

    if (!user.totpSecret || !verifyTOTP(code, user.totpSecret)) {
      res.status(401).json({ error: "Invalid 2FA authenticator code" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role!);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers["user-agent"] || "unknown",
    });

    const { passwordHash: _, totpSecret: __, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (error) {
    console.error("2FA login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2FA Setup endpoints
router.post("/2fa/setup", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const secret = generateBase32Secret();

    await db
      .update(users)
      .set({ totpSecret: secret })
      .where(eq(users.id, user.id));

    const otpAuthUrl = `otpauth://totp/MetaAdmin:${encodeURIComponent(user.email)}?secret=${secret}&issuer=MetaECommerce`;

    res.json({
      secret,
      otpAuthUrl,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/2fa/verify", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { code } = req.body;

    if (!user.totpSecret || !verifyTOTP(code, user.totpSecret)) {
      res.status(400).json({ error: "Invalid verification code" });
      return;
    }

    await db
      .update(users)
      .set({ is2faEnabled: true })
      .where(eq(users.id, user.id));
    res.json({ success: true, message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { passwordHash: _, totpSecret: __, ...safeUser } = req.user;
  res.json(safeUser);
});

router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      (phone !== undefined &&
        (typeof phone !== "string" ||
          (phone !== "" && !/^\+?[0-9 ()-]{7,15}$/.test(phone))))
    ) {
      res.status(400).json({ error: "Enter a valid name and phone number" });
      return;
    }
    const [user] = await db
      .update(users)
      .set({
        name: name.trim(),
        ...(phone !== undefined && { phone: phone.trim() || null }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id))
      .returning();
    const { passwordHash: _, totpSecret: __, ...safe } = user;
    res.json(safe);
  } catch (e: any) {
    res
      .status(e.cause?.code === "23505" || e.code === "23505" ? 409 : 500)
      .json({
        error:
          "Could not update profile. This phone number may already be in use.",
      });
  }
});

import fs from "node:fs";
import path from "node:path";

interface FirebaseWebConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  oAuthClientId?: string;
}

function loadFirebaseConfig(): FirebaseWebConfig {
  const candidates = [
    path.resolve(process.cwd(), "firebase-applet-config.json"),
    path.resolve(process.cwd(), "../../firebase-applet-config.json"),
    path.resolve(process.cwd(), "../mobile/firebase-applet-config.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf-8")) as FirebaseWebConfig;
      }
    } catch {}
  }
  return {};
}

async function verifyGoogleCredentials(payload: {
  idToken?: string;
  accessToken?: string;
}): Promise<{
  email: string;
  name: string;
  avatarUrl?: string;
} | null> {
  const cfg = loadFirebaseConfig();
  const apiKey = process.env.FIREBASE_WEB_API_KEY || cfg.apiKey;

  if (payload.idToken) {
    // 1. Verify Firebase ID Token via Identity Toolkit (no IAM required)
    if (apiKey) {
      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: payload.idToken }),
          },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            users?: Array<{
              email?: string;
              emailVerified?: boolean;
              displayName?: string;
              photoUrl?: string;
            }>;
          };
          const fbUser = data.users?.[0];
          if (fbUser?.email) {
            return {
              email: fbUser.email.trim().toLowerCase(),
              name:
                fbUser.displayName?.trim() || fbUser.email.split("@")[0] || "FLOMA Shopper",
              avatarUrl: fbUser.photoUrl,
            };
          }
        }
      } catch {}
    }

    // 2. Fallback: verify standard Google OAuth ID token
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.idToken)}`,
      );
      if (res.ok) {
        const info = (await res.json()) as {
          email?: string;
          email_verified?: string | boolean;
          name?: string;
          picture?: string;
          aud?: string;
        };
        const expectedAud = cfg.oAuthClientId;
        const audMatches = !expectedAud || !info.aud || info.aud === expectedAud;
        if (info.email && audMatches) {
          return {
            email: info.email.trim().toLowerCase(),
            name: info.name?.trim() || info.email.split("@")[0] || "FLOMA Shopper",
            avatarUrl: info.picture,
          };
        }
      }
    } catch {}
  }

  if (payload.accessToken) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${payload.accessToken}` },
        },
      );
      if (res.ok) {
        const info = (await res.json()) as {
          email?: string;
          name?: string;
          picture?: string;
        };
        if (info.email) {
          return {
            email: info.email.trim().toLowerCase(),
            name: info.name?.trim() || info.email.split("@")[0] || "FLOMA Shopper",
            avatarUrl: info.picture,
          };
        }
      }
    } catch {}
  }

  return null;
}

router.post("/google", async (req, res) => {
  try {
    const { idToken, accessToken } = req.body ?? {};
    if (
      (typeof idToken !== "string" || !idToken.trim()) &&
      (typeof accessToken !== "string" || !accessToken.trim())
    ) {
      res.status(400).json({ error: "Google credential token is required" });
      return;
    }

    const verified = await verifyGoogleCredentials({ idToken, accessToken });
    if (!verified || !verified.email) {
      res.status(401).json({ error: "Could not verify Google account" });
      return;
    }

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, verified.email))
      .limit(1);

    let user = existingUsers[0];
    if (!user) {
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomSecret, 10);
      const inserted = await db
        .insert(users)
        .values({
          name: verified.name,
          email: verified.email,
          passwordHash,
          role: "customer",
          isVerified: true,
          avatarUrl: verified.avatarUrl || null,
        })
        .returning();
      user = inserted[0];
    } else if ((!user.avatarUrl && verified.avatarUrl) || !user.isVerified) {
      const updated = await db
        .update(users)
        .set({
          isVerified: true,
          ...(verified.avatarUrl && !user.avatarUrl
            ? { avatarUrl: verified.avatarUrl }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      if (updated[0]) user = updated[0];
    }

    const tokens = generateTokens(user.id, user.role!);

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deviceInfo: req.headers["user-agent"] || "unknown",
    });

    const { passwordHash: _, totpSecret: __, ...safeUser } = user;
    res.json({
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

router.get("/google-bridge", (req, res) => {
  const rawRedirect = typeof req.query.redirect === "string" ? req.query.redirect : "";
  const allowedRedirect =
    /^(mobile:\/\/|exp:\/\/|https?:\/\/)/i.test(rawRedirect) ? rawRedirect : "/";
  const cfg = loadFirebaseConfig();
  const safeCfg = JSON.stringify({
    apiKey: cfg.apiKey || "",
    authDomain: cfg.authDomain || "",
    projectId: cfg.projectId || "",
    appId: cfg.appId || "",
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FLOMA — Continue with Google</title>
  <style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F8FAFC;color:#0F172A;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
    .card{max-width:380px;width:100%;background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:28px;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.08)}
    h1{font-size:20px;margin:0 0 8px}
    p{font-size:14px;color:#475569;margin:0 0 20px;line-height:1.5}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 18px;border-radius:12px;border:1px solid #CBD5E1;background:#fff;color:#0F172A;font-weight:600;font-size:15px;cursor:pointer}
    .err{margin-top:14px;color:#DC2626;font-size:13px;display:none}
  </style>
  <script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/11.0.2/firebase-auth-compat.js"></script>
</head>
<body>
  <div class="card">
    <h1>Sign in to FLOMA</h1>
    <p id="status">Connecting to Google…</p>
    <button id="go" class="btn" type="button">Continue with Google</button>
    <div id="err" class="err"></div>
  </div>
  <script>
    const firebaseConfig = ${safeCfg};
    const redirectTarget = ${JSON.stringify(allowedRedirect)};
    const statusEl = document.getElementById('status');
    const errEl = document.getElementById('err');
    const btn = document.getElementById('go');

    function finish(params) {
      const sep = redirectTarget.includes('?') ? '&' : '?';
      window.location.replace(redirectTarget + sep + new URLSearchParams(params).toString());
    }

    if (!firebaseConfig.apiKey) {
      errEl.textContent = 'Google Sign-In is not configured on this server.';
      errEl.style.display = 'block';
    } else {
      firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const provider = new firebase.auth.GoogleAuthProvider();

      auth.getRedirectResult().then(async (res) => {
        if (res && res.user) {
          statusEl.textContent = 'Signed in! Returning to FLOMA…';
          const idToken = await res.user.getIdToken();
          finish({ idToken });
        }
      }).catch((e) => {
        errEl.textContent = e && e.message ? e.message : 'Google sign-in failed';
        errEl.style.display = 'block';
      });

      btn.addEventListener('click', () => {
        errEl.style.display = 'none';
        statusEl.textContent = 'Opening Google Sign-In…';
        auth.signInWithRedirect(provider);
      });
    }
  </script>
</body>
</html>`);
});
export default router;
