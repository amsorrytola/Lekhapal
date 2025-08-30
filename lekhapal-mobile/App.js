import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Constants from "expo-constants";

/**
 * Robust base URL discovery for development & devices.
 * Priority:
 * 1) EXPO_PUBLIC_API_URL (recommended)
 * 2) Android emulator (10.0.2.2), iOS simulator (localhost)
 * 3) Derive from Expo hostUri (LAN; works in Expo Go)
 * 4) Last-resort fallback — replace with your LAN IP
 */
const resolveBaseUrl = () => {
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.API_URL;
  if (envUrl) return envUrl;

  const isDevice = Constants.isDevice;
  const isAndroid = Platform.OS === "android";
  const isIOS = Platform.OS === "ios";

  if (!isDevice) {
    // Emulators/Simulators
    if (isAndroid) return "http://10.0.2.2:4000"; // Android emulator -> host machine
    if (isIOS) return "http://localhost:4000"; // iOS simulator -> host machine
  }

  // Expo Go on physical device — try to derive Metro host
  const hostUri = Constants.expoConfig?.hostUri; // e.g., "10.52.200.182:8081"
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }

  // Fallback: replace this with your machine LAN IP if all else fails
  return "http://192.168.1.100:4000";
};

const BASE_URL = resolveBaseUrl();

export default function App() {
  const [file, setFile] = useState(null);
  const [table, setTable] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editText, setEditText] = useState("");

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
          "image/*",
        ],
        multiple: false,
        copyToCacheDirectory: true, // helps with iOS share/cache
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Normalize for upload (iOS "ph://" URIs & missing extensions)
        const uploadable = await ensureUploadableAsset(asset);
        setFile(uploadable);
      }
    } catch (e) {
      console.error("Picker error", e);
      Alert.alert("File Picker Error", e?.message || "Could not pick file");
    }
  };

  /**
   * iOS can return ph:// URIs; some Android URIs are content://.
   * To be safe, copy to cache with a proper filename.
   */
  const ensureUploadableAsset = async (asset) => {
    try {
      const { uri, name, mimeType } = asset;
      const ext = name?.includes(".") ? name.split(".").pop() : undefined;

      const needsCopy = uri.startsWith("ph://") || !ext;
      if (!needsCopy) return asset;

      const dest = FileSystem.cacheDirectory + (name || `upload-${Date.now()}`);
      await FileSystem.copyAsync({ from: uri, to: dest });
      return { ...asset, uri: dest };
    } catch (e) {
      console.warn("ensureUploadableAsset fallback", e);
      return asset; // best effort
    }
  };

  const uploadFile = async () => {
    if (!file?.uri) {
      Alert.alert("No file", "Please pick a file first.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name || "upload",
        type: file.mimeType || "application/octet-stream",
      });

      const res = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed (${res.status}): ${txt}`);
      }

      const data = await res.json();
      if (data.tables?.length) {
        setTable(data.tables[0]);
        setTableId(data.tableId);
        setEditing(false);
        setEditText("");
      } else {
        throw new Error("No tables returned from server");
      }
    } catch (e) {
      console.error("Upload error", e);
      Alert.alert("Upload Error", e?.message || "Could not upload file");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditText(JSON.stringify(table.rows, null, 2));
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!tableId) return Alert.alert("No table", "Nothing to save.");

    let newRows = null;
    try {
      newRows = JSON.parse(editText);
      if (!Array.isArray(newRows) || (newRows[0] && !Array.isArray(newRows[0]))) {
        throw new Error(
          'rows must be a 2D array, e.g. [["A","B"], ["1","2"]]'
        );
      }
    } catch (e) {
      return Alert.alert("Invalid JSON", e?.message || "Please fix the rows JSON");
    }

    setLoading(true);
    try {
      const payload = {
        title: table.title,
        columns: table.columns,
        rows: newRows,
      };
      const res = await fetch(`${BASE_URL}/table/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed (${res.status}): ${txt}`);
      }

      const saved = await res.json();
      setTable(saved);
      setEditing(false);
      Alert.alert("Saved", "Table saved successfully");
    } catch (e) {
      console.error("Save error", e);
      Alert.alert("Save Error", e?.message || "Could not save table");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (!tableId) return Alert.alert("No table", "Nothing to download.");
    try {
      const filename = `${(table?.title || "table").replace(
        /[^a-z0-9_-]/gi,
        "_"
      )}.csv`;
      const dest = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        `${BASE_URL}/table/${tableId}/export/csv`,
        dest,
        { headers: { Accept: "text/csv" } }
      );

      const { uri } = await downloadResumable.downloadAsync();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `Saved to: ${uri}`);
      }
    } catch (e) {
      console.error("CSV download error", e);
      Alert.alert("Download Error", e?.message || "Could not download CSV");
    }
  };

  const renderRow = ({ item }) => (
    <Text style={styles.rowText}>{item.join(" | ")}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lekhapal Mobile</Text>
      <Text style={styles.meta}>API: {BASE_URL}</Text>

      {!table && (
        <View style={styles.card}>
          <Button title="Pick File" onPress={pickFile} />
          <View style={{ height: 10 }} />
          <Button
            title="Upload & Parse"
            onPress={uploadFile}
            disabled={!file || loading}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Working…</Text>
        </View>
      )}

      {table && !editing && !loading && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>{table.title || "Untitled"}</Text>
          {table.columns?.length ? (
            <Text style={styles.columns}>
              Columns: {table.columns.join(", ")}
            </Text>
          ) : null}

          <FlatList
            data={table.rows || []}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={renderRow}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            style={{ maxHeight: 360 }}
          />

          <View style={{ height: 10 }} />
          <Button title="Edit Rows (JSON)" onPress={startEditing} />
          <View style={{ height: 8 }} />
          <Button title="Download CSV" onPress={downloadCSV} />
        </View>
      )}

      {editing && !loading && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Edit rows (JSON 2D array)</Text>
          <TextInput
            multiline
            style={styles.input}
            value={editText}
            onChangeText={setEditText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ height: 8 }} />
          <Button title="Save" onPress={saveEdits} />
          <View style={{ height: 8 }} />
          <Button title="Cancel" onPress={() => setEditing(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  meta: { fontSize: 12, color: "#666", marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 12, elevation: 2 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    minHeight: 200,
    borderRadius: 8,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  rowText: { fontSize: 14 },
  columns: { fontSize: 13, color: "#333", marginBottom: 8 },
  loading: { alignItems: "center", justifyContent: "center", padding: 20 },
});
