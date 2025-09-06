// screens/DownloadScreen.tsx
import React, { useState } from "react";
import { View, Button, Alert, Dimensions } from "react-native";
import { generateSHGPdfTest } from "../backend/pdfGenerator";
import * as Sharing from "expo-sharing";
import { WebView } from "react-native-webview";

export default function DownloadScreen() {
  const [filePath, setFilePath] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      const path = await generateSHGPdfTest();
      setFilePath(path);
      Alert.alert("PDF Generated!", "Preview is available below.");
    } catch (e) {
      Alert.alert("Error", (e as Error).message || "Failed to generate PDF");
    }
  };

  const handleDownload = async () => {
    if (!filePath) {
      Alert.alert("No PDF", "Please generate a PDF first");
      return;
    }
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Sharing not available on this device");
      return;
    }
    await Sharing.shareAsync(filePath);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button title="Generate PDF" onPress={handleGenerate} />

      {filePath && (
        <View style={{ flex: 1, marginTop: 20 }}>
          <WebView
            originWhitelist={["*"]}
            source={{ uri: filePath }}
            style={{
              flex: 1,
              width: Dimensions.get("window").width,
              height: Dimensions.get("window").height - 200,
            }}
          />
          <View style={{ marginVertical: 20 }}>
            <Button title="Download/Share PDF" onPress={handleDownload} />
          </View>
        </View>
      )}
    </View>
  );
}
