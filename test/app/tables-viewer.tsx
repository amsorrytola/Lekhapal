// app/tables-viewer.tsx
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import TablesViewer, { TableData } from "../components/TablesViewer";

export default function TablesViewerPage() {
  const { data } = useLocalSearchParams<{ data: string }>();

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No table data provided ❌</Text>
      </View>
    );
  }

  let parsed: TableData[] = [];
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    return (
      <View style={styles.center}>
        <Text>Invalid data format</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TablesViewer tables={parsed} isView={false} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
