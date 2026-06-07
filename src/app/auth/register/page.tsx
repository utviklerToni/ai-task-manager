'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
   const router = useRouter();
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (password.length < 6) {
         setError('Password must be at least 6 characters');
         return;
      }

      setLoading(true);

      try {
         const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
         });

         const data = await res.json();

         if (!res.ok) {
            setError(data.error || 'Registration failed');
            setLoading(false);
            return;
         }

         await signIn('credentials', {
            email,
            password,
            redirect: false,
         });

         router.push('/dashboard');
      } catch {
         setError('Something went wrong. Please try again.');
         setLoading(false);
      }
   };

   return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
         <div className='bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8'>
            <div className='text-center mb-8'>
               <div className='text-3xl mb-2'>✅</div>
               <h1 className='text-2xl font-bold text-gray-900'>
                  Create account
               </h1>
               <p className='text-gray-500 mt-1 text-sm'>
                  Start managing tasks with AI
               </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
               <div>
                  <label
                     htmlFor='name'
                     className='block text-sm font-medium text-gray-700 mb-1'
                  >
                     Name
                  </label>
                  <input
                     id='name'
                     type='text'
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder='Your name'
                     required
                     className='w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
               </div>

               <div>
                  <label
                     htmlFor='email'
                     className='block text-sm font-medium text-gray-700 mb-1'
                  >
                     Email
                  </label>
                  <input
                     id='email'
                     type='email'
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder='you@example.com'
                     required
                     className='w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
               </div>

               <div>
                  <label
                     htmlFor='password'
                     className='block text-sm font-medium text-gray-700 mb-1'
                  >
                     Password
                  </label>
                  <input
                     id='password'
                     type='password'
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder='Min 6 characters'
                     required
                     className='w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
               </div>

               {error && (
                  <div className='bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg'>
                     {error}
                  </div>
               )}

               <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm'
               >
                  {loading ? 'Creating account...' : 'Create account'}
               </button>
            </form>

            <p className='text-center text-sm text-gray-500 mt-6'>
               Already have an account?{' '}
               <Link
                  href='/auth/login'
                  className='text-blue-600 hover:underline font-medium'
               >
                  Sign in
               </Link>
            </p>
         </div>
      </div>
   );
}
