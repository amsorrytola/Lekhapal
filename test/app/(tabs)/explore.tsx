// explore.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import ClearCache from "../../components/ClearCache";
import { getJsonData } from "../../backend/upload";
import TablesViewer, { TableData } from "../../components/TablesViewer";

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

interface FileInfo {
  uri: string;
  name: string;
  mimeType: string;
}

export default function App() {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
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

  // Parse file with backend
  const parseFile = async () => {
    if (!file?.uri) return Alert.alert("Pick a file first");
    setLoading(true);
    setStatus("Parsing file…");
    try {
      const data = await getJsonData(file);
      console.log("Raw server data:", data);

      if (data?.tables?.length > 0) {
        setTables(data.tables);
        setStatus("Parsed successfully ✅");
      } else {
        setTables([]);
        setStatus("No tables found");
      }
    } catch (e: any) {
      Alert.alert("Parse error", e?.message || String(e));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Lekhapal Mobile</Text>

      {tables.length === 0 && !loading && (
        <View style={styles.controls}>
          <Button title="Pick File" onPress={pickFile} />
          <View style={{ height: 10 }} />
          <Button
            title="Parse File"
            onPress={parseFile}
            disabled={!file || loading}
          />
        </View>
      )}

      {loading && (
        <View style={{ padding: 12 }}>
          <ActivityIndicator size="large" />
          <Text>{status || "Working…"}</Text>
        </View>
      )}

      {tables.length > 0 && !loading && <TablesViewer tables={tables} />}

      <ClearCache
        resetStates={{
          file: setFile,
          table: () => setTables([]),
          status: setStatus,
        }}
        afterClear={() => console.log("✅ Cache cleared and states reset")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#fafafa",
    minHeight: "100%",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  controls: { marginBottom: 12 },
});
