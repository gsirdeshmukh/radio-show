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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }
  const id: string | null = body.id || null;
  const type: string | null = body.type || null; // play | download | like
  if (!id || !type) {
    return new Response("id and type required", { status: 400, headers: corsHeaders });
  }
  if (!["play", "download", "like"].includes(type)) {
    return new Response("invalid type", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const updates: Record<string, number> = {};
  if (type === "play") updates.plays = 1;
  if (type === "download") updates.downloads = 1;
  if (type === "like") updates.likes = 1;

  const { error } = await supabase.rpc("increment_session_stats", {
    session_id: id,
    inc_plays: updates.plays || 0,
    inc_downloads: updates.downloads || 0,
    inc_likes: updates.likes || 0,
  });

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
});
