// app/table-view.tsx
import React from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import TablesViewer, { TableData } from "../components/TablesViewer";

export default function TableViewPage() {
  const { tables, prompt, id } = useLocalSearchParams();
  console.log("TableViewPage - tables:", tables);

  let parsedTables: TableData[] = [];
  try {
    parsedTables = JSON.parse(tables as string);
    console.log("TableViewPage - parsed tables:", parsedTables);
  } catch (e) {
    console.warn("Failed to parse tables:", e);
  }

  if (!parsedTables) {
    console.warn("TableViewPage - no valid tables found");
    return (
      <View style={styles.center}>
        <Text>No tables found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TablesViewer tables={parsedTables} isView={false} docType={prompt as string} id={id as string} />
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
