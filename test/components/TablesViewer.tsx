import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../auth/supabaseClient"; // 👈 your Supabase client

export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

function normalizeTable(table: TableData) {
  if (!table) return table;
  const colCount = table.columns?.length || 0;
  const rows = (table.rows || []).map((r) => {
    const row = Array.isArray(r) ? [...r] : [];
    while (row.length < colCount) row.push("");
    if (row.length > colCount) row.length = colCount;
    return row;
  });
  return { ...table, rows };
}

export default function TablesViewer({ tables , isView }: { tables: TableData[] , isView?: boolean}) {
  const [tableList, setTableList] = useState(tables.map(normalizeTable));
  const [activeIndex, setActiveIndex] = useState(0);

  if (!tableList || tableList.length === 0) {
    return <Text>No tables to display</Text>;
  }

  const activeTable = tableList[activeIndex];

  const renderCell = (ri: number, ci: number, value: string) => (
    <TextInput
      key={`r${ri}c${ci}`}
      style={styles.cell}
      value={String(value ?? "")}
      onChangeText={(txt) => {
        const updatedRows = [...activeTable.rows];
        updatedRows[ri] = [...updatedRows[ri]];
        updatedRows[ri][ci] = txt;

        const updated = { ...activeTable, rows: updatedRows };
        const updatedList = [...tableList];
        updatedList[activeIndex] = updated;
        setTableList(updatedList);
      }}
    />
  );

  // ✅ Save function
  const handleSave = async () => {
    try {
      // Get the logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to save a table.");
        return;
      }

      const { error } = await supabase.from("scans").insert([
        {
          user_id: user.id,
          title: activeTable.title || `Table ${activeIndex + 1}`,
          tables_data: activeTable, // 👈 store as JSONB
        },
      ]);

      if (error) throw error;

      // Remove the saved table from the list
      const updatedList = tableList.filter((_, idx) => idx !== activeIndex);

      setTableList(updatedList);
      setActiveIndex(0);

      Alert.alert("Success", "Table saved successfully!");
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Something went wrong");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs for switching tables */}
      <ScrollView
        horizontal
        style={styles.tabBar}
        showsHorizontalScrollIndicator={false}
      >
        {tableList.map((t, idx) => (
          <Button
            key={idx}
            title={t.title || `Table ${idx + 1}`}
            onPress={() => setActiveIndex(idx)}
            color={idx === activeIndex ? "#1976D2" : "#666"}
          />
        ))}
      </ScrollView>

      {/* Table Display */}
      <View style={styles.card}>
        <Text style={styles.subtitle}>{activeTable.title}</Text>
        <ScrollView horizontal>
          <View>
            {/* Header Row */}
            <View style={[styles.row, styles.headerRow]}>
              {activeTable.columns.map((c, i) => (
                <Text key={`h${i}`} style={[styles.cell, styles.header]}>
                  {c}
                </Text>
              ))}
            </View>

            {/* Data Rows */}
            {activeTable.rows.map((row, ri) => (
              <View key={`r${ri}`} style={styles.row}>
                {row.map((cell, ci) => renderCell(ri, ci, cell))}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ✅ Save Button */}
        {!isView && <View style={{ marginTop: 12 }}>
          <Button title="Save Table" onPress={handleSave} color="#4CAF50" />
        </View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: "#e9f3ff",
  },
  cell: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    minWidth: 100,
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    fontWeight: "700",
    backgroundColor: "#d0e6ff",
  },
});
