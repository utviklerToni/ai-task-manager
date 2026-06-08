import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> },
) {
   const session = await auth();

   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const { id } = await params;
   const body = await request.json();

   const { data: existing, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('user_id')
      .eq('id', id)
      .single();

   if (fetchError || !existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
   }

   const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(body)
      .eq('id', id)
      .select()
      .single();

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ task: data });
}

export async function DELETE(
   request: NextRequest,
   { params }: { params: Promise<{ id: string }> },
) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   const { id } = await params;

   const { data: existing, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('user_id')
      .eq('id', id)
      .single();

   if (fetchError || !existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
   }

   const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   return NextResponse.json({ success: true });
}
