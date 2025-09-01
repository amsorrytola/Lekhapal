// src/index.js
import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import os from "os";
import crypto from "crypto";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import mime from "mime-types";
import { parse as csvParse } from "csv-parse/sync";
import XLSX from "xlsx";
import { fileTypeFromBuffer } from "file-type";


// ---------- BOOT / LOG HELPERS ----------

// remove ```json ... ``` fences that Gemini often wraps responses with
function stripMarkdownFences(text = "") {
  if (!text) return "";
  return text
    .replace(/^\s*```(?:json)?/i, "")   // strip starting ```json
    .replace(/```$/i, "")               // strip ending ```
    .trim();
}

// normalize Gemini output into [{title, columns, rows}]
function normalizeTables(data) {
  if (!data) return [];

  let arr = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (typeof data === "object") {
    arr = [data];
  } else if (typeof data === "string") {
    try {
      arr = JSON.parse(data);
    } catch {
      return [];
    }
  }

  return arr.map((tbl, idx) => {
    const title = tbl.title || `Table ${idx + 1}`;
    const columns = tbl.columns || Object.keys(tbl[0] || {});
    const rows = tbl.rows || (Array.isArray(tbl.data) ? tbl.data : []);

    return { title, columns, rows };
  });
}

const startTS = Date.now();
const log = (...args) => console.log(new Date().toISOString(), ...args);
const bytesHuman = (n = 0) => {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
};
const mask = (s = "", show = 4) =>
  typeof s === "string" && s.length > show ? `${s.slice(0, show)}…(${s.length - show} hidden)` : s;

log("🚀 Starting backend");
log("Node:", process.version, "| cwd:", process.cwd());
log("DATABASE_URL present:", !!process.env.DATABASE_URL);

// --- MIME HELPER ---
async function detectMimeFromBuffer(buffer, filename = "") {
  try {
    const type = await fileTypeFromBuffer(buffer);
    if (type) return type.mime;
  } catch (e) {
    log("detectMimeFromBuffer error:", e.message);
  }
  return mime.lookup(filename) || null;
}

// ---------- PRISMA ----------
const prisma = new PrismaClient();
prisma.$on("query", (e) => log("🟣 PRISMA QUERY:", e.query, "params:", e.params, "duration:", e.duration));
prisma.$on("error", (e) => log("🔴 PRISMA ERROR:", e.message));

// ---------- UPLOADS DIR ----------
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
log("📁 Upload dir:", uploadDir);

// ---------- MULTER ----------
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
log("🧰 Multer configured");

// ---------- EXPRESS ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const rid = crypto.randomBytes(6).toString("hex");
  req._rid = rid;
  log(`➡️ [${rid}] ${req.method} ${req.originalUrl} | ip=${req.ip} | ct=${req.headers["content-type"]}`);
  const start = Date.now();
  res.on("finish", () =>
    log(`⬅️ [${rid}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`)
  );
  next();
});


const ai = new GoogleGenerativeAI("AIzaSyAm6-XaSLdkKp4vjDJmifOey-y9ipKwzMA" || "DUMMY_KEY");

// ---------- DEBUG ROUTES ----------

// health
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    uptime_s: Math.round((Date.now() - startTS) / 1000),
    node: process.version,
    uploadsDir: uploadDir,
    geminiKeyPresent: !!"AIzaSyAm6-XaSLdkKp4vjDJmifOey-y9ipKwzMA",
  });
});

// test Gemini API directly
app.get("/debug/gemini", async (req, res) => {
  try {
    if (!"AIzaSyAm6-XaSLdkKp4vjDJmifOey-y9ipKwzMA") {
      return res.status(400).json({ ok: false, error: "No GEMINI_API_KEY set in env" });
    }
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const r = await model.generateContent("Hello Gemini, say hi in JSON!");
    res.json({ ok: true, reply: r.response.text() });
  } catch (e) {
    log("❌ Gemini debug test failed:", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- UPLOAD HANDLER (truncated to relevant Gemini changes) ----------

// ---------- UPLOAD & PARSE ----------
// ---------- UPLOAD & PARSE ----------
app.post("/upload", upload.single("file"), async (req, res) => {
  const rid = req._rid || "?";
  try {
    log(`[${rid}] /upload called`);
    log(`[${rid}] headers keys:`, Object.keys(req.headers || {}).slice(0, 20));
    log(`[${rid}] body keys:`, Object.keys(req.body || {}));
    log(`[${rid}] multer file present:`, !!req.file);

    let buffer = null;
    let originalName = req.body?.name || "upload";
    let detectedMime = null;

    // 1) Multer (RN/web FormData with Blob)
    if (req.file) {
      const filePath = req.file.path;
      originalName = req.file.originalname || req.file.filename || originalName;
      log(`[${rid}] multer file path: ${filePath}, originalName: ${originalName}, reported mime: ${req.file.mimetype}`);
      try {
        buffer = fs.readFileSync(filePath);
        log(`[${rid}] Read uploaded file size ${bytesHuman(buffer.length)}`);
      } catch (e) {
        log(`[${rid}] Failed to read multer file:`, e.message);
        return res.status(500).json({ error: "Failed to read uploaded file" });
      }
      detectedMime =
        (await detectMimeFromBuffer(buffer, originalName)) ||
        req.file.mimetype ||
        mime.lookup(originalName) ||
        null;
    }

    // 2) JSON/base64
    else if (req.body && (req.body.data || req.body.file || req.body.base64)) {
      const payload = req.body.data || req.body.file || req.body.base64;
      originalName = req.body.name || originalName;
      const str = String(payload || "");
      if (str.startsWith("data:")) {
        const m = str.match(/^data:([^;]+);base64,(.*)$/s);
        if (!m) {
          log(`[${rid}] Malformed data URI`);
          return res.status(400).json({ error: "Malformed data URI" });
        }
        const mimeFromData = m[1];
        const b64 = m[2];
        buffer = Buffer.from(b64, "base64");
        detectedMime = mimeFromData || mime.lookup(originalName) || null;
        log(`[${rid}] Received data URI, mimeFromData=${mimeFromData}, bytes=${bytesHuman(buffer.length)}`);
      } else {
        buffer = Buffer.from(str, "base64");
        detectedMime = req.body.type || mime.lookup(originalName) || null;
        log(`[${rid}] Received plain base64, guessed mime=${detectedMime}, bytes=${bytesHuman(buffer.length)}`);
      }
    }

    // 3) RN nested object
    else if (req.body && req.body.file && typeof req.body.file === "object" && req.body.file.uri) {
      log(`[${rid}] Received nested file object in body; attempting to fetch file.uri`);
      try {
        const fetchRes = await fetch(req.body.file.uri);
        if (!fetchRes.ok) throw new Error("fetch failed");
        const arr = await fetchRes.arrayBuffer();
        buffer = Buffer.from(arr);
        detectedMime =
          req.body.file.type ||
          mime.lookup(req.body.file.name || originalName) ||
          null;
        log(`[${rid}] Fetched nested file, bytes=${bytesHuman(buffer.length)} mime=${detectedMime}`);
      } catch (e) {
        log(`[${rid}] Nested file fetch failed:`, e.message);
      }
    }

    // No buffer case
    if (!buffer) {
      log(`[${rid}] No file buffer available`);
      return res.status(400).json({ error: "No file uploaded or base64 provided" });
    }

    // ✅ unified finalMime
    const finalMime =
      (await detectMimeFromBuffer(buffer, originalName)) ||
      detectedMime ||
      mime.lookup(originalName) ||
      null;

    log(`[${rid}] initial mime detection => ${finalMime}`);

    if (!finalMime) {
      return res.status(400).json({
        error: "Unsupported or unknown file type. Please upload PDF, JPEG/PNG/GIF/TIFF/WEBP image, CSV or XLSX.",
      });
    }

    // --- Classification ---
    const isImage = finalMime.startsWith("image/");
    const isPdf = finalMime === "application/pdf";
    const isCsv = finalMime === "text/csv" || path.extname(originalName).toLowerCase() === ".csv";
    const isXlsx =
      finalMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      [".xlsx", ".xls"].includes(path.extname(originalName).toLowerCase());
    const isDocx =
      finalMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      path.extname(originalName).toLowerCase() === ".docx";

    log(`[${rid}] Classification image=${isImage} pdf=${isPdf} csv=${isCsv} xlsx=${isXlsx} docx=${isDocx}`);

    // --- CSV ---
    if (isCsv) {
      try {
        const tables = parseCsvBufferToTables(buffer);
        const first = tables[0];
        const saved = await prisma.tableData.create({
          data: { title: first.title, columns: JSON.stringify(first.columns), rows: JSON.stringify(first.rows) },
        });
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        return res.json({ tableId: saved.id, tables });
      } catch (e) {
        return res.status(500).json({ error: "CSV parse failed", detail: e.message });
      }
    }

    // --- XLSX ---
    if (isXlsx) {
      try {
        const tables = parseXlsxBufferToTables(buffer);
        const first = tables[0];
        const saved = await prisma.tableData.create({
          data: { title: first.title, columns: JSON.stringify(first.columns), rows: JSON.stringify(first.rows) },
        });
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        return res.json({ tableId: saved.id, tables });
      } catch (e) {
        return res.status(500).json({ error: "XLSX parse failed", detail: e.message });
      }
    }

    // --- Gemini fallback (image/pdf/docx) ---
    let promptText = isImage
      ? `You are an OCR engine specialized in extracting tables from images. Return JSON with {title, columns, rows}.`
      : `You are a document parser. Extract ALL tables as JSON array with {title, columns, rows}.`;

    log(`[${rid}] Will call Gemini. mime=${finalMime} size=${bytesHuman(buffer.length)} promptType=${isImage ? "image/ocr" : "document"}`);

    const inlineData = buffer.toString("base64");
    const contents = [
      {
        role: "user",
        parts: [
          { text: promptText },
          { inlineData: { mimeType: finalMime, data: inlineData } },
        ],
      },
    ];

    let response;
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      response = await model.generateContent({ contents });
    } catch (e) {
      return res.status(502).json({ error: "Gemini API error", detail: e?.message || String(e) });
    }

    const rawText = response?.response?.text?.() ?? "";
    log(`[${rid}] Gemini raw length=${rawText.length}`);
    if (rawText.length > 400) log(`[${rid}] Gemini preview:`, rawText.slice(0, 400));

    const cleaned = stripMarkdownFences(rawText);
    let parsedJson;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from Gemini", raw: rawText, cleaned });
    }

    const tables = normalizeTables(parsedJson);
    if (!tables.length) {
      return res.status(500).json({ error: "No tables extracted" });
    }

    const first = tables[0];
    const saved = await prisma.tableData.create({
      data: { title: first.title, columns: JSON.stringify(first.columns), rows: JSON.stringify(first.rows) },
    });

    if (req.file?.path) fs.unlink(req.file.path, () => {});

    return res.json({ tableId: saved.id, tables });
  } catch (err) {
    log(`[${rid}] Unexpected handler error:`, err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});