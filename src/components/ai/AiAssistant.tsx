'use client';

import { Task } from '@/types';
import { useState } from 'react';
import { Sparkles, Wrench } from 'lucide-react';

interface AiAssistantProps {
   onTasksCreated: (tasks: Task[]) => void;
}

const inputClass =
   'w-full bg-dark-hover text-content-primary border border-dark-border rounded-lg px-3 py-2 text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-colors';

export default function AiAssistant({ onTasksCreated }: AiAssistantProps) {
   const [activeTab, setActiveTab] = useState<'natural' | 'breakdown'>(
      'natural',
   );

   const [input, setInput] = useState('');
   const [nlLoading, setNlLoading] = useState(false);
   const [nlMessage, setNlMessage] = useState('');

   const [breakdownTitle, setBreakdownTitle] = useState('');
   const [breakdownLoading, setBreakdownLoading] = useState(false);
   const [breakdownResult, setBreakdownResult] = useState<{
      subtasks: Array<{ id: string; title: string; completed: boolean }>;
      estimated_minutes?: number;
      message?: string;
   } | null>(null);
   const [createLoading, setCreateLoading] = useState(false);

   const handleNaturalLanguage = async () => {
      if (!input.trim()) return;
      setNlLoading(true);
      setNlMessage('');

      try {
         const aiRes = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'natural-language', input }),
         });
         const aiData = await aiRes.json();

         if (!aiData.tasks?.length) {
            setNlMessage('No tasks generated. Try being more specific.');
            setNlLoading(false);
            return;
         }

         const createdTasks: Task[] = [];
         for (const taskData of aiData.tasks) {
            const res = await fetch('/api/tasks', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ ...taskData, ai_generated: true }),
            });
            const json = await res.json();
            if (json.task) createdTasks.push(json.task);
         }

         if (createdTasks.length > 0) {
            onTasksCreated(createdTasks);
            setInput('');
            setNlMessage(
               `Created ${createdTasks.length} task${createdTasks.length > 1 ? 's' : ''}`,
            );
         }
      } catch {
         setNlMessage('Something went wrong. Please try again.');
      }

      setNlLoading(false);
   };

   const handleBreakdown = async () => {
      if (!breakdownTitle.trim()) return;
      setBreakdownLoading(true);
      setBreakdownResult(null);

      try {
         const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'breakdown',
               title: breakdownTitle,
            }),
         });
         const data = await res.json();
         setBreakdownResult(data);
      } catch {
         setBreakdownResult(null);
      }

      setBreakdownLoading(false);
   };

   const handleCreateFromBreakdown = async () => {
      if (!breakdownResult) return;
      setCreateLoading(true);

      try {
         const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               title: breakdownTitle,
               subtasks: breakdownResult.subtasks,
               estimated_minutes: breakdownResult.estimated_minutes,
               ai_generated: true,
            }),
         });
         const json = await res.json();
         if (json.task) {
            onTasksCreated([json.task]);
            setBreakdownTitle('');
            setBreakdownResult(null);
         }
      } catch {
         console.error('Failed to create task from breakdown');
      }

      setCreateLoading(false);
   };

   return (
      <div className='bg-dark-card border border-dark-border rounded-xl p-5'>
         {/* Header */}
         <div className='flex items-center gap-2 mb-4'>
            <Sparkles className='w-4 h-4 text-accent-purple' />
            <h2 className='font-semibold text-content-primary text-sm'>
               AI Assistant
            </h2>
         </div>

         {/* Tabs */}
         <div className='flex gap-1.5 mb-4'>
            {[
               { id: 'natural', label: 'Natural Language', icon: Sparkles },
               { id: 'breakdown', label: 'Task Breakdown', icon: Wrench },
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() =>
                     setActiveTab(tab.id as 'natural' | 'breakdown')
                  }
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                     activeTab === tab.id
                        ? 'bg-accent-purple text-white'
                        : 'bg-dark-hover text-content-secondary hover:text-content-primary'
                  }`}
               >
                  <tab.icon className='w-3 h-3' />
                  {tab.label}
               </button>
            ))}
         </div>

         {activeTab === 'natural' && (
            <div className='space-y-3'>
               <p className='text-xs text-content-muted'>
                  Describe what you need to do and AI will create structured
                  tasks.
               </p>

               <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='e.g. Plan a product launch including marketing, dev work and team coordination'
                  rows={3}
                  className={`${inputClass} resize-none`}
               />

               <button
                  onClick={handleNaturalLanguage}
                  disabled={nlLoading || !input.trim()}
                  className='w-full bg-accent-purple hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {nlLoading ? 'Generating...' : '✦ Generate tasks'}
               </button>

               {nlMessage && (
                  <p
                     className={`text-xs ${
                        nlMessage.startsWith('Created')
                           ? 'text-accent-green'
                           : 'text-accent-red'
                     }`}
                  >
                     {nlMessage}
                  </p>
               )}
            </div>
         )}

         {activeTab === 'breakdown' && (
            <div className='space-y-3'>
               <p className='text-xs text-content-muted'>
                  Enter a task and AI will break it into actionable subtasks.
               </p>

               <input
                  type='text'
                  value={breakdownTitle}
                  onChange={(e) => setBreakdownTitle(e.target.value)}
                  placeholder='e.g. Build a login system with JWT authentication'
                  className={inputClass}
               />

               <button
                  onClick={handleBreakdown}
                  disabled={breakdownLoading || !breakdownTitle.trim()}
                  className='w-full bg-accent-purple hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {breakdownLoading ? 'Breaking down...' : '✦ Break down task'}
               </button>

               {breakdownResult && (
                  <div className='bg-dark-hover border border-dark-border rounded-lg p-4 space-y-3'>
                     <div className='flex items-center justify-between'>
                        <p className='text-xs font-medium text-content-secondary'>
                           Suggested subtasks
                        </p>
                        {breakdownResult.estimated_minutes && (
                           <span className='text-xs text-content-muted tabular-nums'>
                              ~{breakdownResult.estimated_minutes} min
                           </span>
                        )}
                     </div>

                     <ul className='space-y-1.5'>
                        {breakdownResult.subtasks?.map(
                           (s: {
                              id: string;
                              title: string;
                              completed: boolean;
                           }) => (
                              <li
                                 key={s.id}
                                 className='flex items-center gap-2 text-sm text-content-primary'
                              >
                                 <span className='w-1 h-1 rounded-full bg-accent-purple flex-shrink-0' />
                                 {s.title}
                              </li>
                           ),
                        )}
                     </ul>

                     {breakdownResult.message && (
                        <p className='text-xs text-content-muted italic'>
                           {breakdownResult.message}
                        </p>
                     )}

                     <button
                        onClick={handleCreateFromBreakdown}
                        disabled={createLoading}
                        className='w-full bg-accent-green hover:bg-green-600 disabled:opacity-40 text-dark-page font-medium py-2 rounded-lg text-sm transition-colors'
                     >
                        {createLoading
                           ? 'Creating...'
                           : 'Create task with subtasks'}
                     </button>
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
