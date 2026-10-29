import { createClient } from "@supabase/supabase-js";

const defaultUrl = "https://ofdgtioowdpthbnldfvk.supabase.co";
const defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGd0aW9vd2RwdGhibmxkZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxODA5NzcsImV4cCI6MjEwODc1Njk3N30.v9oMS4UiGDb6G4JYMi6ZmSR3V2NhyGFhv5oA50AwLT0";
const defaultServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGd0aW9vd2RwdGhibmxkZnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzE4MDk3NywiZXhwIjoyMTA4NzU2OTc3fQ.5iU0PDcaqDvdIYEli_ksgDKopdPtmcBSASJo5NnafTc";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || defaultServiceKey;

// Public client for browser / client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for secure backend API operations (Server only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Safely deletes an image file from Supabase storage bucket 'menu-images'
 * if the provided URL belongs to our Supabase storage.
 */
export async function deleteStorageImage(imageUrl?: string | null): Promise<boolean> {
  if (!imageUrl || typeof imageUrl !== "string") return false;
  try {
    // Only target images hosted in our Supabase storage 'menu-images' bucket
    if (!imageUrl.includes("/menu-images/")) return false;

    const parts = imageUrl.split("/menu-images/");
    if (parts.length < 2) return false;

    // e.g. "items/1793260449-abc.jpg"
    const filePath = decodeURIComponent(parts[1].split("?")[0]);
    if (!filePath) return false;

    const { error } = await supabaseAdmin.storage
      .from("menu-images")
      .remove([filePath]);

    if (error) {
      console.warn(`[Supabase Storage] Failed to remove ${filePath}:`, error.message);
      return false;
    }

    console.log(`[Supabase Storage] Successfully deleted unused image: ${filePath}`);
    return true;
  } catch (err) {
    console.error("[Supabase Storage] Error deleting image:", err);
    return false;
  }
}

