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
  const spotifyId = body.spotify_id;
  if (!spotifyId) {
    return new Response("spotify_id required", { status: 400, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, { global: { headers: { Authorization: authHeader } } });
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const profileRow = {
    user_id: userId,
    display_name: body.display_name || null,
    avatar_url: body.avatar_url || null,
  };
  if (userId) {
    await supabase.from("profiles").upsert(profileRow);
  }

  if (userId) {
    await supabase
      .from("spotify_profiles")
      .upsert({
        user_id: userId,
        spotify_id: spotifyId,
        display_name: body.display_name || null,
        avatar_url: body.avatar_url || null,
        email: body.email || null,
        country: body.country || null,
        product: body.product || null,
        last_sync_at: new Date().toISOString(),
      });
  }

  return new Response(JSON.stringify({ ok: true, user_id: userId }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
