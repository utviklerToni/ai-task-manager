'use client';

import { useState } from 'react';

const QUOTES = [
   'The secret of getting ahead is getting started.',
   'It always seems impossible until it is done.',
   'Focus on being productive instead of busy.',
   'Done is better than perfect.',
   'Small steps every day lead to big results.',
   'Your future is created by what you do today.',
   'Work hard in silence, let success make the noise.',
   'Productivity is never an accident.',
   'The way to get started is to quit talking and begin doing.',
   'You do not have to be great to start, but you must start to be great.',
];

export default function RandomQuote() {
   const [quote] = useState(
      () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
   );

   return (
      <p className='text-content-secondary text-sm italic leading-relaxed max-w-sm mt-2'>
         &ldquo;{quote}&rdquo;
      </p>
   );
}
