import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { CreateTaskInput } from '@/types';

export async function GET(request: NextRequest) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const { searchParams } = new URL(request.url);
   const status = searchParams.get('status');
   const priority = searchParams.get('priority');
   const category = searchParams.get('category');
   const search = searchParams.get('search');

   let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

   if (status && status !== 'all') query = query.eq('status', status);
   if (priority && priority !== 'all') query = query.eq('priority', priority);
   if (category && category !== 'all') query = query.eq('category', category);
   if (search) query = query.ilike('title', `%${search}%`);

   const { data, error } = await query;

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ tasks: data });
}

export async function POST(request: NextRequest) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const body: CreateTaskInput = await request.json();

   if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
   }

   const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
         ...body,
         user_id: session.user.id,
         title: body.title.trim(),
         subtasks: body.subtasks || [],
      })
      .select()
      .single();

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ task: data }, { status: 201 });
}
