import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
   const { name, email, password } = await request.json();

   if (!email || !password || !name) {
      return NextResponse.json(
         { error: 'All fields required' },
         { status: 400 },
      );
   }

   if (password.length < 6) {
      return NextResponse.json(
         { error: 'Password must be at least 6 characters' },
         { status: 400 },
      );
   }

   const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
   });

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
   }

   return NextResponse.json({ user: data.user }, { status: 201 });
}
