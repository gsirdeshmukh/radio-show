import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sessionBucket = Deno.env.get("SESSION_BUCKET") || "sessions";
const allowedVisibilities = new Set(["public", "unlisted", "followers", "friends"]);

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
  const userId: string | null = await getUserId(req, supabase);
  let query = supabase
    .from("sessions")
    .select(
      "id, slug, title, host_user_id, host_name, genre, tags, cover_url, storage_path, visibility, created_at, session_stats(plays, downloads, likes), session_locations(zip, opt_in)",
    );
  query = id ? query.eq("id", id) : query.eq("slug", slug);
  const { data, error } = await query.single();
  if (error) {
    return new Response(error.message, { status: 404, headers: corsHeaders });
  }

  const visibility = allowedVisibilities.has(data.visibility) ? data.visibility : "public";
  const hostUserId = data.host_user_id || null;
  const ok = await canAccessSession({ sessionId: data.id, visibility, hostUserId, userId, supabase });
  if (!ok) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const jsonPath = data.storage_path;
  const { data: signed } = await supabase.storage.from(sessionBucket).createSignedUrl(jsonPath, 60 * 60);

  const loc = Array.isArray(data.session_locations) ? data.session_locations?.[0] : data.session_locations;
  const location = loc?.zip ? { zip: loc.opt_in ? loc.zip : null, opt_in: !!loc.opt_in } : null;

  return new Response(
    JSON.stringify({
      id: data.id,
      slug: data.slug,
      title: data.title,
      host: data.host_name,
      host_user_id: hostUserId,
      genre: data.genre,
      tags: data.tags,
      cover_url: data.cover_url,
      visibility,
      location,
      storage_path: jsonPath,
      json_url: signed?.signedUrl || null,
      stats: data.session_stats?.[0] || { plays: 0, downloads: 0, likes: 0 },
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});

async function getUserId(req: Request, supabase: ReturnType<typeof createClient>) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function canAccessSession({
  sessionId,
  visibility,
  hostUserId,
  userId,
  supabase,
}: {
  sessionId: string;
  visibility: string;
  hostUserId: string | null;
  userId: string | null;
  supabase: ReturnType<typeof createClient>;
}) {
  if (visibility === "public" || visibility === "unlisted") return true;
  if (!userId) return false;
  if (hostUserId && userId === hostUserId) return true;
  if (!hostUserId) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, followed_id")
    .or(
      [
        `and(follower_id.eq.${userId},followed_id.eq.${hostUserId})`,
        `and(follower_id.eq.${hostUserId},followed_id.eq.${userId})`,
      ].join(","),
    );
  if (error) return false;
  const rows = Array.isArray(data) ? data : [];
  const pairs = new Set(rows.map((r: any) => `${r.follower_id}->${r.followed_id}`));
  const forward = pairs.has(`${userId}->${hostUserId}`);
  const reverse = pairs.has(`${hostUserId}->${userId}`);

  if (visibility === "followers") return forward || reverse;
  if (visibility === "friends") {
    if (forward && reverse) return true;
  }

  // Inbox overrides: direct shares grant access even if not following/friends.
  try {
    const { data: shares } = await supabase
      .from("inbox_items")
      .select("id")
      .eq("session_id", sessionId)
      .or([`to_user_id.eq.${userId}`, `from_user_id.eq.${userId}`].join(","))
      .limit(1);
    if (Array.isArray(shares) && shares.length) return true;
  } catch {
    // ignore
  }

  return false;
}
