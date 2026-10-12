import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';
import {
   breakdownTask,
   suggestPriority,
   createTasksFromNaturalLanguage,
} from '@/lib/anthropic';

export async function POST(request: NextRequest) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   let body;
   try {
      body = await request.json();
   } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
   }

   if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
   }

   const { action, title, description, input } = body;

   const allowedActions = ['breakdown', 'priority', 'natural-language'];
   if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
   }

   // Validate before consuming a request so invalid input does not use quota.
   if (action === 'natural-language') {
      if (typeof input !== 'string' || !input.trim()) {
         return NextResponse.json({ error: 'Input required' }, { status: 400 });
      }
   } else {
      if (typeof title !== 'string' || !title.trim()) {
         return NextResponse.json({ error: 'Title required' }, { status: 400 });
      }
      if (description !== undefined && typeof description !== 'string') {
         return NextResponse.json(
            { error: 'Description must be text' },
            { status: 400 },
         );
      }
   }

   let headers: Record<string, string> = {};
   try {
      // A fresh client cannot inherit a user's token from credential sign-in.
      const { data: quota, error } = await createSupabaseAdminClient()
         .rpc('consume_ai_request', { p_user_id: session.user.id })
         .single<{ allowed: boolean; remaining: number; reset_at: string }>();

      // Fail closed if the database/migration is unavailable.
      if (error || !quota || typeof quota.allowed !== 'boolean') {
         console.error('AI usage check failed:', error);
         return NextResponse.json(
            { error: 'Unable to check your AI allowance. Please try again later.' },
            { status: 503 },
         );
      }

      const resetAt = new Date(quota.reset_at).getTime();
      headers = {
         'X-RateLimit-Limit': '6',
         'X-RateLimit-Remaining': String(quota.remaining),
         'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      };

      if (!quota.allowed) {
         return NextResponse.json(
            {
               error: 'You’ve used your 6 AI requests for today. Try again after midnight UTC.',
               resetAt: quota.reset_at,
            },
            {
               status: 429,
               headers: {
                  ...headers,
                  'Retry-After': String(
                     Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
                  ),
               },
            },
         );
      }

      switch (action) {
         case 'breakdown':
            const breakdown = await breakdownTask(title, description);
            return NextResponse.json(breakdown, { headers });

         case 'priority':
            const priority = await suggestPriority(title, description);
            return NextResponse.json(priority, { headers });

         case 'natural-language':
            const tasks = await createTasksFromNaturalLanguage(input);
            return NextResponse.json(tasks, { headers });

         default:
            return NextResponse.json(
               { error: 'Invalid action' },
               { status: 400 },
            );
      }
   } catch (error) {
      console.error('AI API error:', error);
      return NextResponse.json(
         { error: 'AI service unavailable' },
         { status: 503, headers },
      );
   }
}
