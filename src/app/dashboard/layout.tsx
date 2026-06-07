import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const session = await auth();
   if (!session) redirect('/auth/login');

   return (
      <div className='min-h-screen bg-gray-50'>
         <nav className='bg-white border-b border-gray-200 px-4 py-3'>
            <div className='max-w-6xl mx-auto flex items-center justify-between'>
               <Link href='/dashboard' className='flex items-center gap-2'>
                  <span className='text-xl'>✅</span>
                  <span className='font-bold text-gray-900'>
                     AI Task Manager
                  </span>
               </Link>

               <div className='flex items-center gap-4'>
                  <span className='text-sm text-gray-500'>
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
                        className='text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors'
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
