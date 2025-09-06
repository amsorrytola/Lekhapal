import { supabase } from "../auth/supabaseClient";

// Super admin uses this function
export async function addUser({ email, password, name, username }) {
  // check invite code (hardcoded or stored in Supabase KV table)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username, role: "user" }, // stored in user_metadata
    },
  });

  if (error) throw error;
  return data.user;
}
