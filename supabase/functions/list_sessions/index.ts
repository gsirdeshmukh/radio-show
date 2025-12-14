import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
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
  const hostUserId: string | null = body.host_user_id || null;
  const nearZipRaw: string | null = body.zip || body.near_zip || null;
  const nearZip = typeof nearZipRaw === "string" ? nearZipRaw.trim() : null;
  const sort = body.sort || "new"; // new | top | trending
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 100);
  const offset = Math.max(Number(body.offset) || 0, 0);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let sessionIds: string[] | null = null;
  if (nearZip) {
    const { data: locs, error: locErr } = await supabase
      .from("session_locations")
      .select("session_id")
      .eq("zip", nearZip)
      .eq("opt_in", true)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (locErr) {
      return new Response(locErr.message, { status: 500, headers: corsHeaders });
    }
    sessionIds = (locs || []).map((x: any) => x?.session_id).filter(Boolean);
    if (!sessionIds.length) {
      return new Response(JSON.stringify({ sessions: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  let query = supabase
    .from("sessions")
    .select(
      "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes), session_locations(zip, opt_in)",
    )
    .eq("visibility", "public");

  if (hostUserId) {
    query = query.eq("host_user_id", hostUserId);
  }
  if (sessionIds) {
    query = query.in("id", sessionIds);
  }
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
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  const sessions = (data || []).map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    host_user_id: row.host_user_id,
    host: row.host_name,
    genre: row.genre,
    tags: row.tags,
    cover_url: row.cover_url,
    url: row.storage_path,
    zip: Array.isArray(row.session_locations) ? (row.session_locations?.[0]?.opt_in ? row.session_locations?.[0]?.zip : null) : row.session_locations?.opt_in ? row.session_locations?.zip : null,
    plays: row.session_stats?.[0]?.plays ?? 0,
    downloads: row.session_stats?.[0]?.downloads ?? 0,
    likes: row.session_stats?.[0]?.likes ?? 0,
    created_at: row.created_at,
  }));

  return new Response(JSON.stringify({ sessions }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
});
