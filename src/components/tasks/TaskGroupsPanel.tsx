'use client';

import { Task } from '@/types';
import {
   Briefcase,
   GraduationCap,
   HeartPulse,
   ListTodo,
   LucideIcon,
   Target,
   User,
} from 'lucide-react';
import { useMemo } from 'react';

interface TaskGroupsPanelProps {
   tasks: Task[];
   onSelectTask: (taskId: string) => void;
}

interface Group {
   id: string;
   title: string;
   tasks: Task[];
   createdAt: string;
}

// Full class strings so Tailwind keeps them; each group gets the next colour.
const GROUP_COLORS = [
   { text: 'text-accent-cyan', bg: 'bg-accent-cyan/15' },
   { text: 'text-accent-anthropic', bg: 'bg-accent-anthropic/15' },
   { text: 'text-accent-purple', bg: 'bg-accent-purple/15' },
   { text: 'text-accent-amber', bg: 'bg-accent-amber/15' },
   { text: 'text-accent-green', bg: 'bg-accent-green/15' },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
   work: Briefcase,
   personal: User,
   health: HeartPulse,
   learning: GraduationCap,
};

export function groupTasks(tasks: Task[]): Group[] {
   const groups = new Map<string, Group>();
   for (const task of tasks) {
      if (!task.group_id || !task.group) continue;
      const group = groups.get(task.group_id) ?? {
         id: task.group_id,
         title: task.group.title,
         tasks: [],
         createdAt: task.created_at,
      };
      group.tasks.push(task);
      if (task.created_at > group.createdAt) group.createdAt = task.created_at;
      groups.set(task.group_id, group);
   }
   return Array.from(groups.values())
      .map((g) => ({
         ...g,
         tasks: g.tasks.sort(
            (a, b) => (a.group_position ?? 0) - (b.group_position ?? 0),
         ),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function TaskGroupsPanel({
   tasks,
   onSelectTask,
}: TaskGroupsPanelProps) {
   const groups = useMemo(() => groupTasks(tasks), [tasks]);
   if (groups.length === 0) return null;

   return (
      <section
         aria-label='Task groups'
         className='bg-dark-card border border-dark-border rounded-xl overflow-hidden'
      >
         <h2 className='px-5 py-4 border-b border-dark-border text-sm font-semibold text-content-primary'>
            Task groups
         </h2>

         <div className='divide-y divide-dark-border'>
            {groups.map((group, gi) => {
               const color = GROUP_COLORS[gi % GROUP_COLORS.length];
               const done = group.tasks.filter(
                  (t) => t.status === 'done',
               ).length;

               return (
                  <div key={group.id} className='px-4 py-3'>
                     {/* Group row */}
                     <div className='flex items-center gap-3 py-1.5'>
                        <span
                           className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color.bg} ${color.text}`}
                        >
                           <Target className='w-4 h-4' />
                        </span>
                        <span className='flex-1 min-w-0 break-words text-sm text-content-primary'>
                           {group.title}
                        </span>
                        <span
                           className='text-xs text-content-secondary tabular-nums'
                           title={`${done} of ${group.tasks.length} tasks done`}
                        >
                           {done}/{group.tasks.length}
                        </span>
                     </div>

                     {/* Task rows, joined by a tree line */}
                     <ul className='ml-4'>
                        {group.tasks.map((task, ti) => {
                           const Icon =
                              CATEGORY_ICONS[task.category] ?? ListTodo;
                           const isLast = ti === group.tasks.length - 1;
                           const subtasks = task.subtasks || [];
                           const subDone = subtasks.filter(
                              (s) => s.completed,
                           ).length;
                           const isDone = task.status === 'done';

                           return (
                              <li key={task.id} className='relative pl-6'>
                                 {/* Tree line: a straight tick for each row, curved into the last one */}
                                 <span
                                    aria-hidden
                                    className={`absolute left-0 top-0 h-[18px] w-3.5 border-l border-b border-dark-border2 ${
                                       isLast ? 'rounded-bl-lg' : ''
                                    }`}
                                 />
                                 {!isLast && (
                                    <span
                                       aria-hidden
                                       className='absolute left-0 top-[18px] bottom-0 border-l border-dark-border2'
                                    />
                                 )}
                                 <button
                                    type='button'
                                    onClick={() => onSelectTask(task.id)}
                                    className='w-full flex items-start gap-2.5 py-2 px-2 rounded-md text-left hover:bg-dark-hover transition-colors'
                                 >
                                    <Icon
                                       className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color.text}`}
                                    />
                                    <span
                                       className={`flex-1 min-w-0 break-words text-sm ${
                                          isDone
                                             ? 'line-through text-content-muted'
                                             : 'text-content-primary'
                                       }`}
                                    >
                                       <span className='text-content-muted mr-1.5 tabular-nums no-underline inline-block'>
                                          {ti + 1}.
                                       </span>
                                       {task.title}
                                    </span>
                                    {subtasks.length > 0 && (
                                       <span
                                          className='text-xs text-content-secondary tabular-nums'
                                          title={`${subDone} of ${subtasks.length} subtasks done`}
                                       >
                                          {subDone}/{subtasks.length}
                                       </span>
                                    )}
                                 </button>
                              </li>
                           );
                        })}
                     </ul>
                  </div>
               );
            })}
         </div>
      </section>
   );
}
