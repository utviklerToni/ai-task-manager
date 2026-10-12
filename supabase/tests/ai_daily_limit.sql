-- Run after the migration in a test database; fixtures are rolled back.
begin;
insert into auth.users (id) values
   ('00000000-0000-4000-a000-000000000001'),
   ('00000000-0000-4000-a000-000000000002');

do $$
declare
   result record;
   i integer;
begin
   for i in 1..6 loop
      select * into result from public.consume_ai_request('00000000-0000-4000-a000-000000000001');
      assert result.allowed, 'First six requests must be allowed';
      assert result.remaining = 6 - i, 'Remaining allowance must decrease';
      assert result.reset_at = (((statement_timestamp() at time zone 'UTC')::date + 1)::timestamp at time zone 'UTC'),
         'Reset must be at midnight UTC regardless of database timezone';
   end loop;

   select * into result from public.consume_ai_request('00000000-0000-4000-a000-000000000001');
   assert not result.allowed and result.remaining = 0, 'Seventh request must be blocked';
   assert (select requests = 6 from public.ai_daily_usage where user_id = '00000000-0000-4000-a000-000000000001'),
      'Blocked requests must not increment the count';

   select * into result from public.consume_ai_request('00000000-0000-4000-a000-000000000002');
   assert result.allowed and result.remaining = 5, 'Users must have separate allowances';

   update public.ai_daily_usage
   set usage_day = (statement_timestamp() at time zone 'UTC')::date - 1
   where user_id = '00000000-0000-4000-a000-000000000001';
   select * into result from public.consume_ai_request('00000000-0000-4000-a000-000000000001');
   assert result.allowed and result.remaining = 5, 'Yesterday''s usage must reset';

   assert not has_function_privilege('anon', 'public.consume_ai_request(uuid)', 'EXECUTE');
   assert not has_function_privilege('authenticated', 'public.consume_ai_request(uuid)', 'EXECUTE');
   assert not has_table_privilege('anon', 'public.ai_daily_usage', 'UPDATE');
   assert not has_table_privilege('authenticated', 'public.ai_daily_usage', 'UPDATE');
end;
$$;

-- Exercise the role used by the server, including its table permissions and RLS.
set local role service_role;
do $$
declare
   result record;
begin
   select * into result from public.consume_ai_request('00000000-0000-4000-a000-000000000002');
   assert result.allowed and result.remaining = 4, 'Server role must be able to reserve requests';
end;
$$;
rollback;
