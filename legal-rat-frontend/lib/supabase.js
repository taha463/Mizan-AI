import { createClient } from "@supabase/supabase-js";

// We securely pull the keys using Vite's environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// We create the permanent bridge to the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
