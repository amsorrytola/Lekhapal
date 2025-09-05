import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/auth/supabaseClient";
import { NormalDashboard } from "./NormalDashboard";
import { SuperAdminDashboard } from "./SuperAdminDashboard";

export interface SHG {
  id: string;
  name: string;
  status: "Open" | "Close";
  employee?: string;
  employee_email?: string;
}

const SUPERADMIN_EMAIL = "dk7004570779@gmail.com";

export default function DashboardScreen() {
  const [shgs, setShgs] = useState<SHG[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ✅ Get current user and SHGs
  useEffect(() => {
    const fetchUserAndShgs = async () => {
      try {
        // 1️⃣ Get logged-in user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) throw error || new Error("No user found");

        const email = user.email;
        setUserEmail(email);

        // 2️⃣ Check if SuperAdmin
        const superAdmin = email === SUPERADMIN_EMAIL;
        setIsSuperAdmin(superAdmin);

        let shgData: SHG[] = [];

        if (superAdmin) {
          // SuperAdmin → fetch all SHGs
          const { data, error: shgError } = await supabase
            .from("shgs")
            .select("id, name, status, employee, employee_email");
          if (shgError) throw shgError;
          shgData = data || [];
        } else {
          // Normal user → fetch only assigned SHGs
          const { data, error: shgError } = await supabase
            .from("shgs")
            .select("id, name, status, employee, employee_email")
            .eq("employee_email", email);
          if (shgError) throw shgError;
          shgData = data || [];
        }

        setShgs(shgData);
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
