'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { CheckSquare } from 'lucide-react';

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
      <div className='min-h-screen bg-dark-page flex items-center justify-center p-4'>
         <div className='bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-8'>

            {/* Logo */}
            <div className='flex flex-col items-center mb-8'>
               <div className='w-11 h-11 rounded-xl bg-dark-hover border border-dark-border flex items-center justify-center mb-4'>
                  <CheckSquare className='w-5 h-5 text-accent-blue' />
               </div>
               <h1 className='text-xl font-semibold text-content-primary'>
                  Create account
               </h1>
               <p className='text-content-muted text-sm mt-1'>
                  Start managing tasks with AI
               </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
               <div>
                  <label
                     htmlFor='name'
                     className='block text-sm text-content-secondary mb-1.5'
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
                     className='w-full px-3 py-2.5 bg-dark-hover text-content-primary border border-dark-border rounded-lg text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-colors'
                  />
               </div>

               <div>
                  <label
                     htmlFor='email'
                     className='block text-sm text-content-secondary mb-1.5'
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
                     className='w-full px-3 py-2.5 bg-dark-hover text-content-primary border border-dark-border rounded-lg text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-colors'
                  />
               </div>

               <div>
                  <label
                     htmlFor='password'
                     className='block text-sm text-content-secondary mb-1.5'
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
                     className='w-full px-3 py-2.5 bg-dark-hover text-content-primary border border-dark-border rounded-lg text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-colors'
                  />
               </div>

               {error && (
                  <div className='bg-red-950 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-lg'>
                     {error}
                  </div>
               )}

               <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-accent-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm mt-1'
               >
                  {loading ? 'Creating account...' : 'Create account'}
               </button>
            </form>

            <p className='text-center text-sm text-content-muted mt-6'>
               Already have an account?{' '}
               <Link
                  href='/auth/login'
                  className='text-accent-blue hover:underline font-medium'
               >
                  Sign in
               </Link>
            </p>
         </div>
      </div>
   );
}
