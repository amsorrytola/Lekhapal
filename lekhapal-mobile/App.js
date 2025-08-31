// App.js — Final corrected
import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";
import { jsPDF } from "jspdf"; // ✅ static import

let Sharing = null;
let Print = null;
if (Platform.OS !== "web") {
  try {
    Sharing = require("expo-sharing");
    Print = require("expo-print");
  } catch (e) {
    console.warn("expo-sharing / expo-print not available:", e.message);
  }
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ||
  `http://${Constants.manifest?.debuggerHost?.split(":")[0] || "10.81.83.62"}:4000`
).replace(/:\d+$/, ":4000");

function safeParseJson(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function ensureArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const p = safeParseJson(v, null);
    if (Array.isArray(p)) return p;
  }
  return [];
}

function normalizeServerTable(tbl) {
  if (!tbl) return { title: "Untitled", columns: [], rows: [] };

  const columns = ensureArray(tbl.columns);
  let rowsRaw = tbl.rows ?? tbl.data ?? [];

  if (typeof rowsRaw === "string") {
    const parsed = safeParseJson(rowsRaw, null);
    if (parsed !== null) rowsRaw = parsed;
  }

  let rows = [];
  if (Array.isArray(rowsRaw)) {
    if (rowsRaw.length === 0) {
      rows = [];
    } else if (!Array.isArray(rowsRaw[0]) && typeof rowsRaw[0] === "object") {
      const cols = columns.length ? columns : Object.keys(rowsRaw[0]);
      rows = rowsRaw.map((obj) => cols.map((c) => String(obj?.[c] ?? "")));
      return { title: tbl.title || "Untitled", columns: cols, rows };
    } else if (Array.isArray(rowsRaw[0])) {
      rows = rowsRaw.map((r) =>
        Array.isArray(r)
          ? r.map((c) => (c === null || c === undefined ? "" : String(c)))
          : []
      );
    } else {
      rows = rowsRaw.map((r) => [String(r ?? "")]);
    }
  } else {
    rows = [];
  }

  const finalCols = columns.length
    ? columns
    : rows.length && Array.isArray(rows[0])
    ? rows[0].map((_, i) => `col${i + 1}`)
    : [];

  const normalizedRows = rows.map((r) => {
    const targetLen = finalCols.length;
    const copy = Array.from(r);
    while (copy.length < targetLen) copy.push("");
    if (copy.length > targetLen) copy.length = targetLen;
    return copy;
  });

  return { title: tbl.title || "Untitled", columns: finalCols, rows: normalizedRows };
}

export default function App() {
  const [file, setFile] = useState(null);
  const [table, setTable] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); // ✅ status messages

  // Pick file
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/csv", "image/*"],
        copyToCacheDirectory: true,
      });
      if (res.type === "cancel") return;
      const asset = (res.assets && res.assets[0]) || res;
      setFile({
        uri: asset.uri || asset.localUri,
        name: asset.name || `upload-${Date.now()}`,
        mimeType: asset.mimeType || "application/octet-stream",
      });
    } catch (e) {
      Alert.alert("File picker error", e?.message || String(e));
    }
  };

  // Upload file
  const uploadFile = async () => {
    if (!file?.uri) return Alert.alert("Pick a file first");
    setLoading(true);
    setStatus("Uploading file…");
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(file.uri).then((r) => r.blob());
        formData.append("file", blob, file.name);
      } else {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        });
      }

      setStatus("Parsing file on server…");
      const res = await fetch(`${BASE_URL}/upload`, { method: "POST", body: formData });
      setStatus("Extracting tables with AI (this may take ~10s)…");
      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const data = safeParseJson(text, null);
      if (data?.tables?.length > 0) {
        const normalized = normalizeServerTable(data.tables[0]);
        setTable(normalized);
        setTableId(data.tableId ?? null);
        setStatus("Almost done, rendering results…");
      } else {
        Alert.alert("No tables returned");
      }
    } catch (e) {
      Alert.alert("Upload error", e?.message || String(e));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  // Save edits
  const saveEdits = async () => {
    if (!tableId || !table) return Alert.alert("Nothing to save");
    setLoading(true);
    setStatus("Saving edits…");
    try {
      const payload = { ...table };
      const res = await fetch(`${BASE_URL}/table/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const updated = safeParseJson(text, null);
      setTable(normalizeServerTable(updated));
      Alert.alert("Saved", "Table saved ✅");
    } catch (e) {
      Alert.alert("Save error", e?.message || String(e));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    if (!table) return Alert.alert("No table");
    setLoading(true);
    setStatus("Generating PDF…");
    try {
      const safeTitle = (table.title || "Table").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `
        <html><head><meta charset="utf-8"/>
        <style>table{border-collapse:collapse} th,td{border:1px solid #ccc;padding:6px}</style>
        </head><body>
        <h3>${safeTitle}</h3>
        <table><thead><tr>
        ${(table.columns || []).map((c) => `<th>${c}</th>`).join("")}
        </tr></thead><tbody>
        ${(table.rows || [])
          .map(
            (r) =>
              `<tr>${(Array.isArray(r) ? r : []).map((c) => `<td>${c}</td>`).join("")}</tr>`
          )
          .join("")}
        </tbody></table></body></html>`;

      if (Platform.OS === "web") {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        await new Promise((resolve, reject) => {
          doc.html(html, {
            x: 20,
            y: 20,
            width: doc.internal.pageSize.getWidth() - 40,
            windowWidth: 1000,
            callback: () => {
              doc.save(`${safeTitle.replace(/[^a-z0-9_.-]/gi, "_")}.pdf`);
              resolve();
            },
          });
        });
        Alert.alert("PDF", "Download should start.");
      } else if (Print) {
        const { uri } = await Print.printToFileAsync({ html });
        if (Sharing) await Sharing.shareAsync(uri);
      }
    } catch (e) {
      Alert.alert("PDF error", e?.message || String(e));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const safeTable = table ? normalizeServerTable(table) : null;

  const renderCell = (ri, ci, value) => (
    <TextInput
      key={`r${ri}c${ci}`}
      style={styles.cell}
      value={String(value ?? "")}
      onChangeText={(txt) => {
        const rows = (safeTable.rows || []).map((r) => (Array.isArray(r) ? [...r] : []));
        rows[ri][ci] = txt;
        setTable({ ...safeTable, rows });
      }}
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Lekhapal Mobile</Text>
      <Text style={styles.meta}>API: {BASE_URL}</Text>

      {!safeTable && (
        <View style={styles.controls}>
          <Button title="Pick File" onPress={pickFile} />
          <View style={{ height: 10 }} />
          <Button title="Upload & Parse" onPress={uploadFile} disabled={!file || loading} />
        </View>
      )}

      {loading && (
        <View style={{ padding: 12 }}>
          <ActivityIndicator size="large" />
          <Text>{status || "Working…"}</Text>
        </View>
      )}

      {safeTable && !loading && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{safeTable.title}</Text>
          <ScrollView horizontal>
            <View>
              <View style={styles.row}>
                {safeTable.columns.map((c, i) => (
                  <Text key={`h${i}`} style={[styles.cell, styles.header]}>
                    {c}
                  </Text>
                ))}
              </View>
              {safeTable.rows.map((row, ri) => (
                <View key={`r${ri}`} style={styles.row}>
                  {row.map((cell, ci) => renderCell(ri, ci, cell))}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={{ height: 10 }} />
          <Button title="Save" onPress={saveEdits} />
          <View style={{ height: 8 }} />
          <Button title="Download PDF" onPress={downloadPDF} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 56, backgroundColor: "#fafafa", minHeight: "100%" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  meta: { fontSize: 12, color: "#666", marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  controls: { marginBottom: 12 },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 10, elevation: 2 },
  row: { flexDirection: "row" },
  cell: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    minWidth: 100,
    fontSize: 14,
  },
  header: { fontWeight: "700", backgroundColor: "#eee" },
});
