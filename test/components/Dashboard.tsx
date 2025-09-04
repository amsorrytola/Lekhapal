// DashboardScreen.tsx
import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

interface SHG {
  id: number;
  name: string;
  status: "Open" | "Close";
  employee?: string; // for super admin
}

const DashboardScreen = () => {
  const [shgs, setShgs] = useState<SHG[]>([
    { id: 1, name: "Maa Laxmi SHG", status: "Open", employee: "Raj" },
    { id: 2, name: "Savitri SHG", status: "Close", employee: "Anita" },
    { id: 3, name: "Durga SHG", status: "Open", employee: "Sunita" },
  ]);

  const handleDelete = (id: number) => {
    setShgs(shgs.filter((item) => item.id !== id));
  };

  const handleEdit = (id: number) => {
    Alert.alert("Edit", `You clicked edit for SHG ID ${id}`);
  };

  const handleClick = (id : number) => {
    Alert.alert("SHG Clicked", `Opening details for ${id}`);
    router.push(`/SHG/${id}`);
  };

  const renderItem = ({ item, index }: { item: SHG; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{index + 1}</Text>

      <TouchableOpacity style={styles.cell} onPress={() => handleClick(item.name)}>
        <Text style={styles.link}>{item.name}</Text>
      </TouchableOpacity>

      <View style={[styles.cell, { flex: 1 }]}>
        <Picker
          selectedValue={item.status}
          style={{ height: 40 }}
          onValueChange={(value) => {
            setShgs((prev) =>
              prev.map((shg) =>
                shg.id === item.id ? { ...shg, status: value as "Open" | "Close" } : shg
              )
            );
          }}
        >
          <Picker.Item label="Open" value="Open" />
          <Picker.Item label="Close" value="Close" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item.id)}>
        <Text style={styles.btnText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.btnText}>Delete</Text>
      </TouchableOpacity>

      {/* Super Admin extra column */}
      <Text style={[styles.cell, { flex: 1 }]}>{item.employee || "-"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("addSHG")}>
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  addBtn: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 6, marginBottom: 10 },
  addText: { color: "#fff", fontSize: 16, textAlign: "center" },
  header: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 5, marginBottom: 5 },
  headerCell: { flex: 1, fontWeight: "bold", fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  cell: { flex: 1, fontSize: 14 },
  link: { color: "blue", textDecorationLine: "underline" },
  editBtn: { backgroundColor: "#2196F3", padding: 5, borderRadius: 4, marginHorizontal: 3 },
  deleteBtn: { backgroundColor: "#f44336", padding: 5, borderRadius: 4 },
  btnText: { color: "#fff", fontSize: 12 },
});

export default DashboardScreen;
