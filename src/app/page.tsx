import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
   const session = await auth();
   if (session) redirect('/dashboard');

   return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
         <div className='text-center max-w-2xl'>
            <div className='text-6xl mb-6'>✅</div>

            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
               AI Task Manager
            </h1>

            <p className='text-lg text-gray-600 mb-8'>
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
                  className='bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-200 transition-colors'
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
                     className='bg-white rounded-xl p-5 border border-gray-200'
                  >
                     <div className='text-2xl mb-2'>{feature.icon}</div>
                     <h3 className='font-semibold text-gray-900 mb-1'>
                        {feature.title}
                     </h3>
                     <p className='text-sm text-gray-500'>{feature.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
