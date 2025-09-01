import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Button, StyleSheet } from "react-native";

export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

// ✅ Normalize: pad rows so all are same length as columns
function normalizeTable(table: TableData) {
  if (!table) return table;
  const colCount = table.columns?.length || 0;
  const rows = (table.rows || []).map((r) => {
    const row = Array.isArray(r) ? [...r] : [];
    while (row.length < colCount) row.push(""); // pad missing
    if (row.length > colCount) row.length = colCount; // trim extras
    return row;
  });
  return { ...table, rows };
}

export default function TablesViewer({ tables }: { tables: TableData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!tables || tables.length === 0) {
    return <Text>No tables to display</Text>;
  }

  const safeTables = tables.map(normalizeTable);
  const activeTable = safeTables[activeIndex];

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
        safeTables[activeIndex] = updated;
      }}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs for switching tables */}
      <ScrollView horizontal style={styles.tabBar} showsHorizontalScrollIndicator={false}>
        {safeTables.map((t, idx) => (
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
