import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
   const session = await auth();
   if (session) redirect('/dashboard');

   return (
      <div className='min-h-screen bg-dark-page flex items-center justify-center p-4'>
         <div className='text-center max-w-2xl'>
            <div className='text-6xl mb-6'>✅</div>

            <h1 className='text-4xl font-bold text-content-primary mb-4'>
               AI Task Manager
            </h1>

            <p className='text-lg text-content-secondary mb-8'>
               Manage your tasks smarter with AI-powered breakdowns, priority
               suggestions, and natural language task creation.
            </p>

            <div className='flex gap-4 justify-center'>
               <Link
                  href='/auth/register'
                  className='bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors'
               >
                  Get started free
               </Link>
               <Link
                  href='/auth/login'
                  className='bg-dark-card hover:bg-dark-hover text-content-primary font-medium px-6 py-3 rounded-lg border border-dark-border transition-colors'
               >
                  Sign in
               </Link>
            </div>

            <div className='grid grid-cols-3 gap-6 mt-16 text-left'>
               {[
                  {
                     icon: '🤖',
                     title: 'AI Breakdown',
                     desc: 'Break any task into actionable subtasks automatically',
                  },
                  {
                     icon: '🎯',
                     title: 'Smart Priority',
                     desc: 'Get AI-suggested priority levels for your tasks',
                  },
                  {
                     icon: '💬',
                     title: 'Natural Language',
                     desc: 'Create tasks by just describing what you need to do',
                  },
               ].map((feature) => (
                  <div
                     key={feature.title}
                     className='bg-dark-card rounded-xl p-5 border border-dark-border'
                  >
                     <div className='text-2xl mb-2'>{feature.icon}</div>
                     <h3 className='font-semibold text-content-primary mb-1'>
                        {feature.title}
                     </h3>
                     <p className='text-sm text-content-muted'>{feature.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
