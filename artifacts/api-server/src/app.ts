import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app: Express = express();

// Security Headers (configured to allow AI Studio preview iframe and external fonts/images)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  }),
);

// Tiered Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Upload rate limit exceeded." },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Payment action rate limit exceeded." },
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/admin-login", authLimiter);
app.use("/api/auth/admin-login-2fa", authLimiter);
app.use("/api/uploads", uploadLimiter);
app.use("/api/payments", paymentLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

// Serve admin-web dashboard at /admin
const adminDistCandidates = [
  path.resolve(process.cwd(), "artifacts/admin-web/dist"),
  path.resolve(process.cwd(), "../admin-web/dist"),
];
const adminDistDir = adminDistCandidates.find((dir) => existsSync(dir));
if (adminDistDir) {
  app.use("/admin", express.static(adminDistDir));
  app.get(["/admin", "/admin/{*splat}"], (_req, res) => {
    res.sendFile(path.join(adminDistDir, "index.html"));
  });
}

// Serve mobile web storefront built output at /
const mobileDistCandidates = [
  path.resolve(process.cwd(), "artifacts/mobile/dist"),
  path.resolve(process.cwd(), "../mobile/dist"),
];
const mobileDistDir = mobileDistCandidates.find((dir) => existsSync(dir));
if (mobileDistDir) {
  app.use(
    "/assets",
    express.static(path.join(mobileDistDir, "assets"), {
      dotfiles: "allow",
      maxAge: "7d",
    }),
  );
  app.use(express.static(mobileDistDir));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/admin")) {
      return next();
    }
    if (req.path.startsWith("/assets/") || req.path.startsWith("/_expo/")) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(mobileDistDir, "index.html"));
  });
}

export default app;
