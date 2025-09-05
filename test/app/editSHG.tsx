// app/screens/EditSHGScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/auth/supabaseClient";
import { useLocalSearchParams, useRouter } from "expo-router";

interface Member {
  id?: string; // shg_members table id
  name: string;
  member_id?: string;
  date_of_joining?: string;
  date_of_leaving?: string;
}

export default function EditSHGScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const shgId = String(params.id ?? "");

  const [loading, setLoading] = useState(true);
  const [shgData, setShgData] = useState<any>(null);

  // ✅ Fetch SHG + members
  useEffect(() => {
    if (!shgId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // fetch shg details
        const { data: shg, error: shgError } = await supabase
          .from("shgs")
          .select("*")
          .eq("id", shgId)
          .single();

        if (shgError) throw shgError;

        // fetch members
        const { data: members, error: memberError } = await supabase
          .from("shg_members")
          .select("*")
          .eq("shg_id", shgId);

        if (memberError) throw memberError;

        setShgData({
          ...shg,
          members: members || [],
        });
      } catch (err: any) {
        console.error("Error fetching SHG:", err);
        Alert.alert("Error", "Failed to load SHG data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shgId]);

  const handleChange = (key: string, value: string) => {
    setShgData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const updatedMembers = [...shgData.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setShgData((prev: any) => ({ ...prev, members: updatedMembers }));
  };

  const addMember = () => {
    setShgData((prev: any) => ({
      ...prev,
      members: [...prev.members, { name: "", member_id: "", date_of_joining: "", date_of_leaving: "" }],
    }));
  };

  const removeMember = (index: number) => {
    const updatedMembers = shgData.members.filter((_: any, i: number) => i !== index);
    setShgData((prev: any) => ({ ...prev, members: updatedMembers }));
  };

  // ✅ Save updated SHG
  const handleSave = async () => {
    try {
      // update SHG
      const { error: shgError } = await supabase
        .from("shgs")
        .update({
          name: shgData.name,
          date_of_formation: shgData.date_of_formation,
          meeting_frequency: shgData.meeting_frequency,
          village_name: shgData.village_name,
          gram_panchayat_name: shgData.gram_panchayat_name,
          vo_name: shgData.vo_name,
          clf_name: shgData.clf_name,
          block_name: shgData.block_name,
          district_name: shgData.district_name,
          joining_date_vo: shgData.joining_date_vo,
          cash_balance: shgData.cash_balance,
          bank_balance: shgData.bank_balance,
          saving_bank_ac: shgData.saving_bank_ac,
          bank_branch: shgData.bank_branch,
          ifsc: shgData.ifsc,
          mobile1: shgData.mobile1,
          mobile2: shgData.mobile2,
        })
        .eq("id", shgId);

      if (shgError) throw shgError;

      // update members → simplest way: delete all & reinsert
      await supabase.from("shg_members").delete().eq("shg_id", shgId);

      if (shgData.members.length > 0) {
        const membersPayload = shgData.members.map((m: Member) => ({
          shg_id: shgId,
          name: m.name,
          member_id: m.member_id || null,
          date_of_joining: m.date_of_joining || null,
          date_of_leaving: m.date_of_leaving || null,
        }));

        const { error: memberError } = await supabase
          .from("shg_members")
          .insert(membersPayload);

        if (memberError) throw memberError;
      }

      Alert.alert("✅ Success", "SHG updated successfully!");
      router.back();
    } catch (err: any) {
      console.error("Update error:", err);
      Alert.alert("❌ Error", "Failed to update SHG: " + err.message);
    }
  };

  if (loading || !shgData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading SHG data…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Edit SHG Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Name of SHG"
        value={shgData.name || ""}
        onChangeText={(val) => handleChange("name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Formation"
        value={shgData.date_of_formation || ""}
        onChangeText={(val) => handleChange("date_of_formation", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Meeting Frequency"
        value={shgData.meeting_frequency || ""}
        onChangeText={(val) => handleChange("meeting_frequency", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Village Name"
        value={shgData.village_name || ""}
        onChangeText={(val) => handleChange("village_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Gram Panchayat Name"
        value={shgData.gram_panchayat_name || ""}
        onChangeText={(val) => handleChange("gram_panchayat_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="VO Name"
        value={shgData.vo_name || ""}
        onChangeText={(val) => handleChange("vo_name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="CLF Name"
        value={shgData.clf_name || ""}
        onChangeText={(val) => handleChange("clf_name", val)}
      />

      {/* Members */}
      <Text style={styles.subHeading}>Members</Text>
      {shgData.members.map((m: Member, idx: number) => (
        <View key={idx} style={styles.memberBox}>
          <TextInput
            style={styles.input}
            placeholder="Member Name"
            value={m.name || ""}
            onChangeText={(val) => handleMemberChange(idx, "name", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Member ID"
            value={m.member_id || ""}
            onChangeText={(val) => handleMemberChange(idx, "member_id", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Joining"
            value={m.date_of_joining || ""}
            onChangeText={(val) => handleMemberChange(idx, "date_of_joining", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Leaving"
            value={m.date_of_leaving || ""}
            onChangeText={(val) => handleMemberChange(idx, "date_of_leaving", val)}
          />

          <TouchableOpacity style={styles.removeBtn} onPress={() => removeMember(idx)}>
            <Text style={styles.removeText}>Remove Member</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addMember}>
        <Text style={styles.btnText}>+ Add Member</Text>
      </TouchableOpacity>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.btnText}>Update SHG</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  subHeading: { fontSize: 18, fontWeight: "600", marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  memberBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    marginVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  addBtn: {
    backgroundColor: "#17a2b8",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  removeBtn: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  removeText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
