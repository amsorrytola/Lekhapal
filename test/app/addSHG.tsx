// app/screens/AddSHGScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface Member {
  name: string;
  id?: string;
  dateOfJoining?: string;
  dateOfLeaving?: string;
}

export default function AddSHGScreen() {
  const [shgData, setShgData] = useState({
    name: "",
    dateOfFormation: "",
    meetingFrequency: "",
    village: "",
    gramPanchayat: "",
    voName: "",
    clfName: "",
    blockName: "",
    districtName: "",
    joiningDateVO: "",
    members: [] as Member[],
    cashBalance: "",
    bankBalance: "",
    savingAccount: "",
    bankBranch: "",
    ifsc: "",
    mobile1: "",
    mobile2: "",
  });

  const mockOCRResult = {
    name: "बरकत स्वस सहायता समूह",
    dateOfFormation: "16/10/18",
    meetingFrequency: "मासिक",
    village: "मगरा",
    gramPanchayat: "मगरा",
    voName: "आदर्श ग्राम संगठन",
    clfName: "उज्जवल महिला संगठन",
    blockName: "उज्जैन",
    districtName: "उज्जैन",
    joiningDateVO: "17/12/2023",
    members: [
      { name: "धमदा सुभाष पटेल", dateOfJoining: "16/10/18" },
      { name: "मधु बाई पटेल", dateOfJoining: "16/10/18" },
    ],
    cashBalance: "24360",
    bankBalance: "3757",
    savingAccount: "91361021000105",
    bankBranch: "BOI Nageri",
    ifsc: "BKID0009136",
    mobile1: "7389526914",
    mobile2: "952780200",
  };

  const handleOCRFill = () => {
    setShgData(mockOCRResult);
  };

  const handleChange = (key: string, value: string) => {
    setShgData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const updatedMembers = [...shgData.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setShgData((prev) => ({ ...prev, members: updatedMembers }));
  };

  const addMember = () => {
    setShgData((prev) => ({
      ...prev,
      members: [...prev.members, { name: "", id: "", dateOfJoining: "", dateOfLeaving: "" }],
    }));
  };

  const removeMember = (index: number) => {
    const updatedMembers = shgData.members.filter((_, i) => i !== index);
    setShgData((prev) => ({ ...prev, members: updatedMembers }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Add SHG Profile</Text>

      {/* Basic Info */}
      <TextInput
        style={styles.input}
        placeholder="Name of SHG"
        value={shgData.name}
        onChangeText={(val) => handleChange("name", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Formation"
        value={shgData.dateOfFormation}
        onChangeText={(val) => handleChange("dateOfFormation", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Meeting Frequency"
        value={shgData.meetingFrequency}
        onChangeText={(val) => handleChange("meetingFrequency", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Village Name"
        value={shgData.village}
        onChangeText={(val) => handleChange("village", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Gram Panchayat Name"
        value={shgData.gramPanchayat}
        onChangeText={(val) => handleChange("gramPanchayat", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="VO Name"
        value={shgData.voName}
        onChangeText={(val) => handleChange("voName", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="CLF Name"
        value={shgData.clfName}
        onChangeText={(val) => handleChange("clfName", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Block Name"
        value={shgData.blockName}
        onChangeText={(val) => handleChange("blockName", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="District Name"
        value={shgData.districtName}
        onChangeText={(val) => handleChange("districtName", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Joining Date in VO"
        value={shgData.joiningDateVO}
        onChangeText={(val) => handleChange("joiningDateVO", val)}
      />

      {/* Members */}
      <Text style={styles.subHeading}>Members</Text>
      {shgData.members.map((m, idx) => (
        <View key={idx} style={styles.memberBox}>
          <TextInput
            style={styles.input}
            placeholder="Member Name"
            value={m.name}
            onChangeText={(val) => handleMemberChange(idx, "name", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Member ID (if any)"
            value={m.id}
            onChangeText={(val) => handleMemberChange(idx, "id", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Joining"
            value={m.dateOfJoining}
            onChangeText={(val) => handleMemberChange(idx, "dateOfJoining", val)}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Leaving"
            value={m.dateOfLeaving}
            onChangeText={(val) => handleMemberChange(idx, "dateOfLeaving", val)}
          />

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeMember(idx)}
          >
            <Text style={styles.removeText}>Remove Member</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addMember}>
        <Text style={styles.btnText}>+ Add Member</Text>
      </TouchableOpacity>

      {/* Bank Details */}
      <Text style={styles.subHeading}>Bank Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Cash Balance"
        value={shgData.cashBalance}
        onChangeText={(val) => handleChange("cashBalance", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Bank Balance"
        value={shgData.bankBalance}
        onChangeText={(val) => handleChange("bankBalance", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Saving Bank A/C"
        value={shgData.savingAccount}
        onChangeText={(val) => handleChange("savingAccount", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Bank & Branch"
        value={shgData.bankBranch}
        onChangeText={(val) => handleChange("bankBranch", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="IFSC"
        value={shgData.ifsc}
        onChangeText={(val) => handleChange("ifsc", val)}
      />

      {/* Contacts */}
      <Text style={styles.subHeading}>Contacts</Text>
      <TextInput
        style={styles.input}
        placeholder="Mobile 1"
        value={shgData.mobile1}
        onChangeText={(val) => handleChange("mobile1", val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile 2"
        value={shgData.mobile2}
        onChangeText={(val) => handleChange("mobile2", val)}
      />

      {/* Buttons */}
      <TouchableOpacity style={styles.ocrBtn} onPress={handleOCRFill}>
        <Text style={styles.btnText}>Auto-fill from OCR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.btnText}>Save SHG</Text>
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
  ocrBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  saveBtn: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
