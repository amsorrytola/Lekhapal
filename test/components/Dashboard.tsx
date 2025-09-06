import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/auth/supabaseClient";
import { NormalDashboard } from "./dashboard/NormalDashboard";
import { SuperAdminDashboard } from "./dashboard/SuperAdminDashboard";

export interface SHG {
  id: string;
  name: string;
  status: "Open" | "Close";
  employee?: string;
  employee_email?: string;
}

export default function DashboardScreen() {
  const [shgs, setShgs] = useState<SHG[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ✅ Get current user and all SHGs
  useEffect(() => {
    const fetchUserAndShgs = async () => {
      try {
        // 1️⃣ Get logged-in user (optional)
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) throw error || new Error("No user found");

        // 2️⃣ Decide role (if you still want UI separation)
        // Here you can still mark some as super admin if needed,
        // or just leave everyone as normal.
        // For now, default is false.
        setIsSuperAdmin(false);

        // 3️⃣ Fetch ALL SHGs (for everyone)
        const { data, error: shgError } = await supabase
          .from("shgs")
          .select("id, name, status, employee, employee_email");
        if (shgError) throw shgError;

        setShgs(data || []);
      } catch (err: any) {
        console.error("Error fetching SHGs:", err.message);
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndShgs();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0B3D91" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isSuperAdmin ? (
        <SuperAdminDashboard shgs={shgs} setShgs={setShgs} />
      ) : (
        <NormalDashboard shgs={shgs} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
