import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const q: string | null = body.q || null;
  const tag: string | null = body.tag || null;
  const genre: string | null = body.genre || null;
  const sort = body.sort || "new"; // new | top | trending
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);
  const offset = Math.max(Number(body.offset) || 0, 0);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let query = supabase
    .from("sessions")
    .select("id, slug, title, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes)")
    .eq("visibility", "public");

  if (q) {
    const pattern = `%${q}%`;
    query = query.or(
      [
        `title.ilike.${pattern}`,
        `host_name.ilike.${pattern}`,
        `genre.ilike.${pattern}`,
        `tags::text.ilike.${pattern}`,
      ].join(","),
    );
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (genre) {
    query = query.ilike("genre", `%${genre}%`);
  }
  if (sort === "top") {
    query = query.order("downloads", { referencedTable: "session_stats", ascending: false }).order("created_at", { ascending: false });
  } else if (sort === "trending") {
    query = query.order("plays", { referencedTable: "session_stats", ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const sessions = (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    host: row.host_name,
    genre: row.genre,
    tags: row.tags,
    cover_url: row.cover_url,
    url: row.storage_path,
    plays: row.session_stats?.[0]?.plays ?? 0,
    downloads: row.session_stats?.[0]?.downloads ?? 0,
    likes: row.session_stats?.[0]?.likes ?? 0,
    created_at: row.created_at,
  }));

  return new Response(JSON.stringify({ sessions }), { status: 200, headers: { "Content-Type": "application/json" } });
});
