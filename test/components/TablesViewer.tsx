import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { supabase } from "../auth/supabaseClient";

// Generic Table Format
export interface TableData {
  title: string;
  columns: string[];
  rows: string[][];
}

const CELL_WIDTH = 140;
const SCROLL_STEP = CELL_WIDTH * 3;
const WINDOW_WIDTH = Dimensions.get("window").width;

export default function TablesViewer({
  tables,
  isView,
  id,
  docType,
}: {
  tables: any; // raw JSON can be object or array
  isView?: boolean;
  id?: string; // SHG id
  docType?: string; // document type
}) {
  // 🔹 Normalize incoming data to TableData[]
  const normalize = (raw: any): TableData[] => {
    if (Array.isArray(raw)) return raw;

    if (typeof raw === "object" && raw !== null) {
      const arr: TableData[] = [];

      if (raw.shgProfile) {
        arr.push({
          title: "SHG PROFILE",
          columns: ["Field", "Value"],
          rows: Object.entries(raw.shgProfile).map(([k, v]) => [k, String(v)]),
        });
      }

      if (raw.members) {
        arr.push({
          title: "DETAILS OF MEMBERS",
          columns: [
            "S.NO.",
            "NAME",
            "ID (IF ANY)",
            "DATE OF JOINING",
            "DATE OF LEAVING",
          ],
          rows: raw.members.map((m: any) => [
            String(m.sNo ?? ""),
            String(m.name ?? ""),
            String(m.id ?? ""),
            String(m.dateOfJoining ?? ""),
            String(m.dateOfLeaving ?? ""),
          ]),
        });
      }

      if (raw.balanceDetails) {
        arr.push({
          title: "BALANCE SHEET",
          columns: ["Field", "Value"],
          rows: Object.entries(raw.balanceDetails).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(", ") : String(v ?? ""),
          ]),
        });
      }

      return arr;
    }
    return [];
  };

  const [data, setData] = useState<TableData[]>(normalize(tables));

  // refs to horizontal scrollviews per table and scroll positions
  const hScrollRefs = useRef<any[]>([]);
  const scrollPositions = useRef<number[]>([]);

  // Ensure refs/positions arrays match data length when data changes
  useEffect(() => {
    hScrollRefs.current = data.map((_, i) => hScrollRefs.current[i] ?? null);
    scrollPositions.current = data.map((_, i) => scrollPositions.current[i] ?? 0);
  }, [data]);

  // ---------------------------
  // ✅ Save (upsert)
  // ---------------------------
  const handleSave = async () => {
    try {
      if (!id || !docType) {
        Alert.alert("Error", "Missing SHG ID or document type.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to save.");
        return;
      }

      // 🔹 Check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from("shg_documents")
        .select("id")
        .eq("shg_id", id)
        .eq("doc_type", docType)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let error;
      if (existing) {
        // 🔹 Update
        ({ error } = await supabase
          .from("shg_documents")
          .update({ contents: data })
          .eq("id", existing.id));
      } else {
        // 🔹 Insert
        ({ error } = await supabase.from("shg_documents").insert([
          {
            shg_id: id,
            doc_type: docType,
            contents: data,
          },
        ]));
      }

      if (error) throw error;
      Alert.alert("Success", "Saved successfully!");
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Something went wrong");
    }
  };

  // Scroll helper: scroll left/right for table index `ti`
  const scrollBy = (ti: number, direction: "left" | "right") => {
    const ref = hScrollRefs.current[ti];
    if (!ref || typeof ref.scrollTo !== "function") return;

    const current = scrollPositions.current[ti] ?? 0;
    const containerWidth = Math.max(0, (data[ti]?.columns?.length ?? 0) * CELL_WIDTH);
    // allow some padding from window width to compute max offset
    const maxOffset = Math.max(0, containerWidth - WINDOW_WIDTH + 40);

    const next =
      direction === "left"
        ? Math.max(0, current - SCROLL_STEP)
        : Math.min(maxOffset, current + SCROLL_STEP);

    try {
      ref.scrollTo({ x: next, animated: true });
      scrollPositions.current[ti] = next;
    } catch {
      // silent
    }
  };

  // ---------------------------
  // ✅ Table Renderer
  // ---------------------------
  if (Array.isArray(data)) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {data.map((table, ti) => (
          <View key={`t${ti}`} style={styles.card}>
            <Text style={styles.subtitle}>{table.title}</Text>

            {/* Inner horizontal scroll */}
            <ScrollView
              horizontal
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                scrollPositions.current[ti] = e.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
              // keep ref to programmatically scroll
              ref={(r) => {
                hScrollRefs.current[ti] = r;
              }}
              contentContainerStyle={{
                flexDirection: "column",
                minWidth: table.columns.length * CELL_WIDTH,
              }}
            >
              <View>
                {/* Header Row (editable columns) */}
                <View style={[styles.row, styles.headerRow]}>
                  {table.columns.map((c: string, ci: number) => (
                    <View key={`h${ci}`} style={styles.cellContainer}>
                      {isView ? (
                        <Text style={[styles.cellText, styles.header]}>{c}</Text>
                      ) : (
                        <TextInput
                          style={[styles.cellText, styles.header]}
                          value={c}
                          onChangeText={(txt) => {
                            const updated = [...data];
                            updated[ti].columns[ci] = txt;
                            setData(updated);
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>

                {/* Data Rows */}
                {table.rows.map((row: string[], ri: number) => (
                  <View key={`r${ri}`} style={styles.row}>
                    {row.map((cell, ci) => (
                      <View key={`r${ri}c${ci}`} style={styles.cellContainer}>
                        <TextInput
                          style={styles.cellText}
                          value={String(cell ?? "")}
                          editable={!isView}
                          onChangeText={(txt) => {
                            const updated = [...data];
                            updated[ti].rows[ri][ci] = txt;
                            setData(updated);
                          }}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Scroll buttons (small) */}
            <View style={styles.scrollButtons}>
              <TouchableOpacity
                style={styles.scrollBtn}
                onPress={() => scrollBy(ti, "left")}
              >
                <Text style={styles.scrollBtnText}>◀</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scrollBtn}
                onPress={() => scrollBy(ti, "right")}
              >
                <Text style={styles.scrollBtnText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {!isView && (
          <View style={{ marginTop: 12, marginHorizontal: 10 }}>
            <Button title="Save" onPress={handleSave} color="#4CAF50" />
          </View>
        )}
      </ScrollView>
    );
  }

  return <Text>Unsupported document type</Text>;
}

const styles = StyleSheet.create({
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
  cellContainer: {
    width: CELL_WIDTH,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  cellText: {
    padding: 6,
    fontSize: 14,
    textAlign: "center",
    width: "100%",
  },
  header: {
    fontWeight: "700",
    backgroundColor: "#d0e6ff",
  },
  scrollButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  scrollBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scrollBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});