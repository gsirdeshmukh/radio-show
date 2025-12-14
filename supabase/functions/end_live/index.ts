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

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const userId = await getUserId(req, supabase);
  if (!userId) return new Response("Auth required", { status: 401, headers: corsHeaders });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const id: string | null = body.id || null;
  const roomName: string | null = body.room_name || null;
  if (!id && !roomName) return new Response("id or room_name required", { status: 400, headers: corsHeaders });

  let query = supabase.from("live_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("host_user_id", userId).eq("status", "live");
  query = id ? query.eq("id", id) : query.eq("room_name", roomName);
  const { error } = await query;
  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
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

