// App.tsx — TypeScript + Integrated getJsonData

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
import Constants from "expo-constants";

// 👇 Import the helper function
import { getJsonData } from "../../backend/upload";

let Sharing: any = null;
let Print: any = null;
if (Platform.OS !== "web") {
  try {
    Sharing = require("expo-sharing");
    Print = require("expo-print");
  } catch (e: any) {
    console.warn("expo-sharing / expo-print not available:", e.message);
  }
}

// ---------- Types ----------
interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

interface FileInfo {
  uri: string;
  name: string;
  mimeType: string;
}

// ---------- Helpers ----------
function safeParseJson<T = any>(str: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function ensureArray(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const p = safeParseJson(v, null);
    if (Array.isArray(p)) return p;
  }
  return [];
}

function normalizeServerTable(tbl: any): TableData {
  if (!tbl) return { title: "Untitled", columns: [], rows: [] };

  const columns = ensureArray(tbl.columns);
  let rowsRaw: any = tbl.rows ?? tbl.data ?? [];

  if (typeof rowsRaw === "string") {
    const parsed = safeParseJson(rowsRaw, null);
    if (parsed !== null) rowsRaw = parsed;
  }

  let rows: string[][] = [];
  if (Array.isArray(rowsRaw)) {
    if (rowsRaw.length === 0) {
      rows = [];
    } else if (!Array.isArray(rowsRaw[0]) && typeof rowsRaw[0] === "object") {
      const cols = columns.length ? columns : Object.keys(rowsRaw[0]);
      rows = rowsRaw.map((obj: any) => cols.map((c) => String(obj?.[c] ?? "")));
      return { title: tbl.title || "Untitled", columns: cols, rows };
    } else if (Array.isArray(rowsRaw[0])) {
      rows = rowsRaw.map((r) =>
        Array.isArray(r)
          ? r.map((c) => (c === null || c === undefined ? "" : String(c)))
          : []
      );
    } else {
      rows = rowsRaw.map((r: any) => [String(r ?? "")]);
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

// ---------- Component ----------
export default function App() {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [table, setTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Pick file
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/csv", "image/*"],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const asset = (res.assets && res.assets[0]) || res;
      setFile({
        uri: asset.uri,
        name: asset.name || `upload-${Date.now()}`,
        mimeType: asset.mimeType || "application/octet-stream",
      });
    } catch (e: any) {
      Alert.alert("File picker error", e?.message || String(e));
    }
  };

  // Parse file locally with Gemini/CSV/XLSX logic
  const parseFile = async () => {
    if (!file?.uri) return Alert.alert("Pick a file first");
    setLoading(true);
    setStatus("Parsing file locally…");
    try {
      // Convert RN File to a File-like object for getJsonData

      const data = await getJsonData(file);
      console.log(data)

      if (data?.tables?.length > 0) {
        const normalized = normalizeServerTable(data.tables[0]);
        setTable(normalized);
        setStatus("Parsed successfully ✅");
      } else {
        setTable(data?.tables)
      }
    } catch (e: any) {
      Alert.alert("Parse error", e?.message || String(e));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  const safeTable = table ? normalizeServerTable(table) : null;

  const renderCell = (ri: number, ci: number, value: string) => (
    <TextInput
      key={`r${ri}c${ci}`}
      style={styles.cell}
      value={String(value ?? "")}
      onChangeText={(txt) => {
        if (!safeTable) return;
        const rows = (safeTable.rows || []).map((r) => (Array.isArray(r) ? [...r] : []));
        rows[ri][ci] = txt;
        setTable({ ...safeTable, rows });
      }}
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Lekhapal Mobile</Text>

      {!safeTable && (
        <View style={styles.controls}>
          <Button title="Pick File" onPress={pickFile} />
          <View style={{ height: 10 }} />
          <Button title="Parse File" onPress={parseFile} disabled={!file || loading} />
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
        </View>
      )}
    </ScrollView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 56, backgroundColor: "#fafafa", minHeight: "100%" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
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
