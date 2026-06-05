import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Fallback hardcoded — anon key aman dipublikasi, keamanan dijaga RLS Supabase
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://uuhhjsvurtgfzavxswzk.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aGhqc3Z1cnRnZnphdnhzd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTY1MzMsImV4cCI6MjA5NjA3MjUzM30.ly9pLynfaybh8SkK6ELFvN5nxioWmcfVaE44VYaqyFw";

let _client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return _client;
}

export interface HistoryRecord {
  id: string;
  created_at: string;
  name: string;
  face_shape: string;
  confidence: number;
  hairstyles: { name: string; description: string; image?: string }[];
}

export async function saveHistory(
  name: string,
  face_shape: string,
  confidence: number,
  hairstyles: HistoryRecord["hairstyles"]
): Promise<void> {
  const { error } = await getSupabase()
    .from("recommendations")
    .insert({ name, face_shape, confidence, hairstyles });
  if (error) console.error("saveHistory error:", error.message);
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const { data, error } = await getSupabase()
    .from("recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchAllHistory(): Promise<HistoryRecord[]> {
  const { data, error } = await getSupabase()
    .from("recommendations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface AdminStats {
  total: number;
  today: number;
  topFaceShape: string;
  topHairstyle: string;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await getSupabase().from("recommendations").select("*");
  if (error) throw new Error(error.message);
  const records: HistoryRecord[] = data ?? [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = records.filter((r) => r.created_at.startsWith(todayStr)).length;

  const shapeCounts: Record<string, number> = {};
  records.forEach((r) => { shapeCounts[r.face_shape] = (shapeCounts[r.face_shape] ?? 0) + 1; });
  const topFaceShape = Object.entries(shapeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const hairstyleCounts: Record<string, number> = {};
  records.forEach((r) => {
    const top = r.hairstyles[0]?.name;
    if (top) hairstyleCounts[top] = (hairstyleCounts[top] ?? 0) + 1;
  });
  const topHairstyle = Object.entries(hairstyleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return { total: records.length, today, topFaceShape, topHairstyle };
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await getSupabase().from("recommendations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
