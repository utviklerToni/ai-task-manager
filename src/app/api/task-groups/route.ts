import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { TASK_SELECT } from '@/lib/taskGroups';
import { Subtask, TaskPriority } from '@/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const MAX_TASKS = 10;

interface GroupTaskInput {
   title?: unknown;
   description?: unknown;
   priority?: unknown;
   category?: unknown;
   estimated_minutes?: unknown;
   subtasks?: unknown;
}

// Creates a group and its tasks (in step order) from one AI request.
export async function POST(request: NextRequest) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   const userId = session.user.id;

   let body;
   try {
      body = await request.json();
   } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
   }

   const title = typeof body?.title === 'string' ? body.title.trim() : '';
   if (!title || title.length > 255) {
      return NextResponse.json(
         { error: 'Group title is required and must be under 255 characters' },
         { status: 400 },
      );
   }

   const tasks: GroupTaskInput[] = Array.isArray(body?.tasks) ? body.tasks : [];
   if (tasks.length < 1 || tasks.length > MAX_TASKS) {
      return NextResponse.json(
         { error: `A group needs between 1 and ${MAX_TASKS} tasks` },
         { status: 400 },
      );
   }

   const rows = [];
   for (const [index, t] of tasks.entries()) {
      const taskTitle = typeof t.title === 'string' ? t.title.trim() : '';
      if (!taskTitle || taskTitle.length > 255) {
         return NextResponse.json(
            { error: 'Each task needs a title under 255 characters' },
            { status: 400 },
         );
      }
      const description =
         typeof t.description === 'string' ? t.description.slice(0, 2000) : null;
      const subtasks: Subtask[] = Array.isArray(t.subtasks)
         ? t.subtasks
              .filter((s) => typeof s?.title === 'string')
              .map((s, i) => ({
                 id: String(s.id ?? i + 1),
                 title: String(s.title).slice(0, 255),
                 completed: false,
              }))
         : [];

      rows.push({
         user_id: userId,
         title: taskTitle,
         description,
         priority: PRIORITIES.includes(t.priority as TaskPriority)
            ? t.priority
            : 'medium',
         category:
            typeof t.category === 'string' && t.category.trim()
               ? t.category.trim().slice(0, 50)
               : 'general',
         estimated_minutes:
            typeof t.estimated_minutes === 'number' && t.estimated_minutes > 0
               ? Math.round(t.estimated_minutes)
               : null,
         subtasks,
         ai_generated: true,
         group_position: index,
      });
   }

   const { data: group, error: groupError } = await supabaseAdmin
      .from('task_groups')
      .insert({ user_id: userId, title })
      .select('id, title')
      .single();

   if (groupError || !group) {
      return NextResponse.json(
         { error: groupError?.message || 'Could not create group' },
         { status: 500 },
      );
   }

   const { data: created, error } = await supabaseAdmin
      .from('tasks')
      .insert(rows.map((r) => ({ ...r, group_id: group.id })))
      .select(TASK_SELECT);

   if (error) {
      // Don't leave an empty group behind if the tasks failed to save.
      await supabaseAdmin.from('task_groups').delete().eq('id', group.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ group, tasks: created }, { status: 201 });
}
