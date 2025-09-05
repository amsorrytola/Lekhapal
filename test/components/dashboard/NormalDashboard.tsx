import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export interface SHG {
  id: string;
  name: string;
  status: "Open" | "Close";
  employee?: string;
}

export const NormalDashboard = ({ shgs }: { shgs: SHG[] }) => {
  // Assume user belongs to 1 SHG (can extend if multiple later)
  const userShg = shgs[0];

  if (!userShg) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No SHG assigned to your account.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{userShg.name}</Text>
      <Text style={styles.status}>
        Status:{" "}
        <Text style={{ color: userShg.status === "Open" ? "green" : "red" }}>
          {userShg.status}
        </Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({
          pathname: "/shg",
          params: { id: userShg.id },
        })}
      >
        <Text style={styles.buttonText}>Start Uploading</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    alignItems: "center",
    marginTop: 50,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#0B3D91", marginBottom: 12 },
  status: { fontSize: 16, marginBottom: 20 },
  button: {
    backgroundColor: "#0B3D91",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
});
