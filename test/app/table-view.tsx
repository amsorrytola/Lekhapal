// app/table-view.tsx
import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import TablesViewer, { TableData } from "../components/TablesViewer";

export default function TableViewPage() {
  const { data, id, section, view, tableid } = useLocalSearchParams();
  console.log("TableViewPage - params:", { data, id, section, view, tableid });

  let parsedTables: TableData[] = [];
  try {
    parsedTables = JSON.parse(data as string);
    console.log("TableViewPage - parsed tables:", parsedTables);
  } catch (e) {
    console.warn("Failed to parse tables:", e);
  }

  if (!parsedTables || parsedTables.length === 0) {
    console.warn("TableViewPage - no valid tables found");
    return (
      <View style={styles.center}>
        <Text>No tables found</Text>
      </View>
    );
  }

  const isViewMode = String(view) === "true";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TablesViewer
        tables={parsedTables}
        isView={isViewMode}        // 👈 now dynamically controlled
        docType={section as string} // 👈 section passed instead of prompt
        id={id as string}           // SHG id
        tableId={tableid as string} // 👈 pass tableid for editing
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fafafa",
    minHeight: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
