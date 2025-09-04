// app/shg/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/auth/supabaseClient"; // make sure your Supabase client is exported here

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
  const { id } = useLocalSearchParams();
  console.log("SHG Details Page - ID:", id);
  const router = useRouter();

  const [shg, setShg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch SHG details from Supabase
  const fetchShg = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shgs")
      .select("id, name, employee, status")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching SHG:", error);
      Alert.alert("Error", error.message);
    } else {
      setShg(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchShg();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading SHG details...</Text>
      </View>
    );
  }

  if (!shg) {
    return (
      <View style={styles.center}>
        <Text>No SHG found for this ID.</Text>
      </View>
    );
  }

  const handleSectionClick = (section: string) => {
    // Navigate to nested pages like /shg/[id]/profile, etc.
    router.push({
      pathname: '/upload',
      params: { id: id, section }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details of {shg.name}</Text>
      <Text style={styles.subText}>Added by: {shg.employee || "N/A"}</Text>
      <Text style={styles.subText}>Status: {shg.status}</Text>

      <Text style={styles.sectionTitle}>Sections</Text>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subText: { fontSize: 14, color: "#555", marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 15, marginBottom: 8 },
  sectionBtn: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionText: { fontSize: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
