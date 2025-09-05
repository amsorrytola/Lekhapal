// app/index.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";  // ✅ use View, not SafeAreaView
import SplashScreen from "@/components/SplashScreen";
import DashboardScreen from "@/components/dashboard/Dashboard";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setShowSplash(false);
    }, 8000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}> 
      {showSplash ? (
        <SplashScreen
          onFinish={() => {
            console.log("[Home] Splash finished -> show dashboard");
            setShowSplash(false);
          }}
        />
      ) : (
        <DashboardScreen />
      )}
    </View>
  );
}
