// app/shg.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/auth/supabaseClient";

const sections = [
  "SHG Profile",
  "Receipts by SHG",
  "Expenditure by SHG",
  "Savings",
  "Loan Taken & Repayment by SHG",
  "Loan Taken & Repayment by Members",
  "Others",
];

export default function ShgDetailsPage() {
  const params = useLocalSearchParams();
  const idParam = String(params.id ?? "");
  const router = useRouter();

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [shgName, setShgName] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // fetch only the logged-in user
        const { data: userRes, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(userRes?.user ?? null);

        // fetch SHG details from "shgs" table
        if (idParam) {
          const { data: shg, error: shgError } = await supabase
            .from("shgs")
            .select("name")
            .eq("id", idParam)
            .single();

          if (shgError) throw shgError;
          setShgName(shg?.name ?? "");
        }
      } catch (err) {
        console.error("Error fetching SHG/user:", err);
        Alert.alert("Error", "Failed to load SHG details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [idParam]);

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  if (!idParam) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>No SHG ID provided</Text>
      </View>
    );
  }

  const isSuperAdmin = !!user && user?.email === "dk7004570779@gmail.com";

  const handleSectionClick = (section: string) => {
    console.log("Clicked:", { section, id: idParam, isSuperAdmin });
    if (isSuperAdmin) {
      router.push({
        pathname: "/shg-section",
        params: { id: idParam, section }
      });
    } else {
      router.push({
        pathname: "/upload",
        params: { id: idParam, section }
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {shgName ? shgName : `SHG ID: ${idParam}`}
      </Text>

      {isSuperAdmin ? (
        <>
          <Text style={styles.sectionTitle}>📂 All Sections (Superadmin)</Text>
          <FlatList
            data={sections}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sectionBtn}
                onPress={() => handleSectionClick(item)}
              >
                <Text style={styles.sectionText}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>📂 Available Sections</Text>
          <FlatList
            data={sections}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sectionBtn}
                onPress={() => handleSectionClick(item)}
              >
                <Text style={styles.sectionText}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#111827" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  sectionBtn: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  sectionText: { fontSize: 16, color: "#111827" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
