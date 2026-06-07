import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';

export default async function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const session = await auth();
   if (!session) redirect('/auth/login');

   return (
      <div className='min-h-screen bg-dark-page'>
         <nav className='bg-dark-card border-b border-dark-border px-4 py-3'>
            <div className='max-w-6xl mx-auto flex items-center justify-between'>
               <Link href='/dashboard' className='flex items-center gap-2.5'>
                  <CheckSquare className='w-5 h-5 text-accent-blue' />
                  <span className='font-semibold text-content-primary text-sm'>
                     AI Task Manager
                  </span>
               </Link>

               <div className='flex items-center gap-3'>
                  <span className='text-sm text-content-secondary'>
                     {session.user?.name || session.user?.email}
                  </span>
                  <form
                     action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/' });
                     }}
                  >
                     <button
                        type='submit'
                        className='text-sm text-content-muted hover:text-content-primary px-3 py-1.5 rounded-lg hover:bg-dark-hover transition-colors'
                     >
                        Sign out
                     </button>
                  </form>
               </div>
            </div>
         </nav>

         <main className='max-w-6xl mx-auto p-4 md:p-6'>{children}</main>
      </div>
   );
}
