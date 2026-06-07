import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckSquare, Bot, Target, MessageSquare } from 'lucide-react';

export default async function HomePage() {
   const session = await auth();
   if (session) redirect('/dashboard');

   return (
      <div className='min-h-screen bg-dark-page flex items-center justify-center p-4'>
         <div className='text-center max-w-2xl w-full'>

            {/* Logo mark */}
            <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-dark-card border border-dark-border mb-6'>
               <CheckSquare className='w-7 h-7 text-accent-blue' />
            </div>

            <h1 className='text-4xl font-bold text-content-primary mb-4 leading-tight'>
               AI Task Manager
            </h1>

            <p className='text-lg text-content-secondary mb-8 leading-relaxed'>
               Manage your tasks smarter with AI-powered breakdowns, priority
               suggestions, and natural language task creation.
            </p>

            <div className='flex gap-3 justify-center'>
               <Link
                  href='/auth/register'
                  className='bg-accent-blue hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm'
               >
                  Get started free
               </Link>
               <Link
                  href='/auth/login'
                  className='bg-dark-card hover:bg-dark-hover text-content-primary font-medium px-6 py-2.5 rounded-lg border border-dark-border transition-colors text-sm'
               >
                  Sign in
               </Link>
            </div>

            <div className='grid grid-cols-3 gap-4 mt-16 text-left'>
               {[
                  {
                     icon: Bot,
                     title: 'AI Breakdown',
                     desc: 'Break any task into actionable subtasks automatically',
                  },
                  {
                     icon: Target,
                     title: 'Smart Priority',
                     desc: 'Get AI-suggested priority levels for your tasks',
                  },
                  {
                     icon: MessageSquare,
                     title: 'Natural Language',
                     desc: 'Create tasks by just describing what you need to do',
                  },
               ].map((feature) => (
                  <div
                     key={feature.title}
                     className='bg-dark-card rounded-xl p-5 border border-dark-border hover:border-dark-border2 transition-colors'
                  >
                     <div className='w-8 h-8 rounded-lg bg-dark-hover flex items-center justify-center mb-3'>
                        <feature.icon className='w-4 h-4 text-accent-blue' />
                     </div>
                     <h3 className='font-semibold text-content-primary mb-1 text-sm'>
                        {feature.title}
                     </h3>
                     <p className='text-xs text-content-muted leading-relaxed'>
                        {feature.desc}
                     </p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
