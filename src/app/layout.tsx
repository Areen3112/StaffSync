import type { Metadata } from 'next';
import { StoreProvider } from '@/store/provider';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'StaffSync — Intelligent HR Management System',
  description:
    'Next-generation human resource management platform engineered with Apple-inspired minimalism, role-aware governance, and modern employee workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
