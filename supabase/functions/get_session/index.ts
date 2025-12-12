import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sessionBucket = Deno.env.get("SESSION_BUCKET") || "sessions";

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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }
  const id: string | null = body.id || null;
  const slug: string | null = body.slug || null;
  if (!id && !slug) {
    return new Response("id or slug required", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let query = supabase
    .from("sessions")
    .select("id, slug, title, host_name, genre, tags, cover_url, storage_path, created_at, session_stats(plays, downloads, likes)")
    .eq("visibility", "public");
  query = id ? query.eq("id", id) : query.eq("slug", slug);
  const { data, error } = await query.single();
  if (error) {
    return new Response(error.message, { status: 404, headers: corsHeaders });
  }

  const jsonPath = data.storage_path;
  const { data: signed } = await supabase.storage.from(sessionBucket).createSignedUrl(jsonPath, 60 * 60);

  return new Response(
    JSON.stringify({
      id: data.id,
      slug: data.slug,
      title: data.title,
      host: data.host_name,
      genre: data.genre,
      tags: data.tags,
      cover_url: data.cover_url,
      storage_path: jsonPath,
      json_url: signed?.signedUrl || null,
      stats: data.session_stats?.[0] || { plays: 0, downloads: 0, likes: 0 },
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
