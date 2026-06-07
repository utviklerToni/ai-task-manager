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
   callbacks: {
      async jwt({ token, user }) {
         if (user) {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
         }
         return token;
      },
      async session({ session, token }) {
         if (token && session.user) {
            session.user.id = token.id as string;
            session.user.email = token.email as string;
            session.user.name = token.name as string;
         }
         return session;
      },
   },
   pages: {
      signIn: '/auth/login',
      error: '/auth/login',
   },
   session: { strategy: 'jwt' },
   secret: process.env.NEXTAUTH_SECRET,
});
