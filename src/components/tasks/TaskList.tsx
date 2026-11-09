'use client';

import { Subtask, Task, TaskFilters, TaskPriority, TaskStatus } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { Bot, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import TaskGroupsPanel, { groupTasks } from './TaskGroupsPanel';
import AiAssistant from '../ai/AiAssistant';
import RandomQuote from '../ui/RandomQuote';

const STATUS_TABS: {
   key: TaskStatus;
   label: string;
   dot: string;
}[] = [
   { key: 'in-progress', label: 'In Progress', dot: 'bg-accent-amber' },
   { key: 'todo', label: 'To Do', dot: 'bg-accent-blue' },
   { key: 'done', label: 'Done', dot: 'bg-accent-green' },
];

interface TaskListProps {
   initialTasks: Task[];
   userName?: string;
}

export default function TaskList({ initialTasks, userName }: TaskListProps) {
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
   const [tabIndex, setTabIndex] = useState(0);
   const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
   const [deleteLoading, setDeleteLoading] = useState(false);
   const [selectMode, setSelectMode] = useState(false);
   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
   const [highlightId, setHighlightId] = useState<string | null>(null);

   const hasGroups = useMemo(() => groupTasks(tasks).length > 0, [tasks]);

   // Scroll to a task picked in the groups panel and flash its card.
   useEffect(() => {
      if (!highlightId) return;
      document
         .getElementById(`task-${highlightId}`)
         ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => setHighlightId(null), 2000);
      return () => clearTimeout(timer);
   }, [highlightId]);

   const firstName =
      userName?.split(' ')[0] || userName?.split('@')[0] || 'there';

   const currentTab = STATUS_TABS[tabIndex];

   const stats = useMemo(
      () => ({
         total: tasks.length,
         todo: tasks.filter((t) => t.status === 'todo').length,
         inProgress: tasks.filter((t) => t.status === 'in-progress').length,
         done: tasks.filter((t) => t.status === 'done').length,
      }),
      [tasks],
   );

   const carouselTasks = useMemo(
      () => tasks.filter((t) => t.status === currentTab.key),
      [tasks, currentTab],
   );

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
      if (!res.ok) {
         toast.error('Failed to create task');
         return;
      }
      const json = await res.json();
      if (json.task) {
         setTasks((prev) => [json.task, ...prev]);
         setShowForm(false);
         toast.success('Task created');
      }
   };

   const handleUpdate = async (id: string, data: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
      });
      if (!res.ok) {
         toast.error('Failed to update task');
         return;
      }
      const json = await res.json();
      if (json.task) {
         setTasks((prev) => prev.map((t) => (t.id === id ? json.task : t)));
         setEditTask(null);
         toast.success('Task updated');
      }
   };

   const handleDelete = (id: string) => {
      setDeleteIds([id]);
   };

   const confirmDelete = async () => {
      if (!deleteIds?.length) return;
      setDeleteLoading(true);
      const res = await fetch('/api/tasks', {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ids: deleteIds }),
      });
      if (!res.ok) {
         toast.error(
            deleteIds.length > 1 ? 'Failed to delete tasks' : 'Failed to delete task',
         );
         setDeleteIds(null);
         setDeleteLoading(false);
         return;
      }
      const { deletedIds }: { deletedIds: string[] } = await res.json();
      const removed = new Set(deletedIds);
      setTasks((prev) => prev.filter((t) => !removed.has(t.id)));
      setSelectedIds((prev) => new Set([...prev].filter((id) => !removed.has(id))));
      toast.success(
         removed.size === 1 ? 'Task deleted' : `${removed.size} tasks deleted`,
      );
      if (deleteIds.length > 1) setSelectMode(false);
      setDeleteIds(null);
      setDeleteLoading(false);
   };

   const toggleSelected = (id: string) => {
      setSelectedIds((prev) => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id);
         else next.add(id);
         return next;
      });
   };

   const exitSelectMode = () => {
      setSelectMode(false);
      setSelectedIds(new Set());
   };

   const allFilteredSelected =
      filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id));

   const handleSelectFromGroup = (id: string) => {
      // Clear filters so the picked task's card is on the board.
      setFilters({ status: 'all', priority: 'all', category: 'all', search: '' });
      setHighlightId(id);
   };

   const handleSubtasksChange = (id: string, subtasks: Subtask[]) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, subtasks } : t)));
   };

   const handleStatusChange = (id: string, status: TaskStatus) => {
      handleUpdate(id, { status });
   };

   const handleAiTasksCreated = (newTasks: Task[]) => {
      setTasks((prev) => [...newTasks, ...prev]);
      setShowAi(false);
   };

   return (
      <div className='max-w-7xl mx-auto'>
         {/* ── Hero ── */}
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Left — welcome + quote + actions */}
            <div className='flex flex-col gap-6'>
               <div>
                  <p className='text-xs text-content-muted uppercase tracking-widest mb-4'>
                     AI Task Manager
                  </p>
                  <h1 className='text-3xl font-bold text-content-primary leading-snug mb-4'>
                     Welcome back,
                     <br />
                     {firstName}.
                  </h1>
                  <RandomQuote />
               </div>

               {/* Action buttons */}
               <div className='flex gap-3 mt-9'>
                  <button
                     onClick={() => {
                        setShowForm(true);
                        setEditTask(null);
                        setShowAi(false);
                     }}
                     className='bg-accent-blue hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors'
                  >
                     + New Task
                  </button>
                  <button
                     onClick={() => {
                        setShowAi(!showAi);
                        setShowForm(false);
                        setEditTask(null);
                     }}
                     className='flex items-center gap-2 hover:text-purple-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors'
                  >
                     <span className='text-base leading-none'>
                        <Bot size={18} />
                     </span>
                     <span>AI Assistant</span>
                  </button>
               </div>

               {/* Stats below carousel */}
               <div className='flex gap-8 px-1'>
                  <div>
                     <p className='text-2xl font-bold text-content-primary'>
                        {stats.total}
                     </p>
                     <p className='text-xs text-content-muted mt-0.5'>Total</p>
                  </div>
                  <div>
                     <p className='text-2xl font-bold text-accent-amber'>
                        {stats.inProgress}
                     </p>
                     <p className='text-xs text-content-muted mt-0.5'>
                        In Progress
                     </p>
                  </div>
                  <div>
                     <p className='text-2xl font-bold text-accent-green'>
                        {stats.done}
                     </p>
                     <p className='text-xs text-content-muted mt-0.5'>Done</p>
                  </div>
                  <div>
                     <p className='text-2xl font-bold text-accent-blue'>
                        {stats.todo}
                     </p>
                     <p className='text-xs text-content-muted mt-0.5'>To Do</p>
                  </div>
               </div>
            </div>

            {/* Right — carousel */}
            <div className='flex flex-col gap-4'>
               <div className='bg-dark-card border border-dark-border rounded-xl flex flex-col h-80'>
                  {/* Carousel header */}
                  <div className='flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-dark-border'>
                     <div className='flex gap-1'>
                        {STATUS_TABS.map((tab, i) => (
                           <button
                              key={tab.key}
                              onClick={() => setTabIndex(i)}
                              className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                                 i === tabIndex
                                    ? 'bg-dark-hover text-content-primary'
                                    : 'text-content-muted hover:text-content-secondary'
                              }`}
                           >
                              {tab.label}
                              <span className='ml-1.5 tabular-nums opacity-50'>
                                 {
                                    tasks.filter((t) => t.status === tab.key)
                                       .length
                                 }
                              </span>
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Task rows */}
                  <div className='flex-1 overflow-y-auto min-h-0 divide-y divide-dark-border'>
                     {carouselTasks.length === 0 ? (
                        <div className='flex items-center justify-center py-12'>
                           <p className='text-content-muted text-sm'>
                              No {currentTab.label.toLowerCase()} tasks
                           </p>
                        </div>
                     ) : (
                        carouselTasks.map((task) => (
                           <div
                              key={task.id}
                              className='px-5 py-3 flex items-center gap-3 hover:bg-dark-hover transition-colors group cursor-default'
                           >
                              <span
                                 className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentTab.dot}`}
                              />
                              <span className='text-sm text-content-primary flex-1 truncate'>
                                 {task.title}
                              </span>
                              <div className='flex items-center gap-2 flex-shrink-0'>
                                 {task.estimated_minutes && (
                                    <span className='text-xs text-content-muted tabular-nums'>
                                       {task.estimated_minutes}m
                                    </span>
                                 )}
                                 <span
                                    className={`text-xs font-medium ${
                                       task.priority === 'high'
                                          ? 'text-accent-red'
                                          : task.priority === 'medium'
                                            ? 'text-accent-amber'
                                            : 'text-accent-green'
                                    }`}
                                 >
                                    {task.priority}
                                 </span>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  {/* Footer count */}
                  <div className='flex-shrink-0 px-5 py-3 border-t border-dark-border'>
                     <p className='text-xs text-content-muted'>
                        {carouselTasks.length}{' '}
                        {carouselTasks.length === 1 ? 'task' : 'tasks'} ·{' '}
                        {currentTab.label}
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* ── Divider ── */}
         <div className='border-t border-dark-border mb-6' />

         {/* AI assistant panel */}
         {showAi && (
            <div className='mb-4'>
               <AiAssistant onTasksCreated={handleAiTasksCreated} />
            </div>
         )}

         {/* ── Filters ── */}
         <div className='bg-dark-card border border-dark-border rounded-xl p-4 mb-4 flex flex-wrap gap-3'>
            <input
               type='text'
               placeholder='Search tasks...'
               value={filters.search}
               onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
               }
               className='bg-dark-hover text-content-primary border border-dark-border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-colors'
            />

            <select
               value={filters.status}
               onChange={(e) =>
                  setFilters((f) => ({
                     ...f,
                     status: e.target.value as TaskStatus | 'all',
                  }))
               }
               className='text-sm cursor-pointer'
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
               className='text-sm cursor-pointer'
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
               className='text-sm cursor-pointer'
            >
               {categories.map((c) => (
                  <option key={c} value={c}>
                     {c === 'all' ? 'All categories' : c}
                  </option>
               ))}
            </select>
         </div>

         <div
            className={
               hasGroups
                  ? 'grid gap-4 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] items-start'
                  : ''
            }
         >
            {hasGroups && (
               <aside className='lg:sticky lg:top-4'>
                  <TaskGroupsPanel
                     tasks={tasks}
                     onSelectTask={handleSelectFromGroup}
                  />
               </aside>
            )}

            <div>
               {/* Results count + bulk actions */}
               <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
                  <p className='text-sm text-content-muted'>
                     Showing {filtered.length} of {tasks.length} tasks
                  </p>

                  {tasks.length > 0 &&
                     (selectMode ? (
                        <div className='flex items-center gap-1'>
                           <button
                              onClick={() =>
                                 setSelectedIds(
                                    allFilteredSelected
                                       ? new Set()
                                       : new Set(filtered.map((t) => t.id)),
                                 )
                              }
                              className='text-xs text-content-secondary hover:text-content-primary px-2.5 py-1.5 rounded-md hover:bg-dark-hover transition-colors'
                           >
                              {allFilteredSelected
                                 ? 'Clear selection'
                                 : `Select all (${filtered.length})`}
                           </button>
                           <button
                              onClick={() => setDeleteIds([...selectedIds])}
                              disabled={selectedIds.size === 0}
                              className='text-xs font-medium text-white bg-accent-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-md transition-colors'
                           >
                              Delete selected ({selectedIds.size})
                           </button>
                           <button
                              onClick={exitSelectMode}
                              className='text-xs text-content-secondary hover:text-content-primary px-2.5 py-1.5 rounded-md hover:bg-dark-hover transition-colors'
                           >
                              Cancel
                           </button>
                        </div>
                     ) : (
                        <button
                           onClick={() => setSelectMode(true)}
                           className='text-xs text-content-secondary hover:text-content-primary px-2.5 py-1.5 rounded-md hover:bg-dark-hover transition-colors'
                        >
                           Select
                        </button>
                     ))}
               </div>

               {/* Empty state */}
               {filtered.length === 0 && (
                  <div className='text-center py-16 bg-dark-card rounded-xl border border-dark-border'>
                     <p className='text-4xl mb-3'>📋</p>
                     <p className='font-medium text-content-primary'>
                        No tasks found
                     </p>
                     <p className='text-sm text-content-muted mt-1'>
                        {tasks.length === 0
                           ? 'Create your first task to get started'
                           : 'Try adjusting your filters'}
                     </p>
                  </div>
               )}

               {/* Task grid */}
               <div className='grid gap-3 grid-cols-1 md:grid-cols-2 items-start'>
                  {filtered.map((task) => (
                     <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onEdit={() => setEditTask(task)}
                        onDelete={() => handleDelete(task.id)}
                        selectable={selectMode}
                        selected={selectedIds.has(task.id)}
                        onToggleSelect={() => toggleSelected(task.id)}
                        highlighted={highlightId === task.id}
                        onSubtasksChange={handleSubtasksChange}
                     />
                  ))}
               </div>
            </div>
         </div>

         {(showForm || editTask) && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
               <div className='bg-dark-card border border-dark-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto'>
                  <div className='flex items-center justify-between p-5 border-b border-dark-border'>
                     <h2 className='font-semibold text-content-primary'>
                        {editTask ? 'Edit task' : 'New task'}
                     </h2>
                     <button
                        onClick={() => {
                           setShowForm(false);
                           setEditTask(null);
                        }}
                        className='text-content-muted hover:text-content-primary transition-colors p-1 rounded hover:bg-dark-hover'
                     >
                        <X className='w-4 h-4' />
                     </button>
                  </div>
                  <div className='p-5'>
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
               </div>
            </div>
         )}

         {deleteIds && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
               <div className='bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm'>
                  <h3 className='text-content-primary font-semibold text-base mb-2'>
                     {deleteIds.length === 1
                        ? 'Delete task?'
                        : `Delete ${deleteIds.length} tasks?`}
                  </h3>
                  <p className='text-content-secondary text-sm mb-6'>
                     This action cannot be undone.
                  </p>
                  <div className='flex gap-3'>
                     <button
                        onClick={() => setDeleteIds(null)}
                        className='flex-1 bg-dark-hover hover:bg-dark-border text-content-primary font-medium py-2 rounded-lg text-sm transition-colors'
                     >
                        Cancel
                     </button>
                     <button
                        onClick={confirmDelete}
                        disabled={deleteLoading}
                        className='flex-1 bg-accent-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors'
                     >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
