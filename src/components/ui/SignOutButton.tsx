'use client';

import { useState } from 'react';
import { signOutAction } from '@/app/dashboard/actions';

export default function SignOutButton() {
   const [showConfirm, setShowConfirm] = useState(false);
   const [loading, setLoading] = useState(false);

   const handleSignOut = async () => {
      setLoading(true);
      await signOutAction();
   };

   return (
      <>
         <button
            onClick={() => setShowConfirm(true)}
            className='text-sm text-content-muted hover:text-content-primary px-3 py-1.5 rounded-lg hover:bg-dark-hover transition-colors'
         >
            Sign out
         </button>

         {showConfirm && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
               <div className='bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm'>
                  <h3 className='text-content-primary font-semibold text-base mb-2'>
                     Sign out?
                  </h3>
                  <p className='text-content-secondary text-sm mb-6'>
                     You will be redirected to the home page.
                  </p>
                  <div className='flex gap-3'>
                     <button
                        onClick={() => setShowConfirm(false)}
                        disabled={loading}
                        className='flex-1 bg-dark-hover hover:bg-dark-border text-content-primary font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50'
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleSignOut}
                        disabled={loading}
                        className='flex-1 bg-accent-red hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors'
                     >
                        {loading ? 'Signing out...' : 'Sign out'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </>
   );
}
