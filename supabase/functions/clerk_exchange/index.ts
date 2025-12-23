import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { create, decode, getNumericDate, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseJwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("JWT_SECRET") || "";
const clerkJwksUrl = Deno.env.get("CLERK_JWKS_URL") || "https://api.clerk.com/v1/jwks";
const clerkIssuer = Deno.env.get("CLERK_ISSUER") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

const NAMESPACE_UUID = "b3b3f8f9-1d68-4ab2-9d6a-8d2d9b8ef8c1";

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function uuidv5(namespace: string, name: string): Promise<string> {
  const nsBytes = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(nsBytes.length + nameBytes.length);
  data.set(nsBytes, 0);
  data.set(nameBytes, nsBytes.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", data)).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return bytesToUuid(hash);
}

async function getClerkKey(token: string): Promise<CryptoKey> {
  const decoded = decode(token, { complete: true });
  const header = decoded?.header || {};
  const kid = header?.kid;
  if (!kid) throw new Error("Missing kid");
  const res = await fetch(clerkJwksUrl);
  if (!res.ok) throw new Error("JWKS fetch failed");
  const jwks = await res.json();
  const key = (jwks?.keys || []).find((k: any) => k.kid === kid);
  if (!key) throw new Error("JWKS key not found");
  return crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response("Missing Clerk token", { status: 401, headers: corsHeaders });
  }
  if (!supabaseJwtSecret) {
    return new Response("Missing SUPABASE_JWT_SECRET", { status: 500, headers: corsHeaders });
  }

  let payload: any;
  try {
    const key = await getClerkKey(token);
    payload = await verify(token, key, clerkIssuer ? { issuer: clerkIssuer } : undefined);
  } catch (err) {
    return new Response(`Clerk token invalid: ${err?.message || "unknown"}`, { status: 401, headers: corsHeaders });
  }

  const clerkUserId = payload?.sub || "";
  if (!clerkUserId) {
    return new Response("Missing Clerk user id", { status: 400, headers: corsHeaders });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const userUuid = await uuidv5(NAMESPACE_UUID, clerkUserId);
  const displayName = body.spotify_display_name || body.display_name || null;
  const avatarUrl = body.spotify_avatar_url || body.avatar_url || null;
  const email = body.email || null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  await supabase.from("profiles").upsert({
    user_id: userUuid,
    display_name: displayName,
    avatar_url: avatarUrl,
  });

  const jwtKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(supabaseJwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const now = getNumericDate(0);
  const exp = getNumericDate(60 * 60 * 24);
  const supabaseJwt = await create(
    { alg: "HS256", typ: "JWT" },
    {
      aud: "authenticated",
      role: "authenticated",
      sub: userUuid,
      email,
      iat: now,
      exp,
    },
    jwtKey,
  );

  return new Response(
    JSON.stringify({ supabase_jwt: supabaseJwt, user_id: userUuid }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
