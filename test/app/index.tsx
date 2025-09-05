// // app/(tabs)/PostsScreen.tsx
// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { supabase } from "../../auth/supabaseClient";

// interface Post {
//   id: string;
//   title: string;
//   scanned_at: string;
// }

// export default function PostsScreen() {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchPosts = async () => {
//     setLoading(true);
//     const { data, error } = await supabase
//       .from("scans")
//       .select("id, title, scanned_at")
//       .order("scanned_at", { ascending: false });

//     if (error) {
//       console.error("Error fetching posts:", error);
//     } else {
//       setPosts(data || []);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const handleView = (id: string) => {
//     console.log("Save pressed for id:", id);
//   };

//   const handleEdit = (id: string) => {
//     console.log("Edit pressed for id:", id);
//   };

//   const renderItem = ({ item }: { item: Post }) => (
//     <View style={styles.card}>
//       {/* Title with ellipsis */}
//       <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
//         {item.title}
//       </Text>

//       {/* Bottom row: date on left, buttons on right */}
//       <View style={styles.bottomRow}>
//         <Text style={styles.date}>
//           {new Date(item.scanned_at).toLocaleDateString()}
//         </Text>

//         <View style={styles.buttonRow}>
//           <TouchableOpacity
//             style={[styles.button, styles.buttonSave]}
//             onPress={() => handleView(item.id)}
//           >
//             <Text style={styles.buttonText}>Save</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.button, styles.buttonEdit]}
//             onPress={() => handleEdit(item.id)}
//           >
//             <Text style={styles.buttonText}>Edit</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#4CAF50" />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView>
//     <FlatList
//       data={posts}
//       keyExtractor={(item) => item.id}
//       renderItem={renderItem}
//       contentContainerStyle={styles.container}
//     />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 12,
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 12,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 4,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 6,
//     color: "#333",
//   },
//   bottomRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   date: {
//     fontSize: 12,
//     color: "#888",
//   },
//   buttonRow: {
//     flexDirection: "row",
//     gap: 8,
//   },
//   button: {
//     paddingVertical: 4,
//     paddingHorizontal: 10,
//     borderRadius: 6,
//   },
//   buttonSave: {
//     backgroundColor: "#4CAF50",
//   },
//   buttonEdit: {
//     backgroundColor: "#2196F3",
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "500",
//   },
//   loader: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });

import DashboardScreen from '@/components/Dashboard'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

function Home() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <DashboardScreen/>
    </SafeAreaView>
  )
}

export default Home

