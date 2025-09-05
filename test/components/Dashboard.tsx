import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/auth/supabaseClient";
import { NormalDashboard } from "./dashboard/NormalDashboard";
import { SuperAdminDashboard } from "./dashboard/SuperAdminDashboard";

export interface SHG {
  id: string;
  name: string;
  status: "Open" | "Close";
  employee?: string;
}

const SUPERADMIN_EMAIL = "talhaansariitr@gmail.com";

export default function DashboardScreen() {
  const [shgs, setShgs] = useState<SHG[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ✅ Get current user and SHGs
  useEffect(() => {
    const fetchUserAndShgs = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw error || new Error("No user found");

        setUserEmail(user.email);

        // Fetch SHGs for this user
        const { data, error: shgError } = await supabase
          .from("shgs")
          .select("id, name, status, employee");

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

  // ✅ Check if user is superadmin
  const isSuperAdmin = userEmail === SUPERADMIN_EMAIL;

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
