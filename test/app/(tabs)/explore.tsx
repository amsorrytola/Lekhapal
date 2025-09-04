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
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
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

export default function App({ prompt , id }: { prompt?: string , id?: string}) {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  console.log("Prompt:", prompt);
  console.log("SHG ID:", id);

  // Pick from device
  const pickFromDevice = async () => {
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

  // Capture from camera
  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return Alert.alert("Permission required", "Camera access is needed.");
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (res.canceled) return;

      const asset = res.assets[0];
      setFile({
        uri: asset.uri,
        name: `camera-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      });
    } catch (e: any) {
      Alert.alert("Camera error", e?.message || String(e));
    }
  };

  // Parse file with backend
  const parseFile = async () => {
    if (!file?.uri) return Alert.alert("Pick a file first");
    setLoading(true);
    setStatus("Parsing file…");
    try {
      const data = await getJsonData(file,prompt);
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
          <Button title="📂 Select from Device" onPress={pickFromDevice} />
          <View style={{ height: 10 }} />
          <Button title="📸 Capture from Camera" onPress={pickFromCamera} />
          <View style={{ height: 10 }} />
          <Button
            title="Parse File"
            onPress={parseFile}
            disabled={!file || loading}
          />
        </View>
      )}

      {/* Preview uploaded file */}
      {file && (
        <View style={styles.previewBox}>
          <Text style={{ fontWeight: "600" }}>📄 Preview:</Text>
          {file.mimeType?.startsWith("image/") ? (
            <Image
              source={{ uri: file.uri }}
              style={{ width: "100%", height: 200, marginTop: 8, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ marginTop: 8 }}>File: {file.name}</Text>
          )}
        </View>
      )}

      {loading && (
        <View style={{ padding: 12 }}>
          <ActivityIndicator size="large" />
          <Text>{status || "Working…"}</Text>
        </View>
      )}

      {tables.length > 0 && !loading && (
        <TablesViewer tables={tables} isView={false} docType={prompt} id={id} />
      )}

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
  previewBox: {
    marginVertical: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});
