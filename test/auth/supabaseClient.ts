import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = "https://wnjuwlkjicdznehqklpq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduanV3bGtqaWNkem5laHFrbHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTgyNTcsImV4cCI6MjA3MjMzNDI1N30.v55OpKVKxahYN2hyp_pKh6Ut3Q2TMmS0Cz5dWw0wvH4"

export const supabase = createClient(SUPABASE_URL,SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // 👈 store session in AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});