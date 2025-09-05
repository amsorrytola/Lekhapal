// app/shg-section.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/auth/supabaseClient";

export default function ShgSectionPage() {
  const params = useLocalSearchParams();
  const idParam = String(params.id ?? "");
  const sectionParam = String(params.section ?? "");
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!idParam || !sectionParam) {
      console.warn("shg-section missing params", { idParam, sectionParam });
      setLoading(false);
      return;
    }

    const fetchDocs = async () => {
      setLoading(true);
      console.log("fetchDocs for SHG:", idParam, "section:", sectionParam);
      try {
        const res = await supabase
          .from("shg_documents")
          .select("id, contents, created_at")
          .eq("shg_id", idParam)
          .eq("doc_type", sectionParam)
          .order("created_at", { ascending: false });

        console.log("supabase res:", res);

        if (res.error) {
          console.error("Error fetching documents:", res.error);
          Alert.alert("Error", res.error.message || "Failed to fetch documents");
          setDocuments([]);
        } else {
          setDocuments(res.data ?? []);
        }
      } catch (err) {
        console.error("fetchDocs error:", err);
        Alert.alert("Error", "Failed to load documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [idParam, sectionParam]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading {sectionParam} documents…</Text>
      </View>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16 }}>No documents found for</Text>
        <Text style={{ fontWeight: "600", marginTop: 6 }}>{sectionParam}</Text>
        <TouchableOpacity
          style={{ marginTop: 18, backgroundColor: "#0B3D91", padding: 12, borderRadius: 8 }}
          onPress={() => router.push(`/upload?id=${encodeURIComponent(idParam)}&section=${encodeURIComponent(sectionParam)}`)}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Upload New Document</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sectionParam}</Text>

      <FlatList
        data={documents}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        renderItem={({ item, index }) => {
          const dateStr = item?.created_at ? new Date(item.created_at).toLocaleString() : "Unknown date";
          return (
            <TouchableOpacity
              style={styles.docCard}
              onPress={() => {
                // pass document contents as query param (JSON string)
                const jsonStr = JSON.stringify(item.contents ?? {});
                const encoded = encodeURIComponent(jsonStr);
                router.push(`/table-view?data=${encoded}`);
              }}
            >
              <Text style={styles.docTitle}>Document {index + 1}</Text>
              <Text style={styles.docMeta}>{dateStr}</Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  docCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eefc",
  },
  docTitle: { fontSize: 16, fontWeight: "600", color: "#0b3d91" },
  docMeta: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
