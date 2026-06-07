'use client';

import { Task } from '@/types';
import { useState } from 'react';

interface AiAssistantProps {
   onTasksCreated: (tasks: Task[]) => void;
}

export default function AiAssistant({ onTasksCreated }: AiAssistantProps) {
   const [activeTab, setActiveTab] = useState<'natural' | 'breakdown'>(
      'natural',
   );

   // Natural language state
   const [input, setInput] = useState('');
   const [nlLoading, setNlLoading] = useState(false);
   const [nlMessage, setNlMessage] = useState('');

   // Breakdown state
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
         // Step 1 — ask Claude to generate task structure
         const aiRes = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               action: 'natural-language',
               input,
            }),
         });
         const aiData = await aiRes.json();

         if (!aiData.tasks?.length) {
            setNlMessage(
               'No tasks could be generated. Try being more specific.',
            );
            setNlLoading(false);
            return;
         }

         // Step 2 — save each AI-generated task to the database
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
               `✅ Created ${createdTasks.length} task${createdTasks.length > 1 ? 's' : ''}`,
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
      <div className='bg-dark-card border border-dark-border2 rounded-xl p-5'>
         {/* Header */}
         <div className='flex items-center gap-2 mb-4'>
            <span className='text-xl'>🤖</span>
            <h2 className='font-semibold text-purple-400'>AI Assistant</h2>
         </div>

         {/* Tabs */}
         <div className='flex gap-2 mb-4'>
            {[
               { id: 'natural', label: '💬 Natural Language' },
               { id: 'breakdown', label: '🔧 Task Breakdown' },
            ].map((tab) => (
               <button
                  key={tab.id}
                  onClick={() =>
                     setActiveTab(tab.id as 'natural' | 'breakdown')
                  }
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                     activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-dark-card text-purple-600 border border-purple-200 hover:bg-purple-50'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         {/* Natural Language Tab */}
         {activeTab === 'natural' && (
            <div className='space-y-3'>
               <p className='text-sm text-purple-700'>
                  Describe what you need to do and AI will create structured
                  tasks for you.
               </p>

               <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='e.g. Plan a product launch including marketing, dev work and team coordination'
                  rows={3}
                  className='w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-dark-card resize-none'
               />

               <button
                  onClick={handleNaturalLanguage}
                  disabled={nlLoading || !input.trim()}
                  className='w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {nlLoading ? '🤖 Creating tasks...' : '✨ Generate tasks'}
               </button>

               {nlMessage && (
                  <p
                     className={`text-sm ${
                        nlMessage.startsWith('✅')
                           ? 'text-green-600'
                           : 'text-red-500'
                     }`}
                  >
                     {nlMessage}
                  </p>
               )}
            </div>
         )}

         {/* Breakdown Tab */}
         {activeTab === 'breakdown' && (
            <div className='space-y-3'>
               <p className='text-sm text-purple-700'>
                  Enter a task and AI will break it into actionable subtasks.
               </p>

               <input
                  type='text'
                  value={breakdownTitle}
                  onChange={(e) => setBreakdownTitle(e.target.value)}
                  placeholder='e.g. Build a login system with JWT authentication'
                  className='w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-dark-card'
               />

               <button
                  onClick={handleBreakdown}
                  disabled={breakdownLoading || !breakdownTitle.trim()}
                  className='w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 rounded-lg text-sm transition-colors'
               >
                  {breakdownLoading
                     ? '🤖 Breaking down...'
                     : '🔧 Break down task'}
               </button>

               {/* Breakdown result */}
               {breakdownResult && (
                  <div className='bg-dark-card border border-purple-200 rounded-lg p-4 space-y-3'>
                     <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium text-content-primary'>
                           Suggested subtasks:
                        </p>
                        {breakdownResult.estimated_minutes && (
                           <span className='text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full'>
                              ⏱ ~{breakdownResult.estimated_minutes} min
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
                                 className='flex items-center gap-2 text-sm text-content-secondary'
                              >
                                 <span className='text-purple-400'>•</span>
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
                        className='w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 rounded-lg text-sm transition-colors'
                     >
                        {createLoading
                           ? 'Creating...'
                           : '✅ Create task with these subtasks'}
                     </button>
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
