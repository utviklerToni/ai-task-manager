'use client';

import { Subtask, Task, TaskStatus } from '@/types';
import { useState } from 'react';

interface TaskCardProps {
   task: Task;
   onStatusChange: (id: string, status: TaskStatus) => void;
   onEdit: () => void;
   onDelete: () => void;
}

const priorityStyles = {
   high: 'bg-red-50 text-red-700 border-red-100',
   medium: 'bg-yellow-50 text-yellow-700 border-yellow-100',
   low: 'bg-green-50 text-green-700 border-green-100',
};

const statusStyles = {
   todo: 'bg-gray-100 text-gray-600',
   'in-progress': 'bg-blue-100 text-blue-700',
   done: 'bg-green-100 text-green-700',
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
         className={`bg-white border rounded-xl p-4 transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}
      >
         <div className='flex items-start gap-3'>
            <button
               onClick={() =>
                  onStatusChange(
                     task.id,
                     task.status === 'done' ? 'todo' : 'done',
                  )
               }
               className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
               aria-label={
                  task.status === 'done' ? 'Mark as todo' : 'Mark as done'
               }
            >
               {task.status === 'done' && <span className='text-xs'>✓</span>}
            </button>

            {/* Content */}
            <div className='flex-1 min-w-0'>
               {/* Title row */}
               <div className='flex items-start justify-between gap-2'>
                  <h3
                     className={`font-medium text-gray-900 text-sm ${
                        task.status === 'done'
                           ? 'line-through text-gray-400'
                           : ''
                     }`}
                  >
                     {task.title}
                     {task.ai_generated && (
                        <span className='ml-2 text-xs text-purple-500'>
                           🤖 AI
                        </span>
                     )}
                  </h3>

                  {/* Actions */}
                  <div className='flex items-center gap-1 flex-shrink-0'>
                     <button
                        onClick={onEdit}
                        className='text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors'
                     >
                        Edit
                     </button>
                     <button
                        onClick={onDelete}
                        className='text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors'
                     >
                        Delete
                     </button>
                  </div>
               </div>

               {/* Description */}
               {task.description && (
                  <p className='text-xs text-gray-500 mt-1'>
                     {task.description}
                  </p>
               )}

               {/* Badges */}
               <div className='flex flex-wrap gap-2 mt-2'>
                  <span
                     className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityStyles[task.priority]}`}
                  >
                     {task.priority}
                  </span>
                  <span
                     className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[task.status]}`}
                  >
                     {task.status}
                  </span>
                  <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                     {task.category}
                  </span>
                  {task.estimated_minutes && (
                     <span className='text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600'>
                        ⏱ {task.estimated_minutes}m
                     </span>
                  )}
               </div>

               {/* Status selector */}
               <div className='mt-2'>
                  <select
                     value={task.status}
                     onChange={(e) =>
                        onStatusChange(task.id, e.target.value as TaskStatus)
                     }
                     className='text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  >
                     <option value='todo'>To Do</option>
                     <option value='in-progress'>In Progress</option>
                     <option value='done'>Done</option>
                  </select>
               </div>

               {/* Subtasks */}
               {subtasks.length > 0 && (
                  <div className='mt-3'>
                     <button
                        onClick={() => setExpanded(!expanded)}
                        className='text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1'
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
                                    className={`text-xs ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}
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
