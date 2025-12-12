# Supabase deploy checklist

Project URL: https://jduyihzjqpcczekhorrq.supabase.co
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdXlpaHpqcXBjY3pla2hvcnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTQ3NzQsImV4cCI6MjA4MTA5MDc3NH0.I74X4-qJxOTDUxocRnPOhS_pG51ipfquFQOslzlHKCQ

Blocking to deploy:
- Need SERVICE ROLE key to set function env (`SERVICE_ROLE_KEY`; avoid SUPABASE_ prefix) and bypass RLS in Edge Functions.
- Need approval to run Supabase CLI with network to deploy functions.

Deploy steps (once service key is provided):
1) Export service key to env: `export SUPABASE_SERVICE_ROLE_KEY=...` (do not commit).
2) `supabase db push --db-url <project db>` or paste `supabase/schema.sql` in SQL editor.
3) `supabase functions deploy create_session list_sessions get_session record_event sync_spotify_profile --project-ref jduyihzjqpcczekhorrq`.
4) Set function secrets: `supabase secrets set --project-ref jduyihzjqpcczekhorrq PROJECT_URL=... SERVICE_ROLE_KEY=... SESSION_BUCKET=sessions ASSET_BUCKET=assets ALLOW_ANON_CREATE=true`.
5) Buckets: created public `sessions` and `assets` via Storage API.

Status (run):
- Applied schema (db already up to date).
- Deployed functions: create_session, list_sessions, get_session, record_event, sync_spotify_profile.
- Secrets set with PROJECT_URL + SERVICE_ROLE_KEY + buckets + anon create enabled.
- Buckets created.
- Fixed RLS issue in create_session by running functions with service role (no caller auth header) and applied schema via migration. Verified create_session works via curl.
5) Optional: create public Storage buckets `sessions` and `assets` in dashboard (public read).
