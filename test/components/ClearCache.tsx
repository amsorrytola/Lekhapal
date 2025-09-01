import React from "react";
import { View, Button, Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ClearCacheProps {
  resetStates?: Record<string, (val: any) => void>; 
  afterClear?: () => void;
}

export default function ClearCache({ resetStates = {}, afterClear }: ClearCacheProps) {
  const clearAppCache = async () => {
    try {
      console.log("🧹 Clearing app cache...");

      // 1. Reset React state via passed-in setters
      Object.entries(resetStates).forEach(([key, setter]) => {
        if (typeof setter === "function") {
          console.log(`   ↩️ Resetting state: ${key}`);
          setter(null);
        }
      });

      // 2. Clear AsyncStorage
      await AsyncStorage.clear();
      console.log("   ✅ AsyncStorage cleared");

      // 3. Clear FileSystem caches (cache + document dir)
      const dirs = [FileSystem.cacheDirectory, FileSystem.documentDirectory];
      for (const dir of dirs) {
        if (!dir) continue;
        try {
          const files = await FileSystem.readDirectoryAsync(dir);
          for (const file of files) {
            await FileSystem.deleteAsync(dir + file, { idempotent: true });
          }
          console.log("   ✅ Cleared directory:", dir);
        } catch (err: any) {
          console.warn("   ⚠️ Could not clear dir", dir, err.message);
        }
      }

      // 4. Clear browser storage if running on web
      if (Platform.OS === "web") {
        localStorage.clear();
        sessionStorage.clear();
        console.log("   ✅ localStorage/sessionStorage cleared (web)");
      }

      Alert.alert("Cache Cleared", "App data has been reset.");
      if (afterClear) afterClear();
    } catch (err: any) {
      console.error("❌ Error clearing cache:", err);
      Alert.alert("Error", err?.message || "Failed to clear cache");
    }
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <Button title="🗑 Clear Cache" color="#d9534f" onPress={clearAppCache} />
    </View>
  );
}
