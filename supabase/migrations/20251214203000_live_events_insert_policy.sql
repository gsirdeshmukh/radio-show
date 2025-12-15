-- Tighten live_events inserts to only allowed viewers.

drop policy if exists "live_events insert authed" on public.live_events;
create policy "live_events insert authed" on public.live_events
  for insert
  with check (
    auth.uid() is not null
    and auth.uid() = user_id
    and exists (
      select 1 from public.live_sessions ls
      where ls.id = live_session_id
        and (
          ls.visibility = 'public'
          or (
            ls.host_user_id = auth.uid()
            or (
              ls.visibility = 'followers'
              and exists (
                select 1 from public.follows f
                where (f.follower_id = auth.uid() and f.followed_id = ls.host_user_id)
                   or (f.follower_id = ls.host_user_id and f.followed_id = auth.uid())
              )
            )
            or (
              ls.visibility = 'friends'
              and exists (
                select 1 from public.follows f1
                where f1.follower_id = auth.uid() and f1.followed_id = ls.host_user_id
              )
              and exists (
                select 1 from public.follows f2
                where f2.follower_id = ls.host_user_id and f2.followed_id = auth.uid()
              )
            )
          )
        )
    )
  );

