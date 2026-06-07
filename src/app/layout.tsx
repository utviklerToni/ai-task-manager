import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
   title: 'AI Task Manager',
   description: 'Manage your tasks with AI assistance',
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang='en'>
         <body className={inter.className}>
            {/* wrapper to make session data available to any Client Component that calls useSession() */}
            <SessionProvider>{children}</SessionProvider>
         </body>
      </html>
   );
}
