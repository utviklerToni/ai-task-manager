'use client';

import { Subtask, Task, TaskStatus } from '@/types';
import { Bot } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
   task: Task;
   onStatusChange: (id: string, status: TaskStatus) => void;
   onEdit: () => void;
   onDelete: () => void;
}

const priorityStyles = {
   high: 'text-xs px-2 py-0.5 rounded-full font-medium bg-red-950 text-red-400 border border-red-900',
   medium:
      'text-xs px-2 py-0.5 rounded-full font-medium bg-amber-950 text-amber-400 border border-amber-900',
   low: 'text-xs px-2 py-0.5 rounded-full font-medium bg-green-950 text-green-400 border border-green-900',
};

const statusStyles = {
   todo: 'text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-900 text-zinc-400 border border-zinc-800',
   'in-progress':
      'text-xs px-2 py-0.5 rounded-full font-medium bg-blue-950 text-blue-400 border border-blue-900',
   done: 'text-xs px-2 py-0.5 rounded-full font-medium bg-green-950 text-green-400 border border-green-900',
};

export default function TaskCard({
   task,
   onStatusChange,
   onEdit,
   onDelete,
}: TaskCardProps) {
   const [expanded, setExpanded] = useState(false);
   const [subtasks, setSubTasks] = useState<Subtask[]>(task.subtasks || []);

   const toggleSubtask = async (subtaskId: string) => {
      const updated = subtasks.map((s) =>
         s.id === subtaskId ? { ...s, completed: !s.completed } : s,
      );
      setSubTasks(updated);

      await fetch(`/api/tasks/${task.id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ subtasks: updated }),
      });
   };

   const completedCount = subtasks.filter((s) => s.completed).length;

   return (
      <div
         className={`bg-dark-card border border-dark-border rounded-xl p-4 transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}
      >
         <div className='flex items-start gap-3'>
            <button
               onClick={() =>
                  onStatusChange(
                     task.id,
                     task.status === 'done' ? 'todo' : 'done',
                  )
               }
               className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-dark-border hover:border-green-400'}`}
               aria-label={
                  task.status === 'done' ? 'Mark as todo' : 'Mark as done'
               }
            >
               {task.status === 'done' && <span className='text-xs'>✓</span>}
            </button>

            {/* Content */}
            <div className='flex-1 min-w-0'>
               {/* Title row */}
               <h3
                  className={`font-medium text-content-primary text-sm ${
                     task.status === 'done'
                        ? 'line-through text-content-muted'
                        : ''
                  }`}
               >
                  {task.title}
                  {task.ai_generated && (
                     <span className='ml-2 inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded-full'>
                        <Bot size={14} />
                        <span>AI</span>
                     </span>
                  )}
               </h3>

               {/* Description */}
               {task.description && (
                  <p className='text-xs text-content-muted mt-1'>
                     {task.description}
                  </p>
               )}

               {/* Badges */}
               <div className='flex flex-wrap gap-2 mt-2'>
                  <span className={priorityStyles[task.priority]}>
                     {task.priority}
                  </span>
                  <span className={statusStyles[task.status]}>
                     {task.status}
                  </span>
                  <span className='text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800'>
                     {task.category}
                  </span>
                  {task.estimated_minutes && (
                     <span className='text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400'>
                        ⏱ {task.estimated_minutes}m
                     </span>
                  )}
               </div>

               {/* Footer row */}
               <div className='border-t border-dark-border mt-3 pt-3 flex items-center justify-between'>
                  <select
                     value={task.status}
                     onChange={(e) =>
                        onStatusChange(task.id, e.target.value as TaskStatus)
                     }
                     className='text-xs cursor-pointer'
                  >
                     <option value='todo'>To Do</option>
                     <option value='in-progress'>In Progress</option>
                     <option value='done'>Done</option>
                  </select>

                  <div className='flex items-center gap-1'>
                     <button
                        onClick={onEdit}
                        className='text-xs text-content-secondary hover:text-accent-blue px-2 py-1 rounded hover:bg-dark-hover transition-colors'
                     >
                        Edit
                     </button>
                     <button
                        onClick={onDelete}
                        className='text-xs text-content-secondary hover:text-accent-red px-2 py-1 rounded hover:bg-dark-hover transition-colors'
                     >
                        Delete
                     </button>
                  </div>
               </div>

               {/* Subtasks */}
               {subtasks.length > 0 && (
                  <div className='mt-3'>
                     <button
                        onClick={() => setExpanded(!expanded)}
                        className='text-xs text-content-muted hover:text-content-primary flex items-center gap-1'
                     >
                        {expanded ? '▼' : '▶'} Subtasks ({completedCount}/
                        {subtasks.length})
                     </button>

                     {expanded && (
                        <div className='mt-2 space-y-1.5'>
                           {subtasks.map((subtask) => (
                              <label
                                 key={subtask.id}
                                 className='flex items-center gap-2 cursor-pointer'
                              >
                                 <input
                                    type='checkbox'
                                    checked={subtask.completed}
                                    onChange={() => toggleSubtask(subtask.id)}
                                    className='rounded text-blue-500'
                                 />
                                 <span
                                    className={`text-xs ${subtask.completed ? 'line-through text-content-muted' : 'text-content-secondary'}`}
                                 >
                                    {subtask.title}
                                 </span>
                              </label>
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
