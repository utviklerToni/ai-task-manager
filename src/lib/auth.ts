import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { supabaseAdmin } from './supabase';

export const { handlers, auth, signIn, signOut } = NextAuth({
   providers: [
      Credentials({
         name: 'credentials',
         credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
         },

         // authorize() is called with email and password
         async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) return null;

            try {
               const { data, error } =
                  await supabaseAdmin.auth.signInWithPassword({
                     email: credentials.email as string,
                     password: credentials.password as string,
                  });

               if (error || !data.user) return null;

               return {
                  id: data.user.id,
                  email: data.user.email ?? '',
                  name: data.user.user_metadata?.name ?? data.user.email ?? '',
               };
            } catch {
               return null;
            }
         },
      }),
   ],

   // embeds the user ID into the JWT token
   callbacks: {
      async jwt({ token, user }) {
         if (user) {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
         }

         return token;
      },
   },
   pages: {
      signIn: '/auth/login',
      error: '/auth/login',
   },

   // session() callback makes user.id available anywhere we call auth()
   session: { strategy: 'jwt' },
   secret: process.env.NEXTAUTH_SECRET,
});
