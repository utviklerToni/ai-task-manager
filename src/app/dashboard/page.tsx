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

   return (
      <div>
         <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900'>My Tasks</h1>
            <p className='text-gray-500 text-sm mt-1'>
               Manage and track your tasks with AI assistance
            </p>
         </div>
         <TaskList initialTasks={tasks} />
      </div>
   );
}
