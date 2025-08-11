import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";

import { Logging, SyncConcept } from "./engine/mod.ts";
import { APIConcept } from "./concepts/api.ts";
import { ConceptLibraryConcept } from "./concepts/concept_library.ts";
import { makeApiConceptSyncs } from "./syncs/api_concepts.ts";
import { getSupabase } from "./db/supabase.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Req = {
  params?: Record<string, string>;
  body?: unknown;
  query?: Record<string, unknown>;
};

const app = express();
app.use(cors());
app.use(express.json());

// Concepts and sync engine
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE;
const sb = getSupabase();
const concepts = {
  API: new APIConcept(),
  Library: new ConceptLibraryConcept(sb),
};
const { API, Library } = Sync.instrument(concepts);
Sync.register(makeApiConceptSyncs(API, Library));

// Very simple demo user. In production, use auth middleware
const DEMO_USER: { user: string; name: string } = {
  user: "demo-user",
  name: "Concept Creator",
};

function normalize(req: Req): Record<string, unknown> {
  const params = req.params || {};
  const input = Object.assign(
    {},
    (req.body ?? {}) as object,
    (req.query ?? {}) as object,
    params as object,
    {
      owner: DEMO_USER.user,
      user: DEMO_USER.user,
    },
  );
  return input;
}

// Generic handler that funnels to API concept
async function handle(method: string, path: string, req: Req, res: any) {
  try {
    const { request } = await API.request({ method, path, ...normalize(req) });
    const timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 10000);
    const TIMEOUT = Symbol("timeout");
    const output = await Promise.race([
      (API as any)._waitForResponse({ request }),
      new Promise((resolve) => setTimeout(() => resolve(TIMEOUT), timeoutMs)),
    ]);
    if (output === TIMEOUT) {
      res.status(504).json({ error: "Timed out waiting for response" });
      return;
    }
    if (output === undefined) {
      res.status(500).json({ error: "No response" });
    } else {
      res.json(output);
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Server error", detail: err?.message || String(err) });
  }
}

// Routes
app.get("/api/concepts", (req, res) => handle("GET", "/concepts", req, res));
app.post("/api/concepts", (req, res) => handle("POST", "/concepts", req, res));
app.get(
  "/api/concepts/:concept",
  (req, res) => handle("GET", "/concepts/:concept", req, res),
);
app.patch(
  "/api/concepts/:concept/title",
  (req, res) => handle("PATCH", "/concepts/:concept/title", req, res),
);
app.patch(
  "/api/concepts/:concept/description",
  (req, res) => handle("PATCH", "/concepts/:concept/description", req, res),
);
app.patch(
  "/api/concepts/:concept/content",
  (req, res) => handle("PATCH", "/concepts/:concept/content", req, res),
);
app.delete(
  "/api/concepts/:concept",
  (req, res) => handle("DELETE", "/concepts/:concept", req, res),
);

// Simple health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Static client: prefer built React app if available, else fallback to legacy web/
const clientDist = path.join(__dirname, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.use(express.static(path.join(__dirname, "web")));
}

const PORT: number = Number(process.env.PORT) || 4175;
app.listen(PORT, () => console.log(`Concept Design Library API running at http://localhost:${PORT}`));
