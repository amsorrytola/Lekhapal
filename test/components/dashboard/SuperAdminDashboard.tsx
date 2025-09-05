import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { supabase } from "@/auth/supabaseClient";

export interface SHG {
  id: string;
  name: string;
  status: "Open" | "Close";
  employee?: string;
}

export const SuperAdminDashboard = ({
  shgs,
  setShgs,
}: {
  shgs: SHG[];
  setShgs: React.Dispatch<React.SetStateAction<SHG[]>>;
}) => {
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("shgs").delete().eq("id", id);
    if (error) {
      Alert.alert("Error deleting SHG", error.message);
    } else {
      setShgs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleEdit = (id: string) => {
    router.push({
      pathname: "/editSHG",
      params: { id },
    });
  };

  const renderItem = ({ item, index }: { item: SHG; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.shgTitle}>{item.name}</Text>
        <Text style={styles.shgIndex}>#{index + 1}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Status:</Text>
        <Picker
          selectedValue={item.status}
          style={{ flex: 1 }}
          onValueChange={async (value) => {
            const { error } = await supabase
              .from("shgs")
              .update({ status: value })
              .eq("id", item.id);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              setShgs((prev) =>
                prev.map((shg) =>
                  shg.id === item.id ? { ...shg, status: value as "Open" | "Close" } : shg
                )
              );
            }
          }}
        >
          <Picker.Item label="Open" value="Open" />
          <Picker.Item label="Close" value="Close" />
        </Picker>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Employee:</Text>
        <Text style={styles.value}>{item.employee || "-"}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push({ pathname: "/shg", params: { id: item.id } })}
        >
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item.id)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {/* Add SHG button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/addSHG")}>
        <Text style={styles.addText}>+ Add SHG</Text>
      </TouchableOpacity>

      {/* 👤 User Management button */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: "#0B3D91", marginBottom: 16 }]}
        onPress={() => router.push("/admin-user-management")}
      >
        <Text style={styles.addText}>👤 Manage Users</Text>
      </TouchableOpacity>

      {/* SHG List */}
      <FlatList
        data={shgs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  shgTitle: { fontSize: 16, fontWeight: "700", color: "#0B3D91" },
  shgIndex: { fontSize: 12, color: "#666" },

  cardRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginRight: 6 },
  value: { fontSize: 14, color: "#555" },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  viewBtn: {
    backgroundColor: "#0B3D91",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnText: { color: "white", fontSize: 13, fontWeight: "600" },
});
