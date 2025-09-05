import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect, useState } from "react";
import { supabase } from "../auth/supabaseClient";

import { useColorScheme } from "@/hooks/useColorScheme";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get current session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    // Listen for login/logout/token refresh
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Still loading fonts or session → show splash
  if (!loaded || initializing) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {session ? (
          // ✅ User logged in → show tabs
          <Stack.Screen name="index" options={{ headerShown: false }} />
        ) : (
          // ❌ No session → show auth flow
          <Stack.Screen
            name="(authScreen)/index"
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
