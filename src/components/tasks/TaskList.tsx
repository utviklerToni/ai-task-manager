'use client';

import { Task, TaskFilters, TaskPriority, TaskStatus } from '@/types';
import { useMemo, useState } from 'react';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import AiAssistant from '../ai/AiAssistant';

interface TaskListProps {
   initialTasks: Task[];
}

export default function TaskList({ initialTasks }: TaskListProps) {
   const [tasks, setTasks] = useState<Task[]>(initialTasks);
   const [filters, setFilters] = useState<TaskFilters>({
      status: 'all',
      priority: 'all',
      category: 'all',
      search: '',
   });
   const [showForm, setShowForm] = useState(false);
   const [editTask, setEditTask] = useState<Task | null>(null);
   const [showAi, setShowAi] = useState(false);

   // Stats — derived from live task state
   const stats = useMemo(
      () => ({
         total: tasks.length,
         todo: tasks.filter((t) => t.status === 'todo').length,
         inProgress: tasks.filter((t) => t.status === 'in-progress').length,
         done: tasks.filter((t) => t.status === 'done').length,
      }),
      [tasks],
   );

   // Filtered tasks — derived from tasks + filters
   const filtered = useMemo(() => {
      return tasks.filter((t) => {
         if (filters.status !== 'all' && t.status !== filters.status)
            return false;
         if (filters.priority !== 'all' && t.priority !== filters.priority)
            return false;
         if (filters.category !== 'all' && t.category !== filters.category)
            return false;
         if (
            filters.search &&
            !t.title.toLowerCase().includes(filters.search.toLowerCase())
         )
            return false;
         return true;
      });
   }, [tasks, filters]);

   // Categories derived from actual task data
   const categories = useMemo(
      () => ['all', ...Array.from(new Set(tasks.map((t) => t.category)))],
      [tasks],
   );

   const handleCreate = async (data: Partial<Task>) => {
      const res = await fetch('/api/tasks', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.task) {
         setTasks((prev) => [json.task, ...prev]);
         setShowForm(false);
      }
   };

   const handleUpdate = async (id: string, data: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.task) {
         setTasks((prev) => prev.map((t) => (t.id === id ? json.task : t)));
         setEditTask(null);
      }
   };

   const handleDelete = async (id: string) => {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
   };

   const handleStatusChange = (id: string, status: TaskStatus) => {
      handleUpdate(id, { status });
   };

   const handleAiTasksCreated = (newTasks: Task[]) => {
      setTasks((prev) => [...newTasks, ...prev]);
      setShowAi(false);
   };

   return (
      <div>
         {/* Stats */}
         <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            {[
               {
                  label: 'Total',
                  value: stats.total,
                  color: 'bg-gray-100 text-gray-700',
               },
               {
                  label: 'To Do',
                  value: stats.todo,
                  color: 'bg-blue-50 text-blue-700',
               },
               {
                  label: 'In Progress',
                  value: stats.inProgress,
                  color: 'bg-yellow-50 text-yellow-700',
               },
               {
                  label: 'Done',
                  value: stats.done,
                  color: 'bg-green-50 text-green-700',
               },
            ].map((stat) => (
               <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                  <p className='text-sm font-medium mt-0.5'>{stat.label}</p>
               </div>
            ))}
         </div>

         {/* Action buttons */}
         <div className='flex flex-wrap gap-3 mb-4'>
            <button
               onClick={() => {
                  setShowForm(true);
                  setEditTask(null);
               }}
               className='bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors'
            >
               + New Task
            </button>
            <button
               onClick={() => setShowAi(!showAi)}
               className='bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors'
            >
               🤖 AI Assistant
            </button>
         </div>

         {showAi && (
            <div className='mb-4'>
               <AiAssistant onTasksCreated={handleAiTasksCreated} />
            </div>
         )}

         {/* Task form  */}
         {(showForm || editTask) && (
            <div className='mb-4'>
               <TaskForm
                  task={editTask || undefined}
                  onSubmit={
                     editTask
                        ? (data) => handleUpdate(editTask.id, data)
                        : handleCreate
                  }
                  onCancel={() => {
                     setShowForm(false);
                     setEditTask(null);
                  }}
               />
            </div>
         )}

         {/* Filters */}
         <div className='bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3'>
            <input
               type='text'
               placeholder='Search tasks...'
               value={filters.search}
               onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
               }
               className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500'
            />

            <select
               value={filters.status}
               onChange={(e) =>
                  setFilters((f) => ({
                     ...f,
                     status: e.target.value as TaskStatus | 'all',
                  }))
               }
               className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
               <option value='all'>All status</option>
               <option value='todo'>To Do</option>
               <option value='in-progress'>In Progress</option>
               <option value='done'>Done</option>
            </select>

            <select
               value={filters.priority}
               onChange={(e) =>
                  setFilters((f) => ({
                     ...f,
                     priority: e.target.value as TaskPriority | 'all',
                  }))
               }
               className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
               <option value='all'>All priorities</option>
               <option value='high'>High</option>
               <option value='medium'>Medium</option>
               <option value='low'>Low</option>
            </select>

            <select
               value={filters.category}
               onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
               }
               className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
               {categories.map((c) => (
                  <option key={c} value={c}>
                     {c === 'all' ? 'All categories' : c}
                  </option>
               ))}
            </select>
         </div>

         {/* Results count */}
         <p className='text-sm text-gray-500 mb-3'>
            Showing {filtered.length} of {tasks.length} tasks
         </p>

         {/* Empty state */}
         {filtered.length === 0 && (
            <div className='text-center py-16 bg-white rounded-xl border border-gray-200'>
               <p className='text-4xl mb-3'>📋</p>
               <p className='font-medium text-gray-700'>No tasks found</p>
               <p className='text-sm text-gray-400 mt-1'>
                  {tasks.length === 0
                     ? 'Create your first task to get started'
                     : 'Try adjusting your filters'}
               </p>
            </div>
         )}

         {/* Task grid */}
         <div className='grid gap-3'>
            {filtered.map((task) => (
               <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={() => setEditTask(task)}
                  onDelete={() => handleDelete(task.id)}
               />
            ))}
         </div>
      </div>
   );
}
