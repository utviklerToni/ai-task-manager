import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

   const { action, title, description, input } = await request.json();

   try {
      switch (action) {
         case 'breakdown':
            if (!title) {
               return NextResponse.json(
                  { error: 'Title required' },
                  { status: 400 },
               );
            }
            const breakdown = await breakdownTask(title, description);
            return NextResponse.json(breakdown);

         case 'priority':
            if (!title) {
               return NextResponse.json(
                  { error: 'Title required' },
                  { status: 400 },
               );
            }
            const priority = await suggestPriority(title, description);
            return NextResponse.json(priority);

         case 'natural-language':
            if (!input) {
               return NextResponse.json(
                  { error: 'Input required' },
                  { status: 400 },
               );
            }
            const tasks = await createTasksFromNaturalLanguage(input);
            return NextResponse.json(tasks);

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
         { status: 503 },
      );
   }
}
