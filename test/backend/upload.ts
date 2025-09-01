import * as XLSX from "xlsx";
import Papa from "papaparse";
import * as FileSystem from 'expo-file-system';

// --- Gemini API client (using fetch) ---
export async function callGemini(fileBase64: string, mimeType: string): Promise<any> {
  const promptText = mimeType.startsWith("image/")
    ? `You are an OCR engine specialized in extracting tables from images. Return JSON with {title, columns, rows}.`
    : `You are a document parser. Extract ALL tables as JSON array with {title, columns, rows}.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: promptText },
              { inlineData: { mimeType, data: fileBase64 } },
            ],
          },
        ],
      }),
    }
  );

  const json = await response.json();
  console.log("Gemini response:", JSON.stringify(json, null, 2));
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  console.log("Cleaned JSON:", cleaned);
  return JSON.parse(cleaned);
}

// --- Helper function to read file as base64 in React Native ---
async function readFileAsBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
}

// --- Helper function to convert base64 to ArrayBuffer ---
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- CSV/XLSX parsers ---
function parseCsvBuffer(buffer: ArrayBuffer) {
  const text = new TextDecoder().decode(buffer);
  const parsed = Papa.parse<string[]>(text, { header: true });
  return [
    {
      title: "CSV Table",
      columns: parsed.meta.fields || [],
      rows: parsed.data as any[],
    },
  ];
}

function parseXlsxBuffer(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  return [
    {
      title: "XLSX Table",
      columns: json[0] || [],
      rows: json.slice(1),
    },
  ];
}

// --- Main unified function for React Native/Expo ---
export async function getJsonData(file: any): Promise<any> {
  let base64: string;
  let buffer: ArrayBuffer;

  // Handle Expo DocumentPicker file object
  if (file.uri) {
    // Read file as base64 using Expo FileSystem
    base64 = await readFileAsBase64(file.uri);
    buffer = base64ToArrayBuffer(base64);
  } else {
    throw new Error("Unsupported file object - expected Expo DocumentPicker result with 'uri' property");
  }

  console.log(`File size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);

  // Get file extension and mime type
  const fileName = file.name || file.uri.split('/').pop() || '';
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mime = file.mimeType || file.type || '';

  const isCsv = mime === "text/csv" || ext === "csv";
  const isXlsx =
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    ["xlsx", "xls"].includes(ext || "");
  const isPdf = mime === "application/pdf" || ext === "pdf";
  const isImage = mime.startsWith("image/");
  const isDocx =
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx";

  if (isCsv) {
    return { tables: parseCsvBuffer(buffer) };
  }
  if (isXlsx) {
    return { tables: parseXlsxBuffer(buffer) };
  }
  if (isPdf || isImage || isDocx) {
    console.log(mime)
    console.log("base64", base64.substring(0, 30) + "...");
    console.log("Uploading to Gemini API for parsing...");
    const tables = await callGemini(base64, mime);
    console.log("Parsed tables from Gemini:", tables);
    return {tables};
  }

  throw new Error("Unsupported file type");
}