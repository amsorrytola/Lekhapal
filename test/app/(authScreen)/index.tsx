// app/(authScreen)/index.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import AuthScreen from "../../components/auth/AuthScreen";
import SplashScreen from "../../components/SplashScreen";

export default function AuthWrapper() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <View style={styles.container}>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                // 🔑 ensures full height
    backgroundColor: "#000", // optional, avoids white edges during splash
  },
});
