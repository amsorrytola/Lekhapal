// app/admin/user-management.tsx
import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/auth/supabaseClient";

type Role = "super_admin" | "employee" | "user";

type UserRow = {
  id: string;
  email: string | null;
  role: Role;
  created_at: string | null;
};

export default function UserManagementScreen() {
  const [meIsSuperAdmin, setMeIsSuperAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Check current user
      const { data: ures, error: uerr } = await supabase.auth.getUser();
      if (uerr || !ures?.user) throw uerr || new Error("No user");

      // Fetch list (will throw if not super admin)
      const { data, error } = await supabase.rpc("list_users_with_roles");
      console.log("Fetched users:", data, error);
      if (error) {
        if (error.message?.toLowerCase().includes("not allowed")) {
          setMeIsSuperAdmin(false);
          setUsers([]);
          return;
        }
        throw error;
      }

      setMeIsSuperAdmin(true);
      setUsers(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (id: string, newRole: Role) => {
    try {
      const { error } = await supabase.rpc("set_user_role", { user_id: id, new_role: newRole });
      if (error) throw error;

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      Alert.alert("Success", `Role updated to ${newRole}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update role");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading users…</Text>
      </View>
    );
  }

  if (meIsSuperAdmin === false) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Access denied</Text>
        <Text style={{ marginTop: 6, color: "#6b7280" }}>Only super admin can manage users.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 User Management</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.email}>{item.email ?? "(no email)"}</Text>
              <Text style={styles.meta}>Joined: {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</Text>
            </View>

            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>

            {/* Don’t let anyone (even SA) demote themselves from UI unintentionally */}
            <View style={styles.actions}>
              {item.role !== "super_admin" && (
                <>
                  <TouchableOpacity style={styles.btn} onPress={() => updateRole(item.id, "employee")}>
                    <Text style={styles.btnText}>Make Employee</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: "#6b7280" }]} onPress={() => updateRole(item.id, "user")}>
                    <Text style={styles.btnText}>Make User</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  email: { fontSize: 15, fontWeight: "600", color: "#111827" },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rolePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#e6eefc",
    marginHorizontal: 8,
  },
  roleText: { fontSize: 12, fontWeight: "700", color: "#0b3d91" },
  actions: { flexDirection: "row" },
  btn: { backgroundColor: "#2563eb", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginLeft: 8 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
