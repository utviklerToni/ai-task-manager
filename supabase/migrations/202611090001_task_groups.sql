begin;

-- One group per AI request that produced several related tasks.
create table public.task_groups (
   id uuid primary key default gen_random_uuid(),
   user_id uuid not null references auth.users(id) on delete cascade,
   title text not null check (char_length(title) between 1 and 255),
   created_at timestamptz not null default now()
);

create index idx_task_groups_user_id on public.task_groups (user_id);

alter table public.task_groups enable row level security;
revoke all on public.task_groups from public, anon, authenticated;
grant select, insert, update, delete on public.task_groups to service_role;

-- Ungrouped tasks keep a null group_id. group_position is the step order (0 = first).
alter table public.tasks
   add column group_id uuid references public.task_groups(id) on delete set null,
   add column group_position smallint;

create index idx_tasks_group_id on public.tasks (group_id);

commit;
