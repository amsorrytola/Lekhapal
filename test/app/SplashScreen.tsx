import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../auth/supabaseClient";
import { router } from "expo-router";
import LottieView from "lottie-react-native";

export default function SplashScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const storedSession = await AsyncStorage.getItem("supabase_session");

        setTimeout(() => {
          if (session || storedSession) {
            router.replace("/(tabs)");
          } else {
            router.replace("/auth");
          }
        }, 2500); // Matches animation length
      } catch (err) {
        console.error("Error checking session:", err);
        router.replace("/auth");
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      {/* Lottie Animation */}
      <LottieView
        source={require("../assets/write-letter.json")} // 👈 place JSON here
        autoPlay
        loop={false}
        style={styles.animation}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  animation: {
    width: 180,
    height: 180,
  },
});
