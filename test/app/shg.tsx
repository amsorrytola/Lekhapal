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

  const [shg, setShg] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!idParam) {
      console.warn("No SHG id provided in params");
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      console.log("Init SHG page, id=", idParam);
      try {
        // fetch user and shg in parallel
        const [userRes, shgRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from("shgs").select("id, name, employee, status").eq("id", idParam).maybeSingle(),
        ]);

        const fetchedUser = userRes?.data?.user ?? null;
        const fetchedShg = shgRes?.data ?? null;
        console.log("Fetched user:", fetchedUser);
        console.log("Fetched shg:", fetchedShg, "shgRes.error=", shgRes?.error);

        setUser(fetchedUser);
        setShg(fetchedShg);

        if (shgRes?.error) {
          // if not found that's ok — we'll show friendly message below
          console.error("Error fetching SHG:", shgRes.error);
        }
      } catch (err) {
        console.error("Init error:", err);
        Alert.alert("Error", "Failed to load SHG or user details.");
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
        <Text style={{ marginTop: 8 }}>Loading SHG details…</Text>
      </View>
    );
  }

  // Not found / error states
  if (!shg) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>SHG not found</Text>
        <Text style={{ color: "#666" }}>ID: {idParam || "(none)"}</Text>
      </View>
    );
  }

  const isSuperAdmin = !!user && user?.email === "talhaansariitr@gmail.com";

  const handleSectionClick = (section: string) => {
    console.log("handleSectionClick:", { section, id: idParam, isSuperAdmin });
    if (isSuperAdmin) {
      // navigate to admin viewer for this section
      router.push(`/shg-section?id=${encodeURIComponent(idParam)}&section=${encodeURIComponent(section)}`);
    } else {
      // normal user -> go to upload page
      router.push(`/upload?id=${encodeURIComponent(idParam)}&section=${encodeURIComponent(section)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{shg.name}</Text>
      <Text style={styles.subText}>Employee: {shg.employee ?? "N/A"}</Text>
      <Text style={styles.subText}>Status: {shg.status ?? "N/A"}</Text>

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
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => handleSectionClick("SHG Profile")}
        >
          <Text style={styles.uploadText}>🚀 Start Uploading</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6, color: "#111827" },
  subText: { fontSize: 14, color: "#374151", marginBottom: 4 },
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
  uploadBtn: {
    marginTop: 32,
    backgroundColor: "#0B3D91",
    padding: 14,
    borderRadius: 10,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
