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
  if (!userId) return new Response("Auth required", { status: 401, headers: corsHeaders });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title = String(body.title || "Live").slice(0, 120);
  const visibility = allowedVisibilities.has(body.visibility) ? body.visibility : "followers";
  const zipRaw = typeof body.zip === "string" ? body.zip.trim() : "";
  const zip = zipRaw || null;
  const locationOptIn = !!body.location_opt_in && !!zip;

  // Ensure profile row exists for attribution.
  await supabase.from("profiles").upsert({ user_id: userId });

  // Idempotency: if the host is already live, return that session.
  const { data: existingRows } = await supabase
    .from("live_sessions")
    .select("id, room_name, title, visibility, started_at, zip, location_opt_in")
    .eq("host_user_id", userId)
    .eq("status", "live")
    .order("started_at", { ascending: false })
    .limit(1);

  const existing = Array.isArray(existingRows) ? existingRows[0] : null;
  if (existing?.id) {
    return new Response(JSON.stringify({ ok: true, live: existing }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const roomName = makeRoomName(userId);
  const row = {
    host_user_id: userId,
    title,
    status: "live",
    visibility,
    zip,
    location_opt_in: locationOptIn,
    room_name: roomName,
    provider: "placeholder",
  };

  const { data, error } = await supabase
    .from("live_sessions")
    .insert(row)
    .select("id, room_name, title, visibility, started_at, zip, location_opt_in")
    .single();

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true, live: data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});

function makeRoomName(userId: string) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `live-${userId.slice(0, 8)}-${Date.now().toString(36)}-${suffix}`;
}

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
