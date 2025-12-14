import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const allowedVisibilities = new Set(["public", "followers", "friends"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const userId = await getUserId(req, supabase);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const zipRaw: string | null = body.zip || body.near_zip || null;
  const zip = typeof zipRaw === "string" ? zipRaw.trim() : null;
  const limit = Math.min(Math.max(Number(body.limit) || 30, 1), 100);

  let query = supabase
    .from("live_sessions")
    .select("id, title, host_user_id, visibility, status, room_name, started_at, zip, location_opt_in, profiles(handle, display_name, avatar_url)")
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (zip) {
    query = query.eq("zip", zip).eq("location_opt_in", true);
  }

  const { data, error } = await query;
  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  const rows = Array.isArray(data) ? data : [];
  const hostIds = Array.from(new Set(rows.map((r: any) => r.host_user_id).filter(Boolean)));
  const follow = await getFollowSets({ supabase, userId, hostIds });

  const live = rows
    .filter((r: any) => canViewLive({ r, userId, follow }))
    .map((r: any) => {
      const vis = allowedVisibilities.has(r.visibility) ? r.visibility : "public";
      const prof = Array.isArray(r.profiles) ? r.profiles?.[0] : r.profiles;
      const hostHandle = prof?.handle ? `@${prof.handle}` : prof?.display_name || null;
      return {
        id: r.id,
        title: r.title,
        host_user_id: r.host_user_id,
        host: hostHandle,
        visibility: vis,
        room_name: r.room_name,
        started_at: r.started_at,
        zip: r.location_opt_in ? r.zip : null,
      };
    });

  return new Response(JSON.stringify({ live }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
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

async function getFollowSets({
  supabase,
  userId,
  hostIds,
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string | null;
  hostIds: string[];
}) {
  const empty = { forward: new Set<string>(), reverse: new Set<string>() };
  if (!userId || !hostIds.length) return empty;
  try {
    const forward = new Set<string>();
    const reverse = new Set<string>();

    const [{ data: fwd }, { data: rev }] = await Promise.all([
      supabase.from("follows").select("followed_id").eq("follower_id", userId).in("followed_id", hostIds),
      supabase.from("follows").select("follower_id").eq("followed_id", userId).in("follower_id", hostIds),
    ]);

    (fwd || []).forEach((r: any) => r?.followed_id && forward.add(r.followed_id));
    (rev || []).forEach((r: any) => r?.follower_id && reverse.add(r.follower_id));
    return { forward, reverse };
  } catch {
    return empty;
  }
}

function canViewLive({
  r,
  userId,
  follow,
}: {
  r: any;
  userId: string | null;
  follow: { forward: Set<string>; reverse: Set<string> };
}) {
  const visibility = allowedVisibilities.has(r?.visibility) ? r.visibility : "public";
  const hostId = r?.host_user_id || null;
  if (visibility === "public") return true;
  if (!userId || !hostId) return false;
  if (hostId === userId) return true;
  const forward = follow.forward.has(hostId);
  const reverse = follow.reverse.has(hostId);
  if (visibility === "followers") return forward || reverse;
  if (visibility === "friends") return forward && reverse;
  return false;
}
