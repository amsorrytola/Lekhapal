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
    <View style={styles.row}>
      <Text style={styles.cell}>{index + 1}</Text>

      <TouchableOpacity
        style={styles.cell}
        onPress={() => router.push({
          pathname: "/shg",
          params: { id: item.id },
        })}
      >
        <Text style={styles.link}>{item.name}</Text>
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item.id)}>
        <Text style={styles.btnText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.btnText}>Delete</Text>
      </TouchableOpacity>

      <Text style={[styles.cell, { flex: 1 }]}>{item.employee || "-"}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push("/addSHG")}
      >
        <Text style={styles.addText}>+ Add SHG</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerCell}>S.No.</Text>
        <Text style={styles.headerCell}>SHG Name</Text>
        <Text style={styles.headerCell}>Status</Text>
        <Text style={styles.headerCell}>Edit</Text>
        <Text style={styles.headerCell}>Delete</Text>
        <Text style={styles.headerCell}>Employee</Text>
      </View>

      <FlatList
        data={shgs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8, marginBottom: 12 },
  addText: { color: "#fff", fontSize: 16, textAlign: "center", fontWeight: "600" },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
    marginBottom: 6,
  },
  headerCell: { flex: 1, fontWeight: "bold", fontSize: 14, color: "#333" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
    marginBottom: 6,
    borderRadius: 6,
    elevation: 1,
  },
  cell: { flex: 1, fontSize: 14, paddingHorizontal: 6 },
  link: { color: "#0B3D91", textDecorationLine: "underline", fontWeight: "600" },
  editBtn: {
    backgroundColor: "#2196F3",
    padding: 6,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  deleteBtn: { backgroundColor: "#f44336", padding: 6, borderRadius: 4 },
  btnText: { color: "white", fontSize: 12, fontWeight: "600" },
});
