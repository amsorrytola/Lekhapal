import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import fsp from "fs/promises";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { parse as parseCsv } from "csv-parse/sync";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Multer: save uploads to ./uploads (ensure folder exists)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/health", (req, res) => res.json({ ok: true }));

// --- Upload + Parse ---
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const buffer = fs.readFileSync(filePath);

    let tables;

    // Fast-path: CSV parses locally (cheaper & reliable)
    if (mimeType === "text/csv" || req.file.originalname?.endsWith(".csv")) {
      const records = parseCsv(buffer.toString("utf8"), { skip_empty_lines: true });
      const columns = Array.isArray(records[0]) ? records[0] : [];
      const rows = Array.isArray(records[0]) ? records.slice(1) : records;

      tables = [{ title: req.file.originalname || "CSV Table", columns, rows }];
    } else {
      // Use Gemini for PDFs, images, Excel, etc.
      const contents = [
        {
          role: "user",
          parts: [
            {
              text: `Extract all tables from this document and return ONLY pure JSON.
              
Schema: {"tables": [{"title": string, "columns": string[], "rows": string[][]}]}`,
            },
            { inlineData: { mimeType, data: buffer.toString("base64") } },
          ],
        },
      ];

      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({ contents });
      const rawText = result.response.text();
      const cleaned = extractJson(rawText);

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        return res.status(500).json({ error: "Invalid JSON from Gemini", raw: rawText });
      }

      if (Array.isArray(parsed)) {
        tables = parsed; // already a list of tables
      } else if (parsed?.tables) {
        tables = parsed.tables;
      } else {
        return res.status(422).json({ error: "Unexpected JSON structure", parsed });
      }

      // Normalize rows to string[][]
      tables = tables.map((t, idx) => {
        let rows = [];
        if (Array.isArray(t.rows)) {
          if (t.rows.length && !Array.isArray(t.rows[0])) {
            // Convert array of objects -> 2D array using columns order
            const cols = t.columns || Object.keys(t.rows[0] || {});
            rows = t.rows.map((obj) => cols.map((c) => String(obj?.[c] ?? "")));
            return { title: t.title || `Table ${idx + 1}`, columns: cols, rows };
          }
          rows = t.rows.map((r) => r.map((v) => String(v ?? "")));
        }

        return {
          title: t.title || `Table ${idx + 1}`,
          columns: Array.isArray(t.columns) ? t.columns.map((c) => String(c ?? "")) : [],
          rows,
        };
      });
    }

    if (!tables?.length) return res.status(422).json({ error: "No tables found" });

    // Save first table to DB
    const first = tables[0];
    const saved = await prisma.tableData.create({
      data: {
        title: first.title || "Untitled",
        columns: first.columns,
        rows: first.rows,
      },
    });

    // Cleanup upload
    void fsp.unlink(filePath).catch(() => {});

    res.json({ tableId: saved.id, tables });
  } catch (e) {
    console.error("/upload error", e);
    res.status(500).json({ error: e.message || "Upload failed" });
  }
});

// Get a table by ID
app.get("/table/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const row = await prisma.tableData.findUnique({ where: { id } });
  if (!row) return res.status(404).json({ error: "Not found" });

  res.json(row);
});

// Update a table (title/columns/rows)
app.put("/table/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const { title, columns, rows } = req.body || {};
  if (!Array.isArray(rows) || (rows[0] && !Array.isArray(rows[0]))) {
    return res.status(400).json({ error: "rows must be a 2D array" });
  }
  if (columns && !Array.isArray(columns)) {
    return res.status(400).json({ error: "columns must be an array" });
  }

  try {
    const updated = await prisma.tableData.update({
      where: { id },
      data: {
        title: title ?? undefined,
        columns: columns ?? undefined,
        rows: rows ?? undefined,
      },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message || "Update failed" });
  }
});

// Export CSV
app.get("/table/:id/export/csv", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const row = await prisma.tableData.findUnique({ where: { id } });
  if (!row) return res.status(404).json({ error: "Not found" });

  const csv = toCsv(row.columns || [], row.rows || []);
  const filename = `${(row.title || "table").replace(/[^a-z0-9_-]/gi, "_")}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});

// --- Helpers ---
function extractJson(raw) {
  // Strip ``` fences if present
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-z]*\n/, "").replace(/```\s*$/, "");
  }

  // Heuristic: if multiple JSON blocks are present, grab the first matching braces
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return t.slice(start, end + 1);
  }
  return t;
}

function toCsv(columns, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const parts = [];
  if (columns?.length) parts.push(columns.map(esc).join(","));
  for (const r of rows) parts.push((r || []).map(esc).join(","));
  return parts.join("\n");
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
