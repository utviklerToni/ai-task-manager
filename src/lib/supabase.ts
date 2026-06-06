import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
   const cookieStore = await cookies();

   // reads auth cookies automatically so it knows which user is making the request.
   return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
         cookies: {
            getAll() {
               return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
               try {
                  cookiesToSet.forEach(({ name, value, options }) =>
                     cookieStore.set(name, value, options),
                  );
               } catch {}
            },
         },
      },
   );
}

// admin client bypasses RLS — needed for operations like creating a new user account where there's no session yet.
export const supabaseAdmin = createClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!,
   {
      auth: {
         autoRefreshToken: false,
         persistSession: false,
      },
   },
);
