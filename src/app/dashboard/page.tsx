import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { Task } from '@/types';
import TaskList from '@/components/tasks/TaskList';

async function getTasks(userId: string): Promise<Task[]> {
   const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

   if (error) return [];
   return data || [];
}

export default async function DashboardPage() {
   const session = await auth();
   const tasks = await getTasks(session!.user!.id as string);
   const userName = session?.user?.name || session?.user?.email || '';

   return <TaskList initialTasks={tasks} userName={userName} />;
}
