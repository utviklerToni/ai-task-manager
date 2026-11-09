import { supabaseAdmin } from '@/lib/supabase';

// Every task read includes its group's title, so the board can show groups after a reload.
export const TASK_SELECT = '*, group:task_groups(id, title)';

// Group membership is only set by /api/task-groups, never from a client body.
export function stripGroupFields<T extends Record<string, unknown>>(body: T): T {
   const copy = { ...body };
   delete copy.group_id;
   delete copy.group_position;
   delete copy.group;
   return copy;
}

// Removes groups that no longer have any tasks, so deleting tasks leaves no empty groups behind.
export async function deleteEmptyGroups(
   userId: string,
   groupIds: (string | null | undefined)[],
) {
   const ids = Array.from(new Set(groupIds.filter((id): id is string => !!id)));
   if (ids.length === 0) return;

   const { data: remaining, error } = await supabaseAdmin
      .from('tasks')
      .select('group_id')
      .eq('user_id', userId)
      .in('group_id', ids);
   if (error) return;

   const stillUsed = new Set((remaining || []).map((t) => t.group_id));
   const empty = ids.filter((id) => !stillUsed.has(id));
   if (empty.length === 0) return;

   await supabaseAdmin
      .from('task_groups')
      .delete()
      .eq('user_id', userId)
      .in('id', empty);
}
