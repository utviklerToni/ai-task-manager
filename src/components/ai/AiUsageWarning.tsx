import { TriangleAlert } from 'lucide-react';

export default function AiUsageWarning() {
   return (
      <div className='flex items-start gap-2 rounded-lg border border-accent-anthropic/40 bg-accent-anthropic/10 p-3 text-xs text-accent-anthropic'>
         <TriangleAlert aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0' />
         <p>
            <strong className='font-semibold'>6 AI requests per day.</strong>{' '}
            Each use counts toward your shared limit for task generation,
            breakdowns, and priority suggestions, even if AI cannot complete it.
            Your limit resets at midnight UTC.
         </p>
      </div>
   );
}
