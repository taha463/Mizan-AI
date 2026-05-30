import { supabase } from "./supabase";

/**
 * Registers a new lawyer/user with an email and password.
 * Supabase automatically creates their secure record in auth.users.
 */
export async function signUpUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Authenticates an existing user and creates a secure session.
 */
export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Destroys the current user session and logs them out.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Retrieves the currently logged-in user's session data.
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
