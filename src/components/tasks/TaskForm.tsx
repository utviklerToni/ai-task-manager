'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskFormProps {
   task?: Task;
   onSubmit: (data: Partial<Task>) => Promise<void>;
   onCancel: () => void;
}

const inputClass =
   'w-full bg-dark-hover text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-colors';

const labelClass = 'block text-sm text-content-secondary mb-1.5';

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
            body: JSON.stringify({ action: 'priority', title, description }),
         });
         const data = await res.json();
         if (data.priority) setPriority(data.priority);
         if (data.estimated_minutes)
            setEstimatedMinutes(data.estimated_minutes.toString());
      } catch {
         toast.error('AI suggestion failed. Try again.');
      }

      setAiLoading(false);
   };

   return (
      <form onSubmit={handleSubmit} className='space-y-3'>
            <div>
               <label className={labelClass}>
                  Title <span className='text-accent-red'>*</span>
               </label>
               <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='What needs to be done?'
                  required
                  className={inputClass}
               />
            </div>

            <div>
               <label className={labelClass}>Description</label>
               <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='Optional details...'
                  rows={2}
                  className={`${inputClass} resize-none`}
               />
            </div>

            <div className='grid grid-cols-3 gap-3'>
               <div>
                  <label className={labelClass}>Priority</label>
                  <select
                     value={priority}
                     onChange={(e) =>
                        setPriority(e.target.value as TaskPriority)
                     }
                     className='w-full text-sm cursor-pointer'
                  >
                     <option value='low'>Low</option>
                     <option value='medium'>Medium</option>
                     <option value='high'>High</option>
                  </select>
               </div>

               <div>
                  <label className={labelClass}>Status</label>
                  <select
                     value={status}
                     onChange={(e) => setStatus(e.target.value as TaskStatus)}
                     className='w-full text-sm cursor-pointer'
                  >
                     <option value='todo'>To Do</option>
                     <option value='in-progress'>In Progress</option>
                     <option value='done'>Done</option>
                  </select>
               </div>

               <div>
                  <label className={labelClass}>Category</label>
                  <select
                     value={category}
                     onChange={(e) => setCategory(e.target.value)}
                     className='w-full text-sm cursor-pointer'
                  >
                     <option value='general'>General</option>
                     <option value='work'>Work</option>
                     <option value='personal'>Personal</option>
                     <option value='health'>Health</option>
                     <option value='learning'>Learning</option>
                  </select>
               </div>
            </div>

            <div>
               <label className={labelClass}>Estimated minutes</label>
               <input
                  type='number'
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder='e.g. 30'
                  min={0}
                  className={inputClass}
               />
            </div>

            <button
               type='button'
               onClick={handleAiSuggest}
               disabled={aiLoading || !title.trim()}
               className='w-full border border-accent-purple text-accent-purple hover:bg-purple-950 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-40'
            >
               {aiLoading ? 'Thinking...' : '✦ AI: Suggest priority & estimate'}
            </button>

            <div className='flex gap-2 pt-1'>
               <button
                  type='submit'
                  disabled={loading || !title.trim()}
                  className='flex-1 bg-accent-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {loading ? (
                     <Loader2 className='w-4 h-4 animate-spin mx-auto' />
                  ) : task ? (
                     'Save changes'
                  ) : (
                     'Create task'
                  )}
               </button>
               <button
                  type='button'
                  onClick={onCancel}
                  className='flex-1 bg-dark-hover hover:bg-dark-border text-content-secondary font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  Cancel
               </button>
            </div>
      </form>
   );
}
