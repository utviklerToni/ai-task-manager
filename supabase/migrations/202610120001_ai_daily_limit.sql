begin;

-- One row per user; the allowance is shared by all AI actions.
create table public.ai_daily_usage (
   user_id uuid primary key references auth.users(id) on delete cascade,
   usage_day date not null,
   requests integer not null check (requests between 1 and 6)
);

alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from public, anon, authenticated;
grant select, insert, update on public.ai_daily_usage to service_role;

create function public.consume_ai_request(p_user_id uuid)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
   v_day date := (statement_timestamp() at time zone 'UTC')::date;
   v_requests integer;
begin
   -- The upsert locks the user's row: concurrent requests cannot exceed six.
   insert into public.ai_daily_usage as usage (user_id, usage_day, requests)
   values (p_user_id, v_day, 1)
   on conflict (user_id) do update
   set usage_day = excluded.usage_day,
       requests = case
          when usage.usage_day < excluded.usage_day then 1
          else usage.requests + 1
       end
   where usage.usage_day < excluded.usage_day
      or (usage.usage_day = excluded.usage_day and usage.requests < 6)
   returning requests into v_requests;

   return query select
      v_requests is not null,
      case when v_requests is null then 0 else 6 - v_requests end,
      (v_day + 1)::timestamp at time zone 'UTC';
end;
$$;

-- Only the server may consume an allowance, using the authenticated session ID.
revoke all on function public.consume_ai_request(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid) to service_role;

commit;
