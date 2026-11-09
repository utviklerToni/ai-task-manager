import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
   deleteEmptyGroups,
   stripGroupFields,
   TASK_SELECT,
} from '@/lib/taskGroups';
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
      .select(TASK_SELECT)
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

   const body = stripGroupFields(await request.json()) as CreateTaskInput;

   if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
   }

   if (body.title.length > 255) {
      return NextResponse.json(
         { error: 'Title must be under 255 characters' },
         { status: 400 },
      );
   }

   if (body.description && body.description.length > 2000) {
      return NextResponse.json(
         { error: 'Description must be under 2000 characters' },
         { status: 400 },
      );
   }

   const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
         ...body,
         user_id: session.user.id,
         title: body.title.trim(),
         subtasks: body.subtasks || [],
      })
      .select(TASK_SELECT)
      .single();

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ task: data }, { status: 201 });
}

const MAX_BULK_DELETE = 500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deletes several of the signed-in user's tasks at once: { ids: string[] }.
export async function DELETE(request: NextRequest) {
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

   const ids = body?.ids;
   if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > MAX_BULK_DELETE ||
      !ids.every((id) => typeof id === 'string' && UUID.test(id))
   ) {
      return NextResponse.json(
         { error: `ids must be 1-${MAX_BULK_DELETE} task ids` },
         { status: 400 },
      );
   }

   // The user_id filter means ids belonging to other users are silently ignored.
   const { data, error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('user_id', session.user.id)
      .in('id', ids)
      .select('id, group_id');

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   const deleted = data || [];
   await deleteEmptyGroups(
      session.user.id,
      deleted.map((t) => t.group_id),
   );

   return NextResponse.json({ deletedIds: deleted.map((t) => t.id) });
}
