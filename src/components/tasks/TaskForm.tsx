'use client';

import { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskFormProps {
   task?: Task;
   onSubmit: (data: Partial<Task>) => Promise<void>;
   onCancel: () => void;
}

export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
   const [title, setTitle] = useState(task?.title || '');
   const [description, setDescription] = useState(task?.description || '');
   const [priority, setPriority] = useState<TaskPriority>(
      task?.priority || 'medium',
   );
   const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
   const [category, setCategory] = useState(task?.category || 'general');
   const [estimatedMinutes, setEstimatedMinutes] = useState(
      task?.estimated_minutes?.toString() || '',
   );
   const [loading, setLoading] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      setLoading(true);

      await onSubmit({
         title: title.trim(),
         description: description.trim() || undefined,
         priority,
         status,
         category,
         estimated_minutes: estimatedMinutes
            ? parseInt(estimatedMinutes)
            : undefined,
      });

      setLoading(false);
   };

   const handleAiSuggest = async () => {
      if (!title.trim()) return;
      setAiLoading(true);

      try {
         const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'priority',
               title,
               description,
            }),
         });
         const data = await res.json();
         if (data.priority) setPriority(data.priority);
         if (data.estimated_minutes)
            setEstimatedMinutes(data.estimated_minutes.toString());
      } catch {
         console.error('AI suggestion failed');
      }

      setAiLoading(false);
   };

   return (
      <div className='bg-dark-card border border-dark-border rounded-xl p-5'>
         <h2 className='font-semibold text-content-primary mb-4'>
            {task ? 'Edit task' : 'New task'}
         </h2>

         <form onSubmit={handleSubmit} className='space-y-3'>
            {/* Title */}
            <div>
               <label className='block text-sm font-medium text-content-primary mb-1'>
                  Title <span className='text-red-400'>*</span>
               </label>
               <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='What needs to be done?'
                  required
                  className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500'
               />
            </div>

            {/* Description */}
            <div>
               <label className='block text-sm font-medium text-content-primary mb-1'>
                  Description
               </label>
               <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Optional details...'
                  rows={2}
                  className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
               />
            </div>

            {/* Priority + Status + Category */}
            <div className='grid grid-cols-3 gap-3'>
               <div>
                  <label className='block text-sm font-medium text-content-primary mb-1'>
                     Priority
                  </label>
                  <select
                     value={priority}
                     onChange={(e) =>
                        setPriority(e.target.value as TaskPriority)
                     }
                     className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                     <option value='low'>Low</option>
                     <option value='medium'>Medium</option>
                     <option value='high'>High</option>
                  </select>
               </div>

               <div>
                  <label className='block text-sm font-medium text-content-primary mb-1'>
                     Status
                  </label>
                  <select
                     value={status}
                     onChange={(e) => setStatus(e.target.value as TaskStatus)}
                     className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                     <option value='todo'>To Do</option>
                     <option value='in-progress'>In Progress</option>
                     <option value='done'>Done</option>
                  </select>
               </div>

               <div>
                  <label className='block text-sm font-medium text-content-primary mb-1'>
                     Category
                  </label>
                  <select
                     value={category}
                     onChange={(e) => setCategory(e.target.value)}
                     className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                     <option value='general'>General</option>
                     <option value='work'>Work</option>
                     <option value='personal'>Personal</option>
                     <option value='health'>Health</option>
                     <option value='learning'>Learning</option>
                  </select>
               </div>
            </div>

            {/* Estimated minutes */}
            <div>
               <label className='block text-sm font-medium text-content-primary mb-1'>
                  Estimated minutes
               </label>
               <input
                  type='number'
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder='e.g. 30'
                  min={0}
                  className='w-full bg-dark-card text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500'
               />
            </div>

            {/* AI suggest button */}
            <button
               type='button'
               onClick={handleAiSuggest}
               disabled={aiLoading || !title.trim()}
               className='w-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50'
            >
               {aiLoading
                  ? '🤖 Thinking...'
                  : '🤖 AI: Suggest priority & time estimate'}
            </button>

            {/* Submit + Cancel */}
            <div className='flex gap-3 pt-1'>
               <button
                  type='submit'
                  disabled={loading || !title.trim()}
                  className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {loading
                     ? 'Saving...'
                     : task
                       ? 'Save changes'
                       : 'Create task'}
               </button>
               <button
                  type='button'
                  onClick={onCancel}
                  className='flex-1 border border-dark-border hover:bg-dark-hover text-content-secondary font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  Cancel
               </button>
            </div>
         </form>
      </div>
   );
}
