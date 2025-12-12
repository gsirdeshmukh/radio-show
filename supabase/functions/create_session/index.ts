import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sessionBucket = Deno.env.get("SESSION_BUCKET") || "sessions";
const allowAnonCreate = (Deno.env.get("ALLOW_ANON_CREATE") || "true").toLowerCase() === "true";

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
  let payload: any;
  try {
    const body = await req.json();
    payload = body?.payload;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }
  if (!payload || !payload.meta || !Array.isArray(payload.segments)) {
    return new Response("Missing payload.meta or payload.segments", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  // Optional auth gate: disabled by default when allowAnonCreate=true
  const userId: string | null = allowAnonCreate ? null : await getUserId(req, supabase);
  if (!allowAnonCreate && !userId) return new Response("Auth required", { status: 401 });

  const sessionId = crypto.randomUUID();
  const slug = slugify(payload.meta.title || "session", sessionId);
  const storagePath = `sessions/${sessionId}.json`;

  // Upload canonical JSON
  const json = JSON.stringify(payload);
  const upload = await supabase.storage.from(sessionBucket).upload(storagePath, new Blob([json], { type: "application/json" }), { upsert: true });
  if (upload.error) {
    return new Response(upload.error.message, { status: 500, headers: corsHeaders });
  }

  const { data: publicUrlData } = supabase.storage.from(sessionBucket).getPublicUrl(storagePath);
  const jsonUrl = publicUrlData?.publicUrl || null;

  const meta = {
    id: sessionId,
    slug,
    title: payload.meta.title || "",
    host_user_id: userId,
    host_name: payload.meta.host || null,
    genre: payload.meta.genre || null,
    tags: payload.meta.tags || [],
    duration_ms: payload.meta.duration_ms || null,
    track_count: payload.segments.length,
    cover_url: payload.meta.cover_url || null,
    visibility: payload.meta.visibility || "public",
    storage_path: storagePath,
  };

  const { error: insertError } = await supabase.from("sessions").insert(meta);
  if (insertError) {
    return new Response(insertError.message, { status: 500, headers: corsHeaders });
  }

  // Seed stats row
  await supabase.from("session_stats").upsert({ session_id: sessionId });

  return new Response(
    JSON.stringify({
      id: sessionId,
      slug,
      json_url: jsonUrl,
      storage_path: storagePath,
    }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});

function slugify(title: string, fallbackId: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  const suffix = fallbackId.slice(0, 8);
  return base ? `${base}-${suffix}` : `session-${suffix}`;
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
