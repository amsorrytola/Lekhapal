// app/shg/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";

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
  const router = useRouter();

  const [shg, setShg] = useState<any>(null);

  // Simulate fetching SHG details
  useEffect(() => {
    // Normally fetch from API using id
    const dummyData = {
      id,
      name: `SHG ${id}`,
      employee: "Raj",
      status: "Open",
    };
    setShg(dummyData);
  }, [id]);

  if (!shg) return <Text>Loading...</Text>;

  const handleSectionClick = (section: string) => {
    // Navigate to nested pages like /shg/[id]/profile, etc.
    router.push(`/upload/${section}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details of {shg.name}</Text>
      <Text style={styles.subText}>Added by: {shg.employee}</Text>
      <Text style={styles.subText}>Status: {shg.status}</Text>

      <Text style={styles.sectionTitle}>Sections</Text>
      <FlatList
        data={sections}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.sectionBtn} onPress={() => handleSectionClick(item)}>
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
});
